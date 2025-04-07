import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 공개 라우트(로그인 없이 접근 가능)
const publicPaths = [
  "/",
  "/signin(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)"
];

// 미들웨어에서 무시할 경로 (리다이렉트 고려 대상에서 제외)
const ignorePaths = [
  "/kol-new(.*)",
  "/api/(.*)"
];

// 가상 테스트용 역할 맵핑 (실제로는 DB나 Clerk 메타데이터에서 가져와야 함)
const TEST_ROLE_MAPPING: Record<string, string> = {
  // 특정 사용자 ID에 역할 지정 (실제 프로젝트에서는 DB나 Clerk 메타데이터에서 가져와야 함)
  "user_example1": "본사관리자",
  "user_example2": "kol",
};

const isPublicRoute = createRouteMatcher(publicPaths);
const isIgnoredRoute = createRouteMatcher(ignorePaths);

export default clerkMiddleware(async (auth, req) => {
  console.log('미들웨어 처리 중:', req.nextUrl.pathname);
  
  // 공개 경로인 경우 인증 검사 건너뛰기
  if (isPublicRoute(req)) {
    console.log('공개 경로 접근:', req.nextUrl.pathname);
    return NextResponse.next();
  }
  
  // 무시할 경로인 경우 (kol-new, API 등) 처리를 다음 미들웨어나 핸들러에 위임
  if (isIgnoredRoute(req)) {
    console.log('무시할 경로 접근:', req.nextUrl.pathname);
    return NextResponse.next();
  }

  // 인증 상태 확인 (비동기 처리)
  const { userId, sessionClaims } = await auth();
  
  // 인증되지 않은 경우
  if (!userId) {
    console.log('인증되지 않은 사용자, 로그인 페이지로 리다이렉트');
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // 테스트를 위한 임시 역할 할당 (실제로는 sessionClaims에서 가져와야 함)
  const userRole = sessionClaims?.role || (userId ? TEST_ROLE_MAPPING[userId] : undefined) || "kol";
  console.log('사용자 역할:', userRole, '현재 경로:', req.nextUrl.pathname);
  
  // 사용자가 /dashboard로 접근하는 경우 역할별 리다이렉트
  if (req.nextUrl.pathname === "/dashboard") {
    if (userRole === "본사관리자") {
      // 테스트 페이지 A: 관리자 대시보드
      console.log('관리자가 대시보드 접근, admin으로 리다이렉트');
      return NextResponse.redirect(new URL("/admin", req.url));
    } else if (userRole === "kol") {
      // KOL 사용자를 임시로 새 페이지로 리다이렉트
      console.log('KOL이 대시보드 접근, kol-new로 리다이렉트');
      return NextResponse.redirect(new URL("/kol-new", req.url));
    }
  }
  
  // KOL 역할 사용자가 /kol로 시작하는 경로에 접근하면 /kol-new로 리다이렉트
  if (userRole === "kol" && req.nextUrl.pathname.startsWith("/kol")) {
    console.log('KOL이 /kol 경로 접근, kol-new로 리다이렉트');
    return NextResponse.redirect(new URL("/kol-new", req.url));
  }

  return NextResponse.next();
});

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
}; 