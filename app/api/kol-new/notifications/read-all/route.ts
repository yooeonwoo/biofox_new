import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 로컬 개발환경용 임시 KOL 정보
const getTempKolData = () => ({
  id: 1,
  name: '테스트 사용자',
  shop_name: '테스트 샵',
  userId: 'temp-user-id'
});

// PUT: 모든 알림을 읽음으로 표시
export async function PUT(req: NextRequest) {
  try {
    // 현재 인증된 사용자 확인
    const { userId } = getTempKolData();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // users 테이블에서 내부 사용자 ID 조회
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

    // 사용자의 모든 안 읽은 알림을 읽음 처리
    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userInfo.id)
      .eq('read', false)
      .select();

    if (updateError) {
      console.error('알림 상태 변경 오류:', updateError);
      return NextResponse.json(
        { error: '알림 상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    const rowCount = updated?.length ?? 0;

    return NextResponse.json({
      success: true,
      message: `${rowCount}개의 알림이 읽음으로 표시되었습니다.`,
      count: rowCount,
    });
  } catch (error) {
    console.error('알림 상태 변경 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}