import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
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

    const { data, error } = await supabase
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
      `)
      .eq('id', params.deviceId)
      .single()

    if (error) throw error

    // KOL 정보 추가
    const { data: relationship } = await supabase
      .from('shop_relationships')
      .select(`
        parent:profiles!parent_id (
          id,
          name,
          role
        )
      `)
      .eq('shop_owner_id', data.shop_id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      data: {
        ...data,
        kol: relationship?.parent || null
      }
    })

  } catch (error) {
    console.error('Device sale fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device sale' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { deviceId: string } }
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
    const { shop_id, sale_date, quantity, device_name, serial_numbers, notes } = body

    // 기존 데이터 조회
    const { data: oldSale } = await supabase
      .from('device_sales')
      .select('*')
      .eq('id', params.deviceId)
      .single()

    if (!oldSale) {
      return NextResponse.json({ error: 'Device sale not found' }, { status: 404 })
    }

    // 수량 변경에 따른 누적 대수 업데이트
    const quantityDiff = quantity - oldSale.quantity

    if (quantityDiff !== 0) {
      // 해당 샵의 KOL 찾기
      const { data: relationship } = await supabase
        .from('shop_relationships')
        .select('parent_id')
        .eq('shop_owner_id', shop_id)
        .eq('is_active', true)
        .single()

      if (relationship?.parent_id) {
        // KOL 누적 업데이트
        const { data: accumulator } = await supabase
          .from('kol_device_accumulator')
          .select('*')
          .eq('kol_id', relationship.parent_id)
          .single()

        if (accumulator) {
          const newSold = accumulator.total_devices_sold + (quantityDiff > 0 ? quantityDiff : 0)
          const newReturned = accumulator.total_devices_returned + (quantityDiff < 0 ? Math.abs(quantityDiff) : 0)
          const newNet = newSold - newReturned
          const newTier = newNet >= 5 ? 'tier_5_plus' : 'tier_1_4'

          await supabase
            .from('kol_device_accumulator')
            .update({
              total_devices_sold: newSold,
              total_devices_returned: newReturned,
              current_tier: newTier,
              tier_changed_at: accumulator.current_tier !== newTier ? new Date().toISOString() : accumulator.tier_changed_at,
              last_updated: new Date().toISOString()
            })
            .eq('kol_id', relationship.parent_id)
        }
      }
    }

    // 기기 판매 업데이트
    const { data, error } = await supabase
      .from('device_sales')
      .update({
        shop_id,
        sale_date,
        quantity,
        device_name,
        serial_numbers,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.deviceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Device sale update error:', error)
    return NextResponse.json(
      { error: 'Failed to update device sale' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { deviceId: string } }
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

    // 삭제 전 데이터 조회
    const { data: sale } = await supabase
      .from('device_sales')
      .select('*')
      .eq('id', params.deviceId)
      .single()

    if (!sale) {
      return NextResponse.json({ error: 'Device sale not found' }, { status: 404 })
    }

    // KOL 누적 대수 업데이트
    const { data: relationship } = await supabase
      .from('shop_relationships')
      .select('parent_id')
      .eq('shop_owner_id', sale.shop_id)
      .eq('is_active', true)
      .single()

    if (relationship?.parent_id) {
      const { data: accumulator } = await supabase
        .from('kol_device_accumulator')
        .select('*')
        .eq('kol_id', relationship.parent_id)
        .single()

      if (accumulator) {
        // 삭제되는 판매 데이터 반영
        const newSold = accumulator.total_devices_sold - (sale.quantity > 0 ? sale.quantity : 0)
        const newReturned = accumulator.total_devices_returned - (sale.quantity < 0 ? Math.abs(sale.quantity) : 0)
        const newNet = newSold - newReturned
        const newTier = newNet >= 5 ? 'tier_5_plus' : 'tier_1_4'

        await supabase
          .from('kol_device_accumulator')
          .update({
            total_devices_sold: Math.max(0, newSold),
            total_devices_returned: Math.max(0, newReturned),
            current_tier: newTier,
            last_updated: new Date().toISOString()
          })
          .eq('kol_id', relationship.parent_id)
      }
    }

    // 기기 판매 삭제
    const { error } = await supabase
      .from('device_sales')
      .delete()
      .eq('id', params.deviceId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Device sale delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete device sale' },
      { status: 500 }
    )
  }
}