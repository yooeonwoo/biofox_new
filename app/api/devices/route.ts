import { createServerClient } from '@/utils/supabase/server'
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const shop_id = searchParams.get('shop_id')
    const kol_id = searchParams.get('kol_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const sortBy = searchParams.get('sortBy') || 'sale_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 기기 판매 조회
    let query = supabase
      .from('device_sales')
      .select(`
        *,
        shop:profiles!shop_id (
          id,
          name,
          shop_name,
          email,
          region
        ),
        created_by_user:profiles!created_by (
          name
        )
      `, { count: 'exact' })

    // 필터 적용
    if (shop_id) {
      query = query.eq('shop_id', shop_id)
    }

    if (kol_id) {
      // KOL의 소속 샵들 찾기
      const { data: relationships } = await supabase
        .from('shop_relationships')
        .select('shop_owner_id')
        .eq('parent_id', kol_id)
        .eq('is_active', true)

      const shopIds = relationships?.map(r => r.shop_owner_id) || []
      if (shopIds.length > 0) {
        query = query.in('shop_id', shopIds)
      }
    }

    if (date_from) {
      query = query.gte('sale_date', date_from)
    }
    if (date_to) {
      query = query.lte('sale_date', date_to)
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // KOL 정보 추가
    const salesWithKol = await Promise.all((data || []).map(async (sale) => {
      const { data: relationship } = await supabase
        .from('shop_relationships')
        .select(`
          parent:profiles!parent_id (
            id,
            name,
            role
          )
        `)
        .eq('shop_owner_id', sale.shop_id)
        .eq('is_active', true)
        .single()

      return {
        ...sale,
        kol: relationship?.parent || null
      }
    }))

    // 요약 통계
    const { data: summary } = await supabase
      .from('device_sales')
      .select('quantity, actual_commission')

    const totalSold = summary?.reduce((sum, s) => sum + (s.quantity > 0 ? s.quantity : 0), 0) || 0
    const totalReturned = summary?.reduce((sum, s) => sum + (s.quantity < 0 ? Math.abs(s.quantity) : 0), 0) || 0
    const totalCommission = summary?.reduce((sum, s) => sum + (s.actual_commission || 0), 0) || 0

    return NextResponse.json({
      data: salesWithKol,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: to < (count || 0) - 1,
        hasPrev: from > 0
      },
      summary: {
        total_sold: totalSold,
        total_returned: totalReturned,
        net_devices: totalSold - totalReturned,
        total_commission: totalCommission
      }
    })

  } catch (error) {
    console.error('Device sales fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device sales' },
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
    const { shop_id, sale_date, quantity, device_name, serial_numbers, notes } = body

    // 해당 샵의 KOL 찾기
    const { data: relationship } = await supabase
      .from('shop_relationships')
      .select(`
        parent:profiles!parent_id (
          id,
          role,
          commission_rate
        )
      `)
      .eq('shop_owner_id', shop_id)
      .eq('is_active', true)
      .single()

    if (!relationship?.parent) {
      return NextResponse.json(
        { error: 'Shop has no active KOL/OL relationship' },
        { status: 400 }
      )
    }

    // KOL의 누적 대수 조회
    const { data: accumulator } = await supabase
      .from('kol_device_accumulator')
      .select('*')
      .eq('kol_id', relationship.parent.id)
      .single()

    let currentTier = 'tier_1_4'
    let currentNetDevices = 0

    if (accumulator) {
      currentNetDevices = accumulator.net_devices_sold || 0
    }

    // 새 판매 후 누적 대수
    const newNetDevices = currentNetDevices + quantity

    // 티어 결정
    if (quantity > 0) {
      // 판매인 경우 현재 티어 기준
      currentTier = currentNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4'
    } else {
      // 반품인 경우 반품 후 티어 기준
      currentTier = newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4'
    }

    // 수수료 계산
    const commissionPerUnit = currentTier === 'tier_5_plus' ? 2500000 : 1500000
    const standardCommission = Math.abs(quantity) * commissionPerUnit
    const actualCommission = quantity * commissionPerUnit // 반품시 음수

    // 기기 판매 기록 생성
    const { data: deviceSale, error: saleError } = await supabase
      .from('device_sales')
      .insert({
        shop_id,
        sale_date,
        quantity,
        device_name: device_name || '마이크로젯',
        tier_at_sale: currentTier,
        standard_commission: standardCommission,
        actual_commission: actualCommission,
        serial_numbers,
        notes,
        created_by: user.id
      })
      .select()
      .single()

    if (saleError) throw saleError

    // KOL 누적 대수 업데이트
    if (accumulator) {
      const { error: updateError } = await supabase
        .from('kol_device_accumulator')
        .update({
          total_devices_sold: accumulator.total_devices_sold + (quantity > 0 ? quantity : 0),
          total_devices_returned: accumulator.total_devices_returned + (quantity < 0 ? Math.abs(quantity) : 0),
          current_tier: newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4',
          tier_changed_at: accumulator.current_tier !== (newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4') 
            ? new Date().toISOString() 
            : accumulator.tier_changed_at,
          last_updated: new Date().toISOString()
        })
        .eq('kol_id', relationship.parent.id)

      if (updateError) throw updateError
    } else {
      // 첫 판매인 경우 누적 레코드 생성
      const { error: insertError } = await supabase
        .from('kol_device_accumulator')
        .insert({
          kol_id: relationship.parent.id,
          total_devices_sold: quantity > 0 ? quantity : 0,
          total_devices_returned: quantity < 0 ? Math.abs(quantity) : 0,
          current_tier: newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4',
          tier_1_4_count: currentTier === 'tier_1_4' ? Math.abs(quantity) : 0,
          tier_5_plus_count: currentTier === 'tier_5_plus' ? Math.abs(quantity) : 0
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ data: deviceSale })

  } catch (error) {
    console.error('Device sale creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create device sale' },
      { status: 500 }
    )
  }
}