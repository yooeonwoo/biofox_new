import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 라우트 정의
const PROTECTED_ROUTES = {
  // 관리자 전용 라우트
  admin: ['/admin-dashboard', '/admin-new', '/biofox-admin'],
  // KOL 전용 라우트
  kol: ['/kol-new'],
  // 매장 관리자 전용 라우트
  shop_owner: ['/shop'],
  // 인증된 사용자 전용 라우트 (역할 무관)
  authenticated: ['/profile'],
};

// 인증 관련 라우트 (로그인된 사용자는 접근 불가)
const AUTH_ROUTES = ['/signin', '/signup', '/auth'];

// 공개 라우트 (인증 불필요)
const PUBLIC_ROUTES = ['/', '/api', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 공개 라우트는 바로 통과
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Convex Auth 토큰 확인 (실제로는 더 복잡한 검증 필요)
  // 현재는 기본적인 구현으로, 실제 Convex Auth 토큰 검증은 클라이언트에서 처리
  const authToken =
    request.cookies.get('convex-auth-token') || request.headers.get('authorization');

  const isAuthenticated = !!authToken;

  // 인증이 필요한 라우트 확인
  const requiresAuth = [
    ...PROTECTED_ROUTES.admin,
    ...PROTECTED_ROUTES.kol,
    ...PROTECTED_ROUTES.shop_owner,
    ...PROTECTED_ROUTES.authenticated,
  ].some(route => pathname.startsWith(route));

  // 인증되지 않은 사용자가 보호된 라우트에 접근
  if (requiresAuth && !isAuthenticated) {
    const loginUrl = new URL('/signin', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자가 인증 페이지에 접근 (로그인/회원가입)
  if (isAuthenticated && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 역할 기반 접근 제어는 클라이언트 사이드에서 처리
  // (서버에서는 사용자 역할 정보를 쉽게 얻을 수 없으므로)

  return NextResponse.next();
}

export const config = {
  /*
   * Next.js 미들웨어가 실행될 경로 설정
   * API 라우트, static 파일, favicon 등은 제외
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
