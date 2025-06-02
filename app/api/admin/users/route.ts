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
    console.log("=== 사용자 목록 조회 API 시작 ===");
    
    // 관리자 권한 확인
    const user = await currentUser();
    console.log("현재 사용자:", user ? `ID=${user.id}, Email=${user.emailAddresses[0]?.emailAddress}` : "없음");
    
    if (!user) {
      console.log("인증 실패 - 사용자 없음");
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요
    console.log("데이터베이스 연결 확인 중...");

    // Supabase 클라이언트를 사용한 간단한 쿼리로 테스트
    console.log("Supabase 직접 쿼리 실행 중...");
    const { supabase } = await import("../../../../db/index");
    
    const { data: userList, error: queryError } = await supabase
      .from('users')
      .select(`
        id,
        clerk_id,
        email,
        role,
        name,
        created_at,
        updated_at,
        kols (
          id,
          name,
          shop_name,
          status,
          region
        )
      `)
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error("Supabase 쿼리 오류:", queryError);
      throw queryError;
    }
    
    console.log(`사용자 목록 조회 성공: ${userList?.length || 0}명`);
    console.log("첫 번째 사용자 샘플:", userList?.[0] || "없음");
    
    // 데이터 형식을 프론트엔드가 기대하는 형식으로 변환
    const formattedUsers = userList?.map(user => ({
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      // KOL 정보
      kolId: user.kols?.[0]?.id || null,
      kolName: user.kols?.[0]?.name || null,
      shopName: user.kols?.[0]?.shop_name || null,
      kolStatus: user.kols?.[0]?.status || null,
      region: user.kols?.[0]?.region || null
    })) || [];
    
    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("=== 사용자 목록 조회 실패 ===");
    console.error("오류 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    console.error("오류 스택:", error instanceof Error ? error.stack : "스택 정보 없음");
    console.error("전체 오류 객체:", error);
    
    return NextResponse.json(
      { 
        error: "사용자 목록을 조회하는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 새 사용자를 초대합니다.
 * 데이터베이스에 pending 상태로 저장하여 해당 이메일로 회원가입을 허용합니다.
 */
export async function POST(req: NextRequest) {
  try {
    console.log("=== 사용자 초대 API 시작 ===");
    
    // 관리자 권한 확인
    const user = await currentUser();
    console.log("현재 사용자:", user ? `ID=${user.id}` : "없음");
    
    if (!user) {
      console.log("인증 실패 - 사용자 없음");
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // TODO: 실제 프로덕션에서는 사용자 권한을 확인하는 로직 추가 필요

    // 요청 본문 파싱
    const { email, role, name, shopName } = await req.json();
    console.log("초대 요청 데이터:", { email, role, name, shopName });

    // 필수 필드 검증
    if (!email || !role) {
      console.log("필수 필드 누락:", { email: !!email, role: !!role });
      return NextResponse.json(
        { error: "email, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    console.log("이메일 중복 확인 중...");
    const { supabase } = await import("../../../../db/index");

    // 이메일 중복 확인 - Supabase
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email, clerk_id')
      .eq('email', email);

    if (checkError) {
      console.error("이메일 중복 확인 오류:", checkError);
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const status = existingUser.clerk_id.startsWith('pending_') ? '초대 대기 중' : '이미 가입됨';
      console.log("이미 등록된 이메일:", email, "상태:", status);
      return NextResponse.json(
        { error: `이미 등록된 이메일입니다 (${status})` },
        { status: 409 }
      );
    }

    // 임시 clerk ID 생성 (사용자가 실제로 가입할 때 실제 Clerk ID로 업데이트됨)
    const tempClerkId = `pending_${Date.now()}`;
    const displayName = name || email.split('@')[0];

    console.log("데이터베이스에 pending 사용자 등록 중...", { tempClerkId, displayName });

    // 데이터베이스에 pending 상태로 사용자 등록
    const { data: newUser, error: insertUserError } = await supabase
      .from('users')
      .insert({
        clerk_id: tempClerkId,
        email,
        role,
        name: displayName,
      })
      .select()
      .single();

    if (insertUserError) {
      console.error("DB 사용자 등록 오류:", insertUserError);
      throw insertUserError;
    }

    console.log("DB 사용자 등록 성공:", newUser);

    // KOL 역할인 경우 KOL 정보 추가 등록
    if (role === 'kol' && newUser) {
      console.log("KOL 정보 등록 중...");
      
      // 샵명이 제공되었으면 해당 값을 사용하고, 그렇지 않으면 기본값 생성
      const kolShopName = shopName || `${displayName}의 매장`;
      
      const { data: newKol, error: insertKolError } = await supabase
        .from('kols')
        .insert({
          user_id: newUser.id,
          name: displayName,
          shop_name: kolShopName,
          region: '', // 빈 값으로 시작
          status: 'pending', // pending 상태로 설정 (회원가입 완료 시 active로 변경)
        })
        .select()
        .single();

      if (insertKolError) {
        console.error("KOL 정보 등록 오류:", insertKolError);
        // KOL 등록 실패 시 사용자도 삭제
        await supabase.from('users').delete().eq('id', newUser.id);
        throw insertKolError;
      }

      console.log("KOL 정보 등록 성공:", newKol);
    }
    
    console.log("=== 사용자 초대 API 완료 ===");

    return NextResponse.json({ 
      user: {
        id: newUser.id,
        clerkId: newUser.clerk_id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        createdAt: newUser.created_at
      },
      message: "사용자 초대가 완료되었습니다. 해당 이메일로 회원가입이 가능합니다."
    }, { status: 201 });
  } catch (error) {
    console.error("=== 사용자 초대 실패 ===");
    console.error("오류 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    console.error("오류 스택:", error instanceof Error ? error.stack : "스택 정보 없음");
    console.error("전체 오류 객체:", error);
    
    // 오류 유형에 따라 다른 메시지 반환
    const errorMessage = error instanceof Error 
      ? `사용자 초대 중 오류가 발생했습니다: ${error.message}`
      : "사용자 초대 중 알 수 없는 오류가 발생했습니다.";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH 요청 처리 - 사용자 역할을 변경합니다.
 */
export async function PATCH(req: NextRequest) {
  try {
    console.log("=== 사용자 역할 변경 API 시작 ===");
    
    // 관리자 권한 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const { userId, role } = await req.json();
    console.log("역할 변경 요청:", { userId, role });

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    const { supabase } = await import("../../../../db/index");

    // 사용자 역할 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error("사용자 역할 변경 오류:", updateError);
      throw updateError;
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("사용자 역할 변경 성공:", updatedUser);

    return NextResponse.json({ 
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerk_id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name
      },
      message: "사용자 역할이 변경되었습니다."
    });
  } catch (error) {
    console.error("=== 사용자 역할 변경 실패 ===");
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "사용자 역할을 변경하는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
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
    console.log("=== 사용자 삭제 API 시작 ===");
    
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
    console.log("삭제 대상 사용자 ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const userId = parseInt(id);
    const { supabase } = await import("../../../../db/index");

    try {
      // 1. 먼저 사용자 정보 조회 (Clerk ID 확인용)
      const { data: userToDelete, error: getUserError } = await supabase
        .from('users')
        .select('clerk_id, email, role')
        .eq('id', userId)
        .single();

      if (getUserError || !userToDelete) {
        console.error("삭제할 사용자 조회 실패:", getUserError);
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      console.log("삭제할 사용자 정보:", userToDelete);

      // 2. Clerk에서 사용자 삭제 (pending이 아닌 경우만)
      if (!userToDelete.clerk_id.startsWith('pending_')) {
        try {
          const { deleteUser: clerkDeleteUser } = await import("../../../../lib/clerk/admin");
          await clerkDeleteUser(userToDelete.clerk_id);
          console.log(`Clerk 사용자 삭제 성공: ${userToDelete.clerk_id}`);
        } catch (clerkError) {
          console.error(`Clerk 사용자 삭제 실패: ${userToDelete.clerk_id}`, clerkError);
          // Clerk 삭제 실패해도 DB 삭제는 계속 진행
        }
      } else {
        console.log(`Pending 사용자이므로 Clerk 삭제 생략: ${userToDelete.clerk_id}`);
      }

      // 3. Supabase에서 사용자 삭제 (CASCADE 설정으로 관련 데이터도 함께 삭제됨)
      const { data: deletedUser, error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select()
        .single();

      if (deleteError) {
        console.error("DB 사용자 삭제 오류:", deleteError);
        throw deleteError;
      }

      if (!deletedUser) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      console.log("DB 사용자 삭제 성공:", deletedUser);

      return NextResponse.json({ 
        success: true,
        message: "사용자가 Clerk과 데이터베이스에서 삭제되었습니다."
      });
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
    console.error("=== 사용자 삭제 실패 ===");
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    
    // 오류 유형에 따라 다른 메시지 반환
    const errorMessage = error instanceof Error 
      ? `사용자 삭제 중 오류가 발생했습니다: ${error.message}`
      : "사용자 삭제 중 알 수 없는 오류가 발생했습니다.";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 