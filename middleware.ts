import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 공개 라우트(로그인 없이 접근 가능)
const publicPaths = [
  "/",
  "/signin(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)"
];

// 가상 테스트용 역할 맵핑 (실제로는 DB나 Clerk 메타데이터에서 가져와야 함)
const TEST_ROLE_MAPPING: Record<string, string> = {
  // 특정 사용자 ID에 역할 지정 (실제 프로젝트에서는 DB나 Clerk 메타데이터에서 가져와야 함)
  "user_example1": "본사관리자",
  "user_example2": "kol",
};

const isPublicRoute = createRouteMatcher(publicPaths);

export default clerkMiddleware(async (auth, req) => {
  // 공개 경로인 경우 인증 검사 건너뛰기
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 인증 상태 확인 (비동기 처리)
  const { userId, sessionClaims } = await auth();
  
  // 인증되지 않은 경우
  if (!userId) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  console.log("User ID:", userId);
  console.log("Session Claims:", sessionClaims);
  
  // 테스트를 위한 임시 역할 할당 (실제로는 sessionClaims에서 가져와야 함)
  const userRole = sessionClaims?.role || (userId ? TEST_ROLE_MAPPING[userId] : undefined) || "kol";
  
  // 사용자가 /dashboard로 접근하는 경우 역할별 리다이렉트
  if (req.nextUrl.pathname === "/dashboard") {
    if (userRole === "본사관리자") {
      console.log("관리자로 리다이렉트");
      // 테스트 페이지 A: 관리자 대시보드
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else if (userRole === "kol") {
      console.log("KOL로 리다이렉트");
      // 테스트 페이지 B: KOL 대시보드
      return NextResponse.redirect(new URL("/kol/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
}; 