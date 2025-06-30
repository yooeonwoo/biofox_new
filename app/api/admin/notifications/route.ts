import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import { serverSupabase as supabase } from '@/lib/supabase';

// POST: 관리자가 KOL에게 알림 전송
export async function POST(req: NextRequest) {
  try {
    // 1. 관리자 권한 체크
    const authResult = await checkAuthSupabase();
    const userId = authResult.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 사용자 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (userInfo.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await req.json();
    const { targetType, selectedKols, title, content } = body;

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

    if (targetType === 'individual' && (!selectedKols || !Array.isArray(selectedKols) || selectedKols.length === 0)) {
      return NextResponse.json(
        { success: false, error: '개별 전송 시 최소 1명 이상의 KOL을 선택해야 합니다.' },
        { status: 400 }
      );
    }

    // 4. 대상 KOL 결정
    let targetUserIds: number[] = [];

    if (targetType === 'all') {
      // 모든 KOL 대상
      const { data: kolUsers, error: kolError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'kol');

      if (kolError || !kolUsers) {
        return NextResponse.json(
          { success: false, error: 'KOL 목록을 조회하는데 실패했습니다.' },
          { status: 500 }
        );
      }

      targetUserIds = kolUsers.map(user => user.id);
    } else {
      // 개별 선택된 KOL 대상
      // selectedKols는 users 테이블의 id 배열
      targetUserIds = selectedKols;

      // 선택된 ID들이 실제 KOL인지 확인
      const { data: validKols, error: validError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'kol')
        .in('id', selectedKols);

      if (validError || !validKols) {
        return NextResponse.json(
          { success: false, error: '선택된 KOL 확인에 실패했습니다.' },
          { status: 500 }
        );
      }

      if (validKols.length !== selectedKols.length) {
        return NextResponse.json(
          { success: false, error: '일부 선택된 사용자가 KOL이 아닙니다.' },
          { status: 400 }
        );
      }
    }

    // 대상자가 없는 경우
    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '알림을 받을 대상이 없습니다.' },
        { status: 400 }
      );
    }

    // 5. 알림 레코드 생성
    const notificationRecords = targetUserIds.map(userId => ({
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 6. 데이터베이스에 삽입
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationRecords)
      .select();

    if (insertError) {
      console.error('알림 생성 중 오류:', insertError);
      return NextResponse.json(
        { success: false, error: '알림 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      message: '알림이 전송되었습니다.',
      count: insertedNotifications?.length || 0
    });

  } catch (error) {
    console.error('알림 전송 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}