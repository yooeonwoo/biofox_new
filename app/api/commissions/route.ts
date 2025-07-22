import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM
    const kol_id = searchParams.get('kol_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 수수료 계산 조회
    let query = supabase
      .from('commission_calculations')
      .select(`
        *,
        kol:profiles!kol_id (
          id,
          name,
          shop_name,
          email,
          bank_info
        )
      `, { count: 'exact' })

    if (month) {
      query = query.eq('calculation_month', month)
    }
    if (kol_id) {
      query = query.eq('kol_id', kol_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // 정렬 및 페이지네이션
    query = query
      .order('calculation_month', { ascending: false })
      .order('total_commission', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // 요약 통계
    const { data: summary } = await supabase
      .from('commission_calculations')
      .select('status, total_commission')
      .eq('calculation_month', month || new Date().toISOString().substring(0, 7))

    const summaryStats = {
      total_amount: summary?.reduce((sum, c) => sum + (c.total_commission || 0), 0) || 0,
      calculated_amount: summary?.filter(c => c.status === 'calculated').reduce((sum, c) => sum + (c.total_commission || 0), 0) || 0,
      paid_amount: summary?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.total_commission || 0), 0) || 0,
      pending_amount: 0
    }
    summaryStats.pending_amount = summaryStats.calculated_amount

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      },
      summary: summaryStats
    })

  } catch (error) {
    console.error('Commission fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { month } = body // YYYY-MM

    // 해당 월의 시작일과 종료일
    const startDate = `${month}-01`
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1) - 1).toISOString().split('T')[0]

    // 모든 KOL/OL 조회
    const { data: kols } = await supabase
      .from('profiles')
      .select('id, name, role, commission_rate')
      .in('role', ['kol', 'ol'])
      .eq('status', 'approved')

    const calculations = []

    for (const kol of kols || []) {
      // 1. 소속 샵들의 주문 수수료
      const { data: subordinateOrders } = await supabase
        .from('orders')
        .select('commission_amount')
        .in('shop_id', 
          supabase
            .from('shop_relationships')
            .select('shop_owner_id')
            .eq('parent_id', kol.id)
            .eq('is_active', true)
        )
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .eq('is_self_shop_order', false)

      const subordinateCommission = subordinateOrders?.reduce((sum, o) => sum + (o.commission_amount || 0), 0) || 0

      // 2. 본인샵 주문 수수료
      const { data: selfOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('shop_id', kol.id)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .eq('is_self_shop_order', true)

      const selfShopSales = selfOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const selfShopCommission = selfShopSales * (kol.commission_rate || (kol.role === 'kol' ? 30 : 20)) / 100

      // 3. 기기 판매 수수료
      const { data: deviceSales } = await supabase
        .from('device_sales')
        .select('actual_commission')
        .in('shop_id',
          supabase
            .from('shop_relationships')
            .select('shop_owner_id')
            .eq('parent_id', kol.id)
            .eq('is_active', true)
        )
        .gte('sale_date', startDate)
        .lte('sale_date', endDate)

      const deviceCommission = deviceSales?.reduce((sum, d) => sum + (d.actual_commission || 0), 0) || 0

      // 총 수수료
      const totalCommission = subordinateCommission + selfShopCommission + deviceCommission

      if (totalCommission > 0) {
        // 기존 계산 확인
        const { data: existing } = await supabase
          .from('commission_calculations')
          .select('id')
          .eq('kol_id', kol.id)
          .eq('calculation_month', month)
          .single()

        if (existing) {
          // 업데이트
          await supabase
            .from('commission_calculations')
            .update({
              subordinate_shop_commission: subordinateCommission,
              self_shop_commission: selfShopCommission,
              device_commission: deviceCommission,
              total_commission: totalCommission,
              status: 'calculated',
              calculated_at: new Date().toISOString(),
              calculated_by: user.id
            })
            .eq('id', existing.id)
        } else {
          // 신규 생성
          const { data: newCalc } = await supabase
            .from('commission_calculations')
            .insert({
              kol_id: kol.id,
              calculation_month: month,
              subordinate_shop_commission: subordinateCommission,
              self_shop_commission: selfShopCommission,
              device_commission: deviceCommission,
              total_commission: totalCommission,
              status: 'calculated',
              calculated_at: new Date().toISOString(),
              calculated_by: user.id
            })
            .select()
            .single()

          if (newCalc) {
            calculations.push(newCalc)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${month} 수수료 계산 완료`,
      calculated_count: calculations.length
    })

  } catch (error) {
    console.error('Commission calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate commissions' },
      { status: 500 }
    )
  }
}