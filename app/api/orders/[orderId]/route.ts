import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 주문 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { orderId } = params;

    // 주문 조회
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        shop:profiles!shop_id(
          id,
          name,
          shop_name,
          email,
          role
        ),
        created_by_user:profiles!created_by(
          id,
          name
        ),
        order_items(
          id,
          product_id,
          product_name,
          product_code,
          quantity,
          unit_price,
          subtotal
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 소속 관계 정보 추가
    const { data: relationship } = await supabase
      .from('shop_relationships')
      .select(`
        parent:profiles!parent_id(
          id,
          name,
          role
        )
      `)
      .eq('shop_owner_id', order.shop_id)
      .lte('started_at', order.order_date)
      .or(`ended_at.is.null,ended_at.gte.${order.order_date}`)
      .single();

    const response = {
      ...order,
      shop: {
        ...order.shop,
        parent: relationship?.parent || null
      },
      commission: {
        rate: order.commission_rate || 0,
        amount: order.commission_amount || 0,
        status: order.commission_status || 'calculated'
      }
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 주문 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { orderId } = params;
    const body = await request.json();
    const { shop_id, order_date, order_number, items, is_self_shop_order, notes } = body;

    // 기존 주문 확인
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 총 금액 재계산
    const total_amount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // 수수료 재계산 (shop_id나 order_date가 변경된 경우)
    let commission_rate = existingOrder.commission_rate;
    let commission_amount = existingOrder.commission_amount;

    if (shop_id !== existingOrder.shop_id || order_date !== existingOrder.order_date) {
      // 새로운 소속 관계 조회
      const { data: relationship } = await supabase
        .from('shop_relationships')
        .select(`
          parent:profiles!parent_id(
            id,
            role,
            commission_rate
          )
        `)
        .eq('shop_owner_id', shop_id)
        .lte('started_at', order_date)
        .or(`ended_at.is.null,ended_at.gte.${order_date}`)
        .single();

      if (relationship?.parent) {
        if (relationship.parent.role === 'kol') {
          commission_rate = relationship.parent.commission_rate || 30;
        } else if (relationship.parent.role === 'ol') {
          commission_rate = relationship.parent.commission_rate || 20;
        }
        commission_amount = total_amount * (commission_rate / 100);
      } else {
        commission_rate = 0;
        commission_amount = 0;
      }
    } else {
      // 금액만 변경된 경우 기존 비율로 재계산
      commission_amount = total_amount * (commission_rate / 100);
    }

    // 주문 업데이트
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shop_id,
        order_date,
        order_number,
        total_amount,
        commission_rate,
        commission_amount,
        is_self_shop_order,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('주문 수정 오류:', updateError);
      return NextResponse.json({ error: '주문 수정 실패' }, { status: 500 });
    }

    // 기존 아이템 삭제
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    // 새 아이템 생성
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_code: item.product_code || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('주문 아이템 수정 오류:', itemsError);
      return NextResponse.json({ error: '주문 아이템 수정 실패' }, { status: 500 });
    }

    // 수정된 주문 조회
    const { data: updatedOrder } = await supabase
      .from('orders')
      .select(`
        *,
        shop:profiles!shop_id(
          id,
          name,
          shop_name,
          email
        ),
        order_items(
          id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `)
      .eq('id', orderId)
      .single();

    return NextResponse.json({ data: updatedOrder });
  } catch (error) {
    console.error('주문 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 주문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { orderId } = params;

    // 주문 확인
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 수수료가 이미 지급된 경우 삭제 불가
    if (order.commission_status === 'paid') {
      return NextResponse.json({ error: '수수료가 지급된 주문은 삭제할 수 없습니다.' }, { status: 400 });
    }

    // 주문 삭제 (cascade로 order_items도 삭제됨)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('주문 삭제 오류:', deleteError);
      return NextResponse.json({ error: '주문 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
