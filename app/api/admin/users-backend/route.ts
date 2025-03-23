/**
 * 사용자 관리 API
 * Clerk API와 Supabase를 사용하여 사용자를 관리합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/db/utils";

/**
 * POST 요청 처리 - 새 사용자 등록
 */
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
      // 임의 비밀번호 생성
      const password = Math.random().toString(36).substring(2, 10);
      
      // API 요청을 위한 헤더 설정
      const headers = {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      };

      // Clerk API 직접 호출하여 사용자 생성
      const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email_address: [email],
          first_name: firstName,
          last_name: lastName || "",
          password,
          public_metadata: { role }
        })
      });

      if (!clerkResponse.ok) {
        const errorData = await clerkResponse.json();
        throw new Error(`Clerk API 오류: ${JSON.stringify(errorData)}`);
      }

      const newUser = await clerkResponse.json();

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
        await fetch(`https://api.clerk.com/v1/users/${newUser.id}`, {
          method: 'DELETE',
          headers
        });
        
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

    // API 요청을 위한 헤더 설정
    const headers = {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };

    // Clerk API 직접 호출하여 사용자 목록 조회
    const clerkResponse = await fetch('https://api.clerk.com/v1/users?limit=100', {
      method: 'GET',
      headers
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json();
      throw new Error(`Clerk API 오류: ${JSON.stringify(errorData)}`);
    }

    const clerkUsers = await clerkResponse.json();

    // 필요한 정보만 추출하여 반환
    const users = clerkUsers.data.map((user: any) => ({
      id: user.id,
      email: user.email_addresses[0]?.email_address || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: (user.public_metadata?.role as string) || "kol",
      createdAt: user.created_at || new Date().toISOString(),
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

    // URL에서 사용자 ID 추출
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // API 요청을 위한 헤더 설정
    const headers = {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };

    // Clerk API 직접 호출하여 사용자 삭제
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json();
      throw new Error(`Clerk API 오류: ${JSON.stringify(errorData)}`);
    }

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