/**
 * 사용자 관리 API
 * Clerk API와 Supabase를 사용하여 사용자를 관리합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { serverSupabase as supabase } from "@/lib/supabase";

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
    const { email, name, role, kolData } = await req.json();

    // 필수 필드 검증
    if (!email || !role) {
      return NextResponse.json(
        { error: "email, role 필드는 필수입니다." },
        { status: 400 }
      );
    }

    // KOL 역할일 경우 추가 데이터 검증
    if (role === "kol") {
      if (!kolData || !kolData.name || !kolData.shopName || !kolData.region) {
        return NextResponse.json(
          { error: "KOL 역할을 선택한 경우 원장님 성함, 샵 명, 지역은 필수입니다." },
          { status: 400 }
        );
      }
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
          first_name: role === "kol" ? kolData.name : name || email.split('@')[0],
          last_name: "",
          password,
          public_metadata: { role }
        })
      });

      if (!clerkResponse.ok) {
        const errorData = await clerkResponse.json();
        throw new Error(`Clerk API 오류: ${JSON.stringify(errorData)}`);
      }

      const newUser = await clerkResponse.json();

      // 최대 ID 조회
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (maxIdError) {
        console.error("Supabase 최대 ID 조회 실패:", maxIdError);
        
        // Clerk에서 생성된 사용자 롤백 (에러 복구)
        await fetch(`https://api.clerk.com/v1/users/${newUser.id}`, {
          method: 'DELETE',
          headers
        });
        
        throw new Error("사용자 ID를 조회하는 중 오류가 발생했습니다.");
      }

      // 최대 ID + 1 값 계산 (없으면 1부터 시작)
      const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

      // Supabase에 사용자 정보 저장 (ID 명시)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          { 
            id: nextId,
            clerk_id: newUser.id,
            email: email,
            name: role === "kol" ? kolData.name : name || email.split('@')[0],
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

      // KOL 역할인 경우 추가 정보 저장
      if (role === "kol" && userData && userData.length > 0) {
        const userId = userData[0].id;
        
        // KOL 테이블의 최대 ID 조회
        const { data: maxKolIdData, error: maxKolIdError } = await supabase
          .from('kols')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        if (maxKolIdError) {
          console.error("Supabase KOL 최대 ID 조회 실패:", maxKolIdError);
          
          // 사용자 정보 롤백
          await supabase.from('users').delete().eq('id', userId);
          
          // Clerk에서 생성된 사용자 롤백 (에러 복구)
          await fetch(`https://api.clerk.com/v1/users/${newUser.id}`, {
            method: 'DELETE',
            headers
          });
          
          throw new Error("KOL ID를 조회하는 중 오류가 발생했습니다.");
        }

        // 최대 ID + 1 값 계산 (없으면 1부터 시작)
        const nextKolId = maxKolIdData && maxKolIdData.length > 0 ? maxKolIdData[0].id + 1 : 1;
        
        const { data: insertedKolData, error: kolError } = await supabase
          .from('kols')
          .insert([
            {
              id: nextKolId,
              user_id: userId,
              name: kolData.name,
              shop_name: kolData.shopName,
              region: kolData.region,
              smart_place_link: kolData.smartPlaceLink || "",
              status: "active"
            }
          ])
          .select();

        if (kolError) {
          console.error("Supabase KOL 정보 저장 실패:", kolError);
          
          // KOL 정보 저장 실패 시 사용자 정보도 롤백
          await supabase.from('users').delete().eq('id', userId);
          
          // Clerk에서 생성된 사용자 롤백 (에러 복구)
          await fetch(`https://api.clerk.com/v1/users/${newUser.id}`, {
            method: 'DELETE',
            headers
          });
          
          throw new Error("데이터베이스에 KOL 정보를 저장하는 중 오류가 발생했습니다.");
        }
      }

      // 응답
      return NextResponse.json({ 
        success: true, 
        user: {
          id: newUser.id,
          email,
          name: role === "kol" ? kolData.name : name,
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
    
    // API 응답 디버깅
    console.log("Clerk API 응답 구조:", JSON.stringify(clerkUsers, null, 2));
    
    // 응답이 예상한 구조가 아닐 경우를 안전하게 처리
    let usersArray: any[] = [];
    
    // 응답이 배열인 경우
    if (Array.isArray(clerkUsers)) {
      usersArray = clerkUsers;
    } 
    // 응답이 객체이고 data 프로퍼티가 배열인 경우
    else if (clerkUsers && typeof clerkUsers === 'object' && 'data' in clerkUsers && Array.isArray(clerkUsers.data)) {
      usersArray = clerkUsers.data;
    }
    
    // 필요한 정보만 추출하여 반환
    const users = usersArray.map((user: any) => ({
      id: user.id,
      email: user.email_addresses?.[0]?.email_address || "",
      name: user.first_name || "",
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
      .eq('clerk_id', id);

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