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
    const period = searchParams.get('period') || 'monthly'
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const group_by = searchParams.get('group_by') || 'date'

    // 기간별 통계 조회
    let query = supabase
      .from('device_sales')
      .select(`
        *,
        shop:profiles!shop_id (
          id,
          name,
          shop_name,
          region
        )
      `)

    if (start_date) {
      query = query.gte('sale_date', start_date)
    }
    if (end_date) {
      query = query.lte('sale_date', end_date)
    }

    const { data: sales, error } = await query

    if (error) throw error

    // 데이터 그룹화
    const groupedData = new Map()

    for (const sale of sales || []) {
      let key = ''
      
      switch (group_by) {
        case 'date':
          if (period === 'daily') {
            key = sale.sale_date
          } else if (period === 'weekly') {
            const date = new Date(sale.sale_date)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            key = weekStart.toISOString().split('T')[0]
          } else if (period === 'monthly') {
            key = sale.sale_date.substring(0, 7)
          } else if (period === 'yearly') {
            key = sale.sale_date.substring(0, 4)
          }
          break
        case 'shop':
          key = sale.shop?.shop_name || 'Unknown'
          break
        case 'kol':
          // KOL별 그룹화는 추가 조회 필요
          key = 'temp'
          break
        case 'region':
          key = sale.shop?.region || 'Unknown'
          break
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          sold: 0,
          returned: 0,
          net: 0,
          commission: 0
        })
      }

      const group = groupedData.get(key)
      if (sale.quantity > 0) {
        group.sold += sale.quantity
      } else {
        group.returned += Math.abs(sale.quantity)
      }
      group.net = group.sold - group.returned
      group.commission += sale.actual_commission || 0
    }

    // 차트 데이터 변환
    const chartData = Array.from(groupedData.entries()).map(([label, data]) => ({
      label,
      ...data
    }))

    // KOL별 최고 성과자 조회
    const { data: topPerformers } = await supabase
      .from('kol_device_accumulator')
      .select(`
        *,
        kol:profiles!kol_id (
          id,
          name,
          role
        )
      `)
      .order('net_devices_sold', { ascending: false })
      .limit(10)

    // 전체 요약
    const summary = {
      total_sold: sales?.reduce((sum, s) => sum + (s.quantity > 0 ? s.quantity : 0), 0) || 0,
      total_returned: sales?.reduce((sum, s) => sum + (s.quantity < 0 ? Math.abs(s.quantity) : 0), 0) || 0,
      net_devices: 0,
      total_commission: sales?.reduce((sum, s) => sum + (s.actual_commission || 0), 0) || 0,
      average_per_shop: 0
    }
    
    summary.net_devices = summary.total_sold - summary.total_returned
    
    // 샵 수 계산
    const uniqueShops = new Set(sales?.map(s => s.shop_id))
    summary.average_per_shop = uniqueShops.size > 0 ? summary.net_devices / uniqueShops.size : 0

    return NextResponse.json({
      summary,
      chart_data: chartData.sort((a, b) => a.label.localeCompare(b.label)),
      top_performers: (topPerformers || []).map(p => ({
        id: p.kol?.id,
        name: p.kol?.name,
        role: p.kol?.role,
        devices_sold: p.net_devices_sold || 0,
        current_tier: p.current_tier,
        commission_earned: 0 // 추후 계산 필요
      }))
    })

  } catch (error) {
    console.error('Device statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device statistics' },
      { status: 500 }
    )
  }
}