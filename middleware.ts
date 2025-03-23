import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// 공개 라우트(로그인 없이 접근 가능)
const publicPaths = [
  "/", 
  "/signin", 
  "/signup", 
  "/api/webhook",
  "/api/whitelist"
];

// 이 설정은 어떤 경로가 인증이 필요한지와 리다이렉트 동작을 정의합니다.
export default authMiddleware({
  // 공개 접근 가능한 경로
  publicRoutes: publicPaths,
  
  // 인증되지 않은 사용자를 처리하는 방법
  afterAuth(auth, req) {
    // 사용자가 로그인하지 않았고 공개 경로가 아닌 경우
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/signin', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // 화이트리스트 검증이 완료되지 않은 경우 대기 페이지로 리다이렉트
    if (auth.userId && req.nextUrl.pathname !== "/pending-approval" && auth.sessionClaims?.role === "unverified") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }

    // 관리자의 경우 관리자 대시보드로 리다이렉트
    if (auth.userId && auth.sessionClaims?.role === "본사관리자" && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // KOL의 경우 KOL 대시보드로 리다이렉트
    if (auth.userId && auth.sessionClaims?.role === "kol" && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/kol/dashboard", req.url));
    }

    return NextResponse.next();
  },
});

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(css|js|jpg|jpeg|png|gif|svg|ico|webp)).*)",
    "/(api|trpc)(.*)",
  ],
}; 