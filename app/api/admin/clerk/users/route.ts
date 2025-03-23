/**
 * Clerk API를 사용하여 사용자 목록 및 관리 API
 * 관리자가 사용자 목록을 조회하거나 삭제할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { supabase } from "@/db/utils";

/**
 * GET 요청 처리 - 사용자 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authObject = await auth();
    const userId = authObject.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // Clerk API를 사용하여 사용자 목록 조회
    const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUsers = await clerk.users.getUserList({
      limit: 100,
    });

    // 필요한 정보만 추출하여 반환
    const users = clerkUsers.map((user: User) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: (user.publicMetadata?.role as string) || "kol",
      createdAt: user.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 사용자 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authObject = await auth();
    const userId = authObject.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // URL에서 사용자 ID 추출
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Clerk API를 사용하여 사용자 삭제
    const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
    await clerk.users.deleteUser(id);

    // Supabase에서도 사용자 삭제
    const { error: supabaseError } = await supabase
      .from('users')
      .delete()
      .eq('clerkId', id);

    if (supabaseError) {
      console.error("Supabase 사용자 삭제 실패:", supabaseError);
      // 이미 Clerk에서 삭제됐으므로 에러만 로깅하고 성공 응답 반환
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("사용자 삭제 실패:", error);
    return NextResponse.json(
      { error: "사용자 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 