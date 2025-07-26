import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  const supabaseResponse = await updateSession(request);

  // CORS 헤더 설정 - 모든 origin 허용
  const origin = request.headers.get('origin');

  // 모든 origin 허용 (개발/테스트용)
  supabaseResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
  supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  supabaseResponse.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  supabaseResponse.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  supabaseResponse.headers.set('Access-Control-Max-Age', '86400');

  // Referrer Policy 완화
  supabaseResponse.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');

  // X-Frame-Options 제거 (iframe 허용)
  supabaseResponse.headers.delete('X-Frame-Options');

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: supabaseResponse.headers });
  }

  return supabaseResponse;
}

// 모든 경로에 미들웨어 적용
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
