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

  // 간단한 인증 시스템은 클라이언트 사이드에서 처리
  // middleware에서는 최소한의 체크만 수행
  return NextResponse.next();
}

export const config = {
  /*
   * Next.js 미들웨어가 실행될 경로 설정
   * API 라우트, static 파일, favicon 등은 제외
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
