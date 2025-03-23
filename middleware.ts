import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// 공개 라우트(로그인 없이 접근 가능)
const publicPaths = [
  "/",
  "/signin(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)"
];

// 이 설정은 어떤 경로가 인증이 필요한지와 리다이렉트 동작을 정의합니다.
export default authMiddleware({
  // 공개 접근 가능한 경로
  publicRoutes: publicPaths,
  
  // 인증되지 않은 사용자를 처리하는 방법
  afterAuth(auth, req) {
    // 로그인 체크
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/signin', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // 권한별 리다이렉트
    if (auth.userId && auth.sessionClaims?.role === "본사관리자" && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (auth.userId && auth.sessionClaims?.role === "kol" && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/kol/dashboard", req.url));
    }

    return NextResponse.next();
  },
});

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
}; 