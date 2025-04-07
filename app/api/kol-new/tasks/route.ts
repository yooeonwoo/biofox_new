import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// KOL 태스크 목록 API 라우트
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 알림 정보를 통해 태스크 목록 조회 (현재는 notifications 테이블 활용)
    const { data: tasks, error: tasksError } = await supabase
      .from('notifications')
      .select('id, title, content, created_at, read')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      return NextResponse.json(
        { error: '태스크 정보를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 태스크 데이터 형식 변환
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.content,
      createdAt: task.created_at,
      completed: task.read,
      dueDate: null, // 현재 notifications에는 due_date가 없어서 null로 설정
      type: getTaskType(task.title) // 태스크 타입 추론
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('KOL 태스크 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 태스크 타입 추론 함수
function getTaskType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('주문') || lowerTitle.includes('order')) {
    return 'order';
  } else if (lowerTitle.includes('세미나') || lowerTitle.includes('seminar')) {
    return 'seminar';
  } else if (lowerTitle.includes('교육') || lowerTitle.includes('training')) {
    return 'training';
  } else if (lowerTitle.includes('미팅') || lowerTitle.includes('meeting')) {
    return 'meeting';
  } else {
    return 'etc';
  }
} 