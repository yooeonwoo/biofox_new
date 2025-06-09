import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Clerk에서 현재 인증된 사용자 정보 가져오기
    const { userId } = await auth();
    const user = await currentUser();

    // 사용자 ID가 없으면 401 Unauthorized 응답
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // 사용자 ID와 이메일 반환
    return NextResponse.json({ 
      userId, 
      email: user?.emailAddresses[0]?.emailAddress || null
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json({ error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
