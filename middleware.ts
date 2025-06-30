import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요하지 않은 공개 경로
const PUBLIC_PATHS = [
  '/auth/dev-login',
  '/api/auth',
  '/_next',
  '/favicon.ico'
];

// 보호된 경로 (인증 필요)
const PROTECTED_PATHS = [
  '/kol-new',
  '/admin-new',
  '/admin-dashboard',
  '/foxadmin'
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

function isDevUserAuthenticated(request: NextRequest): boolean {
  // 개발환경에서는 쿠키에서 dev-user 정보 확인
  const devUserCookie = request.cookies.get('dev-user')?.value;
  return !!devUserCookie;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('미들웨어 처리 중:', pathname);

  // 공개 경로는 그대로 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 루트 경로 처리
  if (pathname === '/') {
    // 개발환경에서는 dev-login으로 리다이렉트
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.redirect(new URL('/auth/dev-login', request.url));
    }
    // TODO: 프로덕션에서는 실제 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/dev-login', request.url));
  }

  // 보호된 경로에 대한 인증 확인
  if (isProtectedPath(pathname)) {
    if (process.env.NODE_ENV === 'development') {
      // 개발환경에서는 항상 접근 허용 (추후 쿠키 확인 로직 추가 가능)
      return NextResponse.next();
    } else {
      // TODO: 프로덕션에서는 Supabase 세션 확인
      return NextResponse.redirect(new URL('/auth/dev-login', request.url));
    }
  }

  return NextResponse.next();
}

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
}; 