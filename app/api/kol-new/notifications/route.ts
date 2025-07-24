import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET: 로그인한 KOL의 알림 목록 조회 (Convex 기반)
export async function GET(req: NextRequest) {
  try {
    console.log('Notifications GET API called - using Convex');

    // 사용자 인증 확인 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    console.log('Notifications - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    // Convex 쿼리 파라미터 구성
    const queryArgs: any = {
      paginationOpts: {
        numItems: limit,
        cursor: null, // 첫 페이지는 null, 향후 커서 기반 처리 구현 가능
      },
    };

    // 필터 적용
    if (isRead !== null && (isRead === 'true' || isRead === 'false')) {
      queryArgs.isRead = isRead === 'true';
    }
    if (
      type &&
      [
        'system',
        'crm_update',
        'order_created',
        'commission_paid',
        'clinical_progress',
        'approval_required',
        'status_changed',
        'reminder',
      ].includes(type)
    ) {
      queryArgs.type = type;
    }
    if (priority && ['low', 'normal', 'high'].includes(priority)) {
      queryArgs.priority = priority;
    }

    console.log('Convex query args:', queryArgs);

    try {
      // Convex 쿼리 실행
      const result = await convex.query(api.notifications.getUserNotifications, queryArgs);

      console.log('Convex query result:', {
        count: result.page.length,
        isDone: result.isDone,
        hasCursor: !!result.continueCursor,
      });

      // 기존 API 응답 형식과 호환성 유지
      const notifications = result.page.map(notification => ({
        id: notification.id,
        user_id: authResult.user._id, // 호환성을 위해 추가
        title: notification.title,
        content: notification.message, // 기존 API의 content 필드명
        type: notification.type,
        priority: notification.priority,
        read: notification.isRead, // 기존 API의 read 필드명
        related_type: notification.relatedType,
        related_id: notification.relatedId,
        created_at: new Date(notification.createdAt).toISOString(), // ISO 문자열로 변환
        metadata: notification.metadata,
      }));

      return NextResponse.json(notifications);
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('알림 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '알림 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
