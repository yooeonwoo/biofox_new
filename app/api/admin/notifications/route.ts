import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// POST: 관리자가 KOL에게 알림 전송 (Convex 기반)
export async function POST(req: NextRequest) {
  try {
    console.log('Admin notifications POST API called - using Convex');

    // 1. 관리자 권한 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    console.log('Admin Notifications - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    // 2. 요청 본문 파싱
    const body = await req.json();
    const { targetType, selectedKols, title, content, priority, type } = body;

    console.log('Notification request:', {
      targetType,
      selectedKolsCount: selectedKols?.length,
      title,
    });

    // 3. 요청 데이터 검증
    if (!targetType || !['all', 'individual'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: '잘못된 대상 타입입니다.' },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0 || title.length > 255) {
      return NextResponse.json(
        { success: false, error: '제목은 1-255자 사이여야 합니다.' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0 || content.length > 1000) {
      return NextResponse.json(
        { success: false, error: '내용은 1-1000자 사이여야 합니다.' },
        { status: 400 }
      );
    }

    if (
      targetType === 'individual' &&
      (!selectedKols || !Array.isArray(selectedKols) || selectedKols.length === 0)
    ) {
      return NextResponse.json(
        { success: false, error: '개별 전송 시 최소 1명 이상의 KOL을 선택해야 합니다.' },
        { status: 400 }
      );
    }

    // 4. 대상 KOL 결정
    let targetUserIds: string[] = [];

    try {
      if (targetType === 'all') {
        // 모든 KOL 대상 - Convex 쿼리로 KOL 목록 조회
        const allUsers = await convex.query(api.users.listUsers, {
          paginationOpts: { numItems: 1000, cursor: null },
          role: 'kol',
        });

        targetUserIds = allUsers.page.map(user => user.id);
        console.log('Found KOL users for bulk notification:', targetUserIds.length);
      } else {
        // 개별 선택된 KOL 대상
        targetUserIds = selectedKols;

        // 선택된 ID들이 실제 KOL인지 확인
        for (const userId of selectedKols) {
          try {
            const userProfile = await convex.query(api.users.getUserById, {
              userId: userId as any,
            });
            if (!userProfile || userProfile.role !== 'kol') {
              return NextResponse.json(
                { success: false, error: `선택된 사용자 ${userId}가 KOL이 아닙니다.` },
                { status: 400 }
              );
            }
          } catch (error) {
            return NextResponse.json(
              { success: false, error: `사용자 ${userId}를 찾을 수 없습니다.` },
              { status: 400 }
            );
          }
        }
      }

      // 대상자가 없는 경우
      if (targetUserIds.length === 0) {
        return NextResponse.json(
          { success: false, error: '알림을 받을 대상이 없습니다.' },
          { status: 400 }
        );
      }

      // 5. Convex를 통한 일괄 알림 생성
      const result = await convex.mutation(api.notifications.createBulkNotifications, {
        userIds: targetUserIds as any, // Convex ID 타입으로 변환
        type: type || 'system',
        title: title.trim(),
        message: content.trim(),
        priority: priority || 'normal',
        metadata: {
          admin_sent: true,
          target_type: targetType,
          sent_by: authResult.user._id,
          sent_at: Date.now(),
        },
      });

      console.log('Bulk notification result:', result);

      // 6. 성공 응답
      return NextResponse.json({
        success: result.success,
        message: result.success ? '알림이 전송되었습니다.' : '일부 알림 전송에 실패했습니다.',
        count: result.created,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (convexError) {
      console.error('Convex operation error:', convexError);
      return NextResponse.json(
        { success: false, error: 'Convex에서 알림 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('관리자 알림 전송 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
