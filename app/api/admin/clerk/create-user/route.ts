/**
 * Clerk API를 사용하여 사용자 등록 API
 * 관리자가 새 사용자를 등록할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { db } from "@/db";
import { users } from "@/db/schema";

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
      
      const newUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName,
        lastName: lastName || "",
        password,
        publicMetadata: {
          role,
        },
      });

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
    } catch (clerkError) {
      console.error("Clerk API 오류:", clerkError);
      return NextResponse.json(
        { error: "Clerk API 오류: 사용자 생성에 실패했습니다." },
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