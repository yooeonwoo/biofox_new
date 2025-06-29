import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 요청 데이터 타입 정의
interface SalesJournalRequest {
  date: string;
  shopName: string;
  content: string;
  specialNotes?: string;
  reminder?: {
    content: string;
    dateTime: string;
  };
  ownerMessage?: {
    content: string;
    dateTime: string;
    sendNow: boolean;
  };
}

// 로컬 개발환경용 임시 KOL 정보
const getTempKolData = () => ({
  id: 1,
  name: '테스트 사용자',
  shop_name: '테스트 샵',
  userId: 'temp-user-id'
});

// POST: 영업일지 저장 (UPSERT)
export async function POST(req: NextRequest) {
  try {
    // 1. KOL 권한 체크
    const { userId } = getTempKolData();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // Clerk ID로 사용자 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // KOL 권한 확인
    if (userInfo.role !== 'kol') {
      return NextResponse.json(
        { success: false, error: 'KOL 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body: SalesJournalRequest = await req.json();
    console.log('SalesJournal API 요청 본문:', body);
    // 알림 기능 비활성화(MVP)
    const { date, shopName, content, specialNotes, reminder: _reminder, ownerMessage: _ownerMessage } = body;

    // 3. 요청 데이터 검증
    if (!date || !shopName?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: '날짜, 샵명, 내용은 필수 입력사항입니다.' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: '올바른 날짜 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 4. 샵 ID 찾기 (선택적)
    let shopId = null;
    const { data: shopData } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_name', shopName.trim())
      .eq('kol_id', userInfo.id)
      .single();
    
    if (shopData) {
      shopId = shopData.id;
    }

    // 5. 영업일지 저장 (UPSERT)
    const { data: journalData, error: journalError } = await supabase
      .from('sales_journals')
      .upsert({
        user_id: userInfo.id,
        shop_id: shopId,
        date: date,
        shop_name: shopName.trim(),
        content: content.trim(),
        special_notes: specialNotes?.trim() || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (journalError) {
      console.error('영업일지 저장 실패:', journalError);
      return NextResponse.json(
        { success: false, error: '영업일지 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // TODO: MVP 이후 알림 기능 재활성화
    /*
    // 6. 리마인드 알림 처리
    if (reminder && reminder.content?.trim() && reminder.dateTime) {
      const reminderDateTime = new Date(reminder.dateTime);
      
      if (!isNaN(reminderDateTime.getTime())) {
        const { error: reminderError } = await supabase
          .from('notifications')
          .insert({
            user_id: userInfo.id,
            type: 'reminder',
            title: '영업일지 리마인드',
            content: reminder.content.trim(),
            scheduled_at: reminder.dateTime,
            reference_id: journalData.id,
            reference_type: 'sales_journal',
            read: false
          });

        if (reminderError) {
          console.error('리마인드 알림 저장 실패:', reminderError);
          // 리마인드 실패는 전체 실패로 처리하지 않음
        }
      }
    }

    // 7. 원장 메시지 처리
    if (ownerMessage && ownerMessage.content?.trim()) {
      // KOL 이름 조회
      const { data: kolData } = await supabase
        .from('kols')
        .select('name')
        .eq('user_id', userInfo.id)
        .single();

      const kolName = kolData?.name || '알림';
      const scheduledAt = ownerMessage.sendNow ? null : ownerMessage.dateTime;

      // 원장 메시지는 user_id를 null로 설정 (향후 shop 권한 사용자용)
      const { error: messageError } = await supabase
        .from('notifications')
        .insert({
          user_id: null, // 향후 shop 권한 사용자용
          type: 'shop_message',
          title: `KOL 메시지: ${kolName}`,
          content: ownerMessage.content.trim(),
          scheduled_at: scheduledAt,
          reference_id: journalData.id,
          reference_type: 'sales_journal',
          read: false
        });

      if (messageError) {
        console.error('원장 메시지 저장 실패:', messageError);
        // 원장 메시지 실패는 전체 실패로 처리하지 않음
      }
     }
     */

     // 8. 성공 응답
    return NextResponse.json({
      success: true,
      data: journalData,
      message: '영업일지가 저장되었습니다.'
    });

  } catch (error) {
    console.error('영업일지 저장 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 내 영업일지 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 1. KOL 권한 체크
    const { userId } = getTempKolData();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // Clerk ID로 사용자 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // KOL 권한 확인
    if (userInfo.role !== 'kol') {
      return NextResponse.json(
        { success: false, error: 'KOL 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFilter = searchParams.get('date');

    // 3. 쿼리 빌드
    let query = supabase
      .from('sales_journals')
      .select('*')
      .eq('user_id', userInfo.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    // 날짜 필터 적용
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      if (!isNaN(filterDate.getTime())) {
        query = query.eq('date', dateFilter);
      }
    }

    // 4. 데이터 조회
    const { data: journals, error: journalsError } = await query;

    if (journalsError) {
      console.error('영업일지 조회 실패:', journalsError);
      return NextResponse.json(
        { success: false, error: '영업일지 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 5. 관련 알림 정보도 함께 조회 (옵션)
    const journalIds = journals?.map(j => j.id) || [];
    let reminders = [];
    let ownerMessages = [];

    if (journalIds.length > 0) {
      // 리마인드 알림 조회
      const { data: reminderData } = await supabase
        .from('notifications')
        .select('reference_id, content, scheduled_at')
        .eq('user_id', userInfo.id)
        .eq('type', 'reminder')
        .eq('reference_type', 'sales_journal')
        .in('reference_id', journalIds);

      // 원장 메시지 조회
      const { data: messageData } = await supabase
        .from('notifications')
        .select('reference_id, content, scheduled_at')
        .eq('type', 'shop_message')
        .eq('reference_type', 'sales_journal')
        .in('reference_id', journalIds);

      reminders = reminderData || [];
      ownerMessages = messageData || [];
    }

    // 6. 데이터 조합
    const journalsWithAlerts = journals?.map(journal => ({
      ...journal,
      reminder: reminders.find(r => r.reference_id === journal.id),
      ownerMessage: ownerMessages.find(m => m.reference_id === journal.id)
    }));

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      data: journalsWithAlerts || [],
      pagination: {
        limit,
        offset,
        total: journals?.length || 0
      },
      message: '영업일지 목록을 조회했습니다.'
    });

  } catch (error) {
    console.error('영업일지 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}