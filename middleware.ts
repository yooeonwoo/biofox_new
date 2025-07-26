import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 응답 생성
  const response = NextResponse.next();

  // CORS 헤더 설정 - 모든 origin 허용
  const origin = request.headers.get('origin');

  // 모든 origin 허용 (개발/테스트용)
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '86400');

  // Referrer Policy 완화
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');

  // X-Frame-Options 제거 (iframe 허용)
  response.headers.delete('X-Frame-Options');

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

// 모든 경로에 미들웨어 적용
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
