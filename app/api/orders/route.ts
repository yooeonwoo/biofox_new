import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 주문 목록 조회
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const shopId = searchParams.get('shop_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const hasCommission = searchParams.get('has_commission');
    const isSelfShop = searchParams.get('is_self_shop');
    const sortBy = searchParams.get('sortBy') || 'order_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 기본 쿼리 빌드
    let query = supabase
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
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `, { count: 'exact' });

    // 필터 적용
    if (shopId) query = query.eq('shop_id', shopId);
    if (dateFrom) query = query.gte('order_date', dateFrom);
    if (dateTo) query = query.lte('order_date', dateTo);
    if (status) query = query.eq('order_status', status);
    if (minAmount) query = query.gte('total_amount', parseFloat(minAmount));
    if (maxAmount) query = query.lte('total_amount', parseFloat(maxAmount));
    if (hasCommission === 'true') query = query.not('commission_amount', 'is', null);
    if (hasCommission === 'false') query = query.is('commission_amount', null);
    if (isSelfShop === 'true') query = query.eq('is_self_shop_order', true);
    if (isSelfShop === 'false') query = query.eq('is_self_shop_order', false);

    // 정렬 적용
    if (sortBy === 'total_amount') {
      query = query.order('total_amount', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'shop_name') {
      // shop_name으로 정렬은 조인된 테이블이라 복잡함, order_date로 대체
      query = query.order('order_date', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('order_date', { ascending: sortOrder === 'asc' });
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 쿼리 실행
    const { data: orders, error, count } = await query;

    if (error) {
      console.error('주문 조회 오류:', error);
      return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 });
    }

    // 각 주문의 소속 관계 정보 추가
    const ordersWithRelationship = await Promise.all((orders || []).map(async (order) => {
      // 주문 시점의 소속 관계 찾기
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
        .or('ended_at.is.null,ended_at.gte.' + order.order_date)
        .single();

      return {
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
    }));

    // 요약 통계 계산
    const summaryQuery = supabase
      .from('orders')
      .select('total_amount, commission_amount');

    // 동일한 필터 적용
    if (shopId) summaryQuery.eq('shop_id', shopId);
    if (dateFrom) summaryQuery.gte('order_date', dateFrom);
    if (dateTo) summaryQuery.lte('order_date', dateTo);
    if (status) summaryQuery.eq('order_status', status);

    const { data: summaryData } = await summaryQuery;

    const summary = {
      total_sales: summaryData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      total_commission: summaryData?.reduce((sum, order) => sum + (order.commission_amount || 0), 0) || 0,
      order_count: count || 0
    };

    return NextResponse.json({
      data: ordersWithRelationship,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      },
      summary
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 주문 생성
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { shop_id, order_date, order_number, items, is_self_shop_order, notes } = body;

    // 유효성 검사
    if (!shop_id || !order_date || !items || items.length === 0) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 총 금액 계산
    const total_amount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // Shop 정보 및 소속 관계 조회
    const { data: shop } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', shop_id)
      .single();

    if (!shop) {
      return NextResponse.json({ error: '존재하지 않는 Shop입니다.' }, { status: 400 });
    }

    // 주문 시점의 소속 관계 찾기
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

    // 수수료 계산
    let commission_rate = 0;
    let commission_amount = 0;

    if (relationship?.parent) {
      if (relationship.parent.role === 'kol') {
        commission_rate = relationship.parent.commission_rate || 30;
      } else if (relationship.parent.role === 'ol') {
        commission_rate = relationship.parent.commission_rate || 20;
      }
      commission_amount = total_amount * (commission_rate / 100);
    }

    // 본인샵 여부 확인 (KOL/OL이 자신의 샵에서 발생한 매출)
    const isSelfShop = is_self_shop_order || 
      (shop.role === 'kol' || shop.role === 'ol');

    // 트랜잭션으로 주문 생성
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id,
        order_date,
        order_number,
        total_amount,
        commission_rate,
        commission_amount,
        commission_status: 'calculated',
        order_status: 'completed',
        is_self_shop_order: isSelfShop,
        notes,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('주문 생성 오류:', orderError);
      return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 });
    }

    // 주문 아이템 생성
    const orderItems = items.map((item: any) => ({
      order_id: newOrder.id,
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
      console.error('주문 아이템 생성 오류:', itemsError);
      // 주문 롤백
      await supabase.from('orders').delete().eq('id', newOrder.id);
      return NextResponse.json({ error: '주문 아이템 생성 실패' }, { status: 500 });
    }

    // 생성된 주문 반환
    const { data: createdOrder } = await supabase
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
      .eq('id', newOrder.id)
      .single();

    return NextResponse.json({ data: createdOrder }, { status: 201 });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
