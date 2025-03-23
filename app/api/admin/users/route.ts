/**
 * 사용자 관리 API
 * 관리자가 사용자를 생성, 조회, 수정, 삭제할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { users } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

/**
 * GET 요청 처리 - 모든 사용자 목록을 조회합니다.
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // 사용자 목록 조회
    const userList = await db.select().from(users);
    return NextResponse.json({ users: userList });
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 새 사용자를 등록합니다.
 * 이 API는 데이터베이스에만 사용자 정보를 저장합니다.
 * 실제 Clerk 사용자 생성은 별도의 API를 통해 처리해야 합니다.
 */
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // 요청 본문 파싱
    const { clerkId, email, role } = await req.json();

    // 필수 필드 검증
    if (!clerkId || !email || !role) {
      return NextResponse.json(
        { error: "clerkId, email, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 409 }
      );
    }

    // 사용자 등록
    const newUser = await db.insert(users).values({
      clerkId,
      email,
      role,
    }).returning();

    return NextResponse.json({ user: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error("사용자 등록 실패:", error);
    return NextResponse.json(
      { error: "사용자 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 사용자를 삭제합니다.
 * 이 API는 데이터베이스에서만 사용자 정보를 삭제합니다.
 * 실제 Clerk 사용자 삭제는 별도의 API를 통해 처리해야 합니다.
 */
export async function DELETE(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId } = auth();
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

    // 사용자 삭제
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
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