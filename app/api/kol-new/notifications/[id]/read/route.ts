import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverSupabase as supabase } from '@/lib/supabase';

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

// PUT: 특정 알림을 읽음으로 표시
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: notificationId } = params;

  try {
    // 현재 인증된 사용자 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 내부 사용자 ID 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 알림 존재 및 소유 여부 검증
    const { data: notification, error: notiError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userInfo.id)
      .single();

    if (notiError || !notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // 알림 읽음 처리
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (updateError) {
      console.error('알림 읽음 처리 오류:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: '알림이 읽음으로 표시되었습니다.'
    });
  } catch (error) {
    console.error('알림 상태 변경 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}