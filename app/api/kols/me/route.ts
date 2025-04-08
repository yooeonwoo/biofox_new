import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 현재 로그인한 사용자의 KOL 정보 조회
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Supabase에서 사용자 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 정보 조회
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select(`
        *,
        shops:shops(*)
      `)
      .eq('user_id', userInfo.id)
      .single();

    if (kolError || !kol) {
      return NextResponse.json(
        { error: "KOL 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(kol);
  } catch (error) {
    console.error("내 KOL 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL 정보를 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 