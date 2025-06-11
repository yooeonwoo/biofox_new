import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverSupabase as supabase } from '@/lib/supabase';

// GET: 로그인한 KOL의 알림 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // Clerk ID → users 테이블 PK 조회
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

    // 해당 사용자의 알림 목록 조회 (최신순)
    const { data: notifications, error: notiError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userInfo.id)
      .order('created_at', { ascending: false });

    if (notiError) {
      console.error('알림 조회 오류:', notiError);
      return NextResponse.json(
        { error: '알림 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(notifications ?? []);
  } catch (error) {
    console.error('알림 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}