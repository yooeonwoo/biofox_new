/**
 * Clerk API를 사용하여 사용자 등록 API
 * 관리자가 새 사용자를 등록할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/db/utils";

export async function POST(req: NextRequest) {
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

    // 요청 본문 파싱
    const { email, firstName, lastName, role } = await req.json();

    // 필수 필드 검증
    if (!email || !firstName || !role) {
      return NextResponse.json(
        { error: "email, firstName, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    try {
      // Clerk API를 사용하여 사용자 생성
      const password = Math.random().toString(36).substring(2, 10); // 임의 비밀번호 생성
      
      // Clerk API를 사용하여 사용자 생성
      const newUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName,
        lastName: lastName || "",
        password,
        publicMetadata: {
          role,
        },
      });

      // Supabase에 사용자 정보 저장
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          { 
            clerkId: newUser.id,
            email: email,
            role: role,
          }
        ])
        .select();

      if (userError) {
        console.error("Supabase 사용자 저장 실패:", userError);
        // Clerk에서 생성된 사용자 롤백 (에러 복구)
        await clerkClient.users.deleteUser(newUser.id);
        throw new Error("데이터베이스에 사용자 정보를 저장하는 중 오류가 발생했습니다.");
      }

      // 응답
      return NextResponse.json({ 
        success: true, 
        user: {
          id: newUser.id,
          email,
          firstName,
          lastName,
          role
        }
      }, { status: 201 });
    } catch (apiError) {
      console.error("API 오류:", apiError);
      return NextResponse.json(
        { error: "사용자 생성에 실패했습니다. " + (apiError instanceof Error ? apiError.message : "") },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("사용자 등록 실패:", error);
    return NextResponse.json(
      { error: "사용자 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 