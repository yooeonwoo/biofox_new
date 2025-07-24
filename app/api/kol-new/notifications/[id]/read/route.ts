import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

// PUT: 특정 알림을 읽음으로 표시 (Convex 기반)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id: notificationId } = params;

  try {
    console.log('Notification mark as read API called - using Convex:', notificationId);

    // 사용자 인증 확인 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    console.log('Mark notification as read - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    try {
      // Convex 뮤테이션 실행 - 알림 읽음 처리
      const result = await convex.mutation(api.notifications.markNotificationAsRead, {
        notificationId: notificationId as any, // Convex ID 타입으로 변환
      });

      console.log('Mark notification result:', result);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.alreadyRead ? '이미 읽은 알림입니다.' : '알림이 읽음으로 표시되었습니다.',
          alreadyRead: result.alreadyRead,
        });
      } else {
        return NextResponse.json({ error: '알림 읽음 처리에 실패했습니다.' }, { status: 500 });
      }
    } catch (convexError: any) {
      console.error('Convex mutation error:', convexError);

      // Convex 에러 처리
      if (convexError.message?.includes('알림을 찾을 수 없습니다')) {
        return NextResponse.json(
          { error: '알림을 찾을 수 없거나 권한이 없습니다.' },
          { status: 404 }
        );
      }

      if (convexError.message?.includes('다른 사용자의 알림')) {
        return NextResponse.json(
          { error: '다른 사용자의 알림에 접근할 수 없습니다.' },
          { status: 403 }
        );
      }

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
