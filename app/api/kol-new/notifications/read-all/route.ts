import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// PUT: 모든 알림을 읽음으로 표시 (Convex 기반)
export async function PUT(req: NextRequest) {
  try {
    console.log('Mark all notifications as read API called - using Convex');

    // 사용자 인증 확인 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    console.log('Mark all notifications as read - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    try {
      // Convex 뮤테이션 실행 - 모든 알림 읽음 처리
      const result = await convex.mutation(api.notifications.markAllNotificationsAsRead, {});

      console.log('Mark all notifications result:', result);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `${result.markedCount}개의 알림이 읽음으로 표시되었습니다.`,
          count: result.markedCount,
        });
      } else {
        return NextResponse.json({ error: '알림 읽음 처리에 실패했습니다.' }, { status: 500 });
      }
    } catch (convexError: any) {
      console.error('Convex mutation error:', convexError);

      return NextResponse.json(
        { error: 'Convex에서 알림 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('알림 상태 변경 중 오류 발생:', error);
    return NextResponse.json({ error: '알림 상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
