/**
 * 사용자 관리 API
 * 관리자가 사용자를 생성, 조회, 수정, 삭제할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { users, kols } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

/**
 * GET 요청 처리 - 모든 사용자 목록을 조회합니다.
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // 사용자 목록 조회 (KOL 정보 포함)
    const userList = await db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        role: users.role,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // KOL 정보 추가
        kolId: kols.id,
        kolName: kols.name,
        shopName: kols.shopName,
        kolStatus: kols.status,
        region: kols.region
      })
      .from(users)
      .leftJoin(kols, eq(users.id, kols.userId));
    
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
 * 사용자는 나중에 동일한 이메일로 가입 시 데이터베이스의 정보와 연결됩니다.
 */
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // 요청 본문 파싱
    const { email, role, name, shopName } = await req.json();

    // 필수 필드 검증
    if (!email || !role) {
      return NextResponse.json(
        { error: "email, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인 - Supabase
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

    // 임시 클럭 ID 생성 (사용자가 실제로 가입할 때 업데이트됨)
    const tempClerkId = `pending_${Date.now()}`;
    const displayName = name || email.split('@')[0]; // 이름이 없으면 이메일 아이디 사용

    // 1. 데이터베이스에 사용자 등록
    const newUser = await db.insert(users).values({
      clerkId: tempClerkId,
      email,
      role,
      name: displayName,
    }).returning();

    // 2. KOL 역할인 경우 KOL 정보 추가 등록
    if (role === 'kol' && newUser.length > 0) {
      // 샵명이 제공되었으면 해당 값을 사용하고, 그렇지 않으면 기본값 생성
      const kolShopName = shopName || `${displayName}의 매장`;
      
      await db.insert(kols).values({
        userId: newUser[0].id,
        name: displayName,
        shopName: kolShopName,
        region: '', // 빈 값으로 시작
        status: 'pending', // 상태를 pending으로 설정
      });
    }
    
    // 나중에 필요하다면 사용자에게 초대 이메일 발송하는 로직 추가 가능

    return NextResponse.json({ 
      user: newUser[0],
      message: "사용자가 데이터베이스에 등록되었습니다. 사용자는 동일한 이메일 주소로 가입하면 이 계정과 연결됩니다."
    }, { status: 201 });
  } catch (error) {
    console.error("사용자 등록 실패:", error);
    // 오류 유형에 따라 다른 메시지 반환
    const errorMessage = error instanceof Error 
      ? `사용자 등록 중 오류가 발생했습니다: ${error.message}`
      : "사용자 등록 중 알 수 없는 오류가 발생했습니다.";
    
    return NextResponse.json(
      { error: errorMessage },
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
    const user = await currentUser();
    if (!user) {
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

    const userId = parseInt(id);

    try {
      // 트랜잭션으로 처리 - 최신 drizzle-orm은 트랜잭션을 지원하지만, 
      // 여기서는 ON DELETE CASCADE를 사용하여 DB 레벨에서 처리
      const deletedUser = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (deletedUser.length === 0) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (deleteError) {
      console.error("사용자 삭제 세부 오류:", deleteError);
      // PostgreSQL 외래 키 제약조건 오류 처리
      if (deleteError instanceof Error && deleteError.message.includes("violates foreign key constraint")) {
        return NextResponse.json(
          { 
            error: "사용자를 삭제할 수 없습니다: 이 사용자와 연결된 데이터가 있습니다.",
            details: "사용자를 삭제하기 전에 연결된 KOL 정보를 먼저 삭제해야 합니다."
          },
          { status: 409 }
        );
      }
      throw deleteError; // 다른 오류는 상위 catch 블록으로 전달
    }
  } catch (error) {
    console.error("사용자 삭제 실패:", error);
    // 오류 유형에 따라 다른 메시지 반환
    const errorMessage = error instanceof Error 
      ? `사용자 삭제 중 오류가 발생했습니다: ${error.message}`
      : "사용자 삭제 중 알 수 없는 오류가 발생했습니다.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 