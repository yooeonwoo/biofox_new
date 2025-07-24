import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 주문 수수료 재계산 (Convex 기반) - 향후 구현 예정
export async function POST(request: NextRequest) {
  try {
    console.log('Order commission recalculation API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { order_ids, shop_id, date_from, date_to } = body;

    console.log('Commission recalculation request:', {
      order_ids: order_ids?.length,
      shop_id,
      date_from,
      date_to,
    });

    // 현재는 임시 응답 - 향후 Convex 뮤테이션으로 구현 예정
    console.warn('⚠️  주문 수수료 재계산 기능은 아직 Convex로 마이그레이션되지 않았습니다.');

    return NextResponse.json(
      {
        error: 'Order commission recalculation is not yet implemented in Convex',
        message: 'This feature will be implemented in the next phase of migration',
        status: 'under_development',
      },
      { status: 501 }
    );

    /*
    TODO: Convex 구현 계획
    
    1. convex/orders.ts에 recalculateOrderCommissions 뮤테이션 추가
    2. 주문 필터링 로직 구현 (order_ids, shop_id, date_range)
    3. 각 주문의 소속 관계 조회 및 수수료율 재계산
    4. 주문 업데이트 및 변경 내역 추적
    5. 감사 로그 생성
    
    예상 Convex 함수 구조:
    
    export const recalculateOrderCommissions = mutation({
      args: {
        order_ids: v.optional(v.array(v.id('orders'))),
        shop_id: v.optional(v.id('profiles')),
        date_from: v.optional(v.number()),
        date_to: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        // 구현 예정
      }
    });
    */
  } catch (error) {
    console.error('Commission recalculation error:', error);
    return NextResponse.json({ error: 'Failed to recalculate commissions' }, { status: 500 });
  }
}
