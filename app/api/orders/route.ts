import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 주문 목록 조회 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Orders GET API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // 관리자 권한 체크
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('Orders - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const shopId = searchParams.get('shop_id');

    console.log('Orders query params:', { page, limit, shopId });

    try {
      // Convex 쿼리 실행
      const orders = await convex.query(api.orders.getOrders, {
        shop_id: shopId ? (shopId as any) : undefined,
        limit,
      });

      // 통계 조회
      const stats = await convex.query(api.orders.getOrdersStats, {});

      // 기존 API와 호환성 유지
      return NextResponse.json({
        data: orders,
        pagination: {
          total: orders.length,
          page,
          limit,
          totalPages: Math.ceil(orders.length / limit),
          hasNext: orders.length === limit,
          hasPrev: page > 1,
        },
        summary: stats,
      });
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json({ error: 'Failed to fetch orders from Convex' }, { status: 500 });
    }
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 주문 생성 (Convex 기반)
export async function POST(request: NextRequest) {
  try {
    console.log('Orders POST API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // 관리자 권한 체크
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { shop_id, order_date, order_number, items, notes } = body;

    console.log('Creating order:', { shop_id, order_date, items: items?.length });

    // 유효성 검사
    if (!shop_id || !order_date || !items || items.length === 0) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 총 금액 계산
    const total_amount = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    try {
      // Convex 뮤테이션 실행
      const result = await convex.mutation(api.orders.createSimpleOrder, {
        shop_id,
        order_date,
        total_amount,
        order_number: order_number || undefined,
        notes: notes || undefined,
        items: items.map((item: any) => ({
          product_name: item.product_name || '제품',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      console.log('Order created successfully:', result);

      return NextResponse.json(
        {
          data: result,
          success: true,
        },
        { status: 201 }
      );
    } catch (convexError) {
      console.error('Convex mutation error:', convexError);
      return NextResponse.json({ error: 'Failed to create order in Convex' }, { status: 500 });
    }
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
