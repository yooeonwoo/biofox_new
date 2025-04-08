import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // URL에서 이메일 파라미터 추출
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "이메일 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // users 테이블에서 이메일 확인
    const { data, error } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      // 결과가 없는 경우 (등록된 이메일이 없음)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          isApproved: false,
          role: null,
        });
      }
      
      // 다른 오류
      console.error('이메일 확인 오류:', error);
      return NextResponse.json(
        { error: '이메일 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 등록된 이메일인 경우
    return NextResponse.json({
      isApproved: true,
      role: data.role,
    });
  } catch (error) {
    console.error('이메일 확인 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 