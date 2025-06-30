import { checkAuthSupabase } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Supabase에서 현재 인증된 사용자 정보 가져오기
    const authResult = await checkAuthSupabase();
    
    // 사용자가 없으면 401 Unauthorized 응답
    if (!authResult.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // 사용자 정보 반환
    return NextResponse.json({ 
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      role: authResult.user.role
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json({ error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
