import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 로컬 개발 환경에서는 모든 라우트에 자유롭게 접근 가능
  console.log('미들웨어 처리 중:', request.nextUrl.pathname);
  
  // 단순히 요청을 통과시킴
  return NextResponse.next();
}

// Static files 및 public 폴더에서는 미들웨어 실행 방지
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
}; 