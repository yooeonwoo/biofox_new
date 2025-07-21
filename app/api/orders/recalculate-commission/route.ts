import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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
    const { order_ids, shop_id, date_from, date_to } = body

    // 조건에 맞는 주문들 조회
    let query = supabase
      .from('orders')
      .select(`
        id,
        shop_id,
        total_amount,
        commission_rate,
        commission_amount,
        shop:profiles!shop_id (
          id,
          name,
          shop_name
        )
      `)

    if (order_ids?.length > 0) {
      query = query.in('id', order_ids)
    }
    if (shop_id) {
      query = query.eq('shop_id', shop_id)
    }
    if (date_from) {
      query = query.gte('order_date', date_from)
    }
    if (date_to) {
      query = query.lte('order_date', date_to)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) throw ordersError

    const changes = []
    let total_commission_before = 0
    let total_commission_after = 0

    // 각 주문에 대해 수수료 재계산
    for (const order of orders || []) {
      // 해당 샵의 소속 KOL/OL 찾기
      const { data: relationship } = await supabase
        .from('shop_relationships')
        .select(`
          parent:profiles!parent_id (
            id,
            role,
            commission_rate
          )
        `)
        .eq('shop_owner_id', order.shop_id)
        .eq('is_active', true)
        .single()

      let new_commission_rate = 0
      let new_commission_amount = 0

      if (relationship?.parent) {
        // KOL: 30%, OL: 20%
        if (relationship.parent.role === 'kol') {
          new_commission_rate = relationship.parent.commission_rate || 30
        } else if (relationship.parent.role === 'ol') {
          new_commission_rate = relationship.parent.commission_rate || 20
        }
        
        new_commission_amount = (order.total_amount * new_commission_rate) / 100
      }

      // 변경사항 기록
      if (order.commission_amount !== new_commission_amount) {
        changes.push({
          order_id: order.id,
          old_commission: order.commission_amount || 0,
          new_commission: new_commission_amount
        })

        total_commission_before += order.commission_amount || 0
        total_commission_after += new_commission_amount

        // 수수료 업데이트
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            commission_rate: new_commission_rate,
            commission_amount: new_commission_amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (updateError) throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      affected_count: changes.length,
      total_commission_before,
      total_commission_after,
      changes
    })

  } catch (error) {
    console.error('Commission recalculation error:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate commissions' },
      { status: 500 }
    )
  }
}