import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 화이트리스트에서 이메일 확인
    const { data, error } = await supabase
      .from('whitelisted_emails')
      .select('email, role')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      // 결과가 없는 경우 (화이트리스트에 없음)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          isWhitelisted: false,
          role: null,
        });
      }
      
      // 다른 오류
      console.error('화이트리스트 확인 오류:', error);
      return NextResponse.json(
        { error: '화이트리스트 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 화이트리스트에 있는 경우
    return NextResponse.json({
      isWhitelisted: true,
      role: data.role,
    });
  } catch (error) {
    console.error('화이트리스트 확인 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 