import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { commissionId: string } }
) {
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

    // 수수료 계산 조회
    const { data: commission, error } = await supabase
      .from('commission_calculations')
      .select(`
        *,
        kol:profiles!kol_id (
          id,
          name,
          role,
          shop_name,
          email,
          bank_info
        )
      `)
      .eq('id', params.commissionId)
      .single()

    if (error) throw error

    // 상세 내역 조회
    const startDate = `${commission.calculation_month}-01`
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1) - 1).toISOString().split('T')[0]

    // 소속 샵들
    const { data: subordinateShops } = await supabase
      .from('shop_relationships')
      .select(`
        shop_owner:profiles!shop_owner_id (
          id,
          name,
          shop_name
        )
      `)
      .eq('parent_id', commission.kol_id)
      .eq('is_active', true)

    // 각 샵별 매출 및 수수료
    const subordinateDetails = await Promise.all((subordinateShops || []).map(async (rel) => {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, commission_amount')
        .eq('shop_id', rel.shop_owner.id)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .eq('is_self_shop_order', false)

      const sales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const commission = orders?.reduce((sum, o) => sum + (o.commission_amount || 0), 0) || 0

      return {
        shop_id: rel.shop_owner.id,
        shop_name: rel.shop_owner.shop_name,
        sales,
        commission_rate: commission.kol.role === 'kol' ? 30 : 20,
        commission_amount: commission
      }
    }))

    // 본인샵 매출
    const { data: selfShopOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('shop_id', commission.kol_id)
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .eq('is_self_shop_order', true)

    const selfShopSales = selfShopOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

    // 기기 판매 상세
    const { data: deviceSales } = await supabase
      .from('device_sales')
      .select(`
        *,
        shop:profiles!shop_id (
          shop_name
        )
      `)
      .in('shop_id', subordinateShops?.map(s => s.shop_owner.id) || [])
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)

    // 조정 내역
    const adjustments = commission.adjustments || []

    return NextResponse.json({
      id: commission.id,
      kol: commission.kol,
      calculation_month: commission.calculation_month,
      details: {
        subordinate_shops: subordinateDetails.filter(d => d.commission_amount > 0),
        self_shop: {
          sales: selfShopSales,
          commission_amount: commission.self_shop_commission
        },
        devices: deviceSales?.map(d => ({
          sale_id: d.id,
          shop_name: d.shop.shop_name,
          quantity: d.quantity,
          tier: d.tier_at_sale,
          commission_per_unit: d.standard_commission / Math.abs(d.quantity),
          total_commission: d.actual_commission
        })) || []
      },
      adjustments,
      total_commission: commission.total_commission,
      status: commission.status,
      payment: commission.payment_info || null
    })

  } catch (error) {
    console.error('Commission detail fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { commissionId: string } }
) {
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
    const { adjustment_amount, adjustment_reason, status, payment_info } = body

    // 현재 수수료 정보 조회
    const { data: current } = await supabase
      .from('commission_calculations')
      .select('*')
      .eq('id', params.commissionId)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // 조정 금액이 있는 경우
    if (adjustment_amount !== undefined && adjustment_reason) {
      const newAdjustments = [
        ...(current.adjustments || []),
        {
          amount: adjustment_amount,
          reason: adjustment_reason,
          adjusted_by: {
            id: user.id,
            name: profile.name
          },
          adjusted_at: new Date().toISOString()
        }
      ]
      
      updates.adjustments = newAdjustments
      updates.total_commission = current.subordinate_shop_commission + 
                                current.self_shop_commission + 
                                current.device_commission + 
                                adjustment_amount
      updates.status = 'adjusted'
    }

    // 상태 변경
    if (status) {
      updates.status = status
    }

    // 지급 정보
    if (payment_info) {
      updates.payment_info = {
        ...payment_info,
        paid_at: new Date().toISOString()
      }
      updates.status = 'paid'
    }

    const { data, error } = await supabase
      .from('commission_calculations')
      .update(updates)
      .eq('id', params.commissionId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Commission update error:', error)
    return NextResponse.json(
      { error: 'Failed to update commission' },
      { status: 500 }
    )
  }
}