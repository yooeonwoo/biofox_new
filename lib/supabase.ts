import { createClient } from '@supabase/supabase-js';

// 환경 변수 체크 및 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : '';

// 환경 변수 로그 출력 (디버깅용)
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  console.log('Supabase URL:', supabaseUrl ? '설정됨' : '미설정');
  console.log('Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '미설정');
}

// URL 검증 함수
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// URL 검증 결과
const validSupabaseUrl = isValidUrl(supabaseUrl) 
  ? supabaseUrl 
  : 'https://placeholder-url.supabase.co';

const validSupabaseKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

if (!isValidUrl(supabaseUrl)) {
  console.error('⚠️ 유효하지 않은 Supabase URL입니다:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_URL 환경 변수를 확인해주세요.');
}

// 서버 사이드 전용 Supabase 클라이언트 (API 라우트에서 사용)
// 서버사이드에서는 서비스 키 대신 익명 키를 사용해 세션 기반 인증만 처리
export const serverSupabase = createClient(validSupabaseUrl, validSupabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'biofox-kol-server',
    },
    fetch: async (...args) => {
      const [url, config] = args;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃으로 단축

      try {
        // IPv4 강제 적용을 위한 URL 직접 수정
        let urlObj;
        try {
          urlObj = new URL(url.toString());
          // 수정된 부분: URL의 hostname이 IPv6 주소인 경우 처리
          if (urlObj.hostname.includes(':')) {
            console.log('IPv6 주소 감지, IPv4로 변환 시도');
            // Supabase URL이 있다면 그것을 사용
            if (validSupabaseUrl && validSupabaseUrl !== 'https://placeholder-url.supabase.co') {
              urlObj = new URL(validSupabaseUrl);
            }
          }
        } catch (e) {
          console.error('URL 파싱 오류:', e);
        }

        const customConfig = {
          ...config,
          signal: controller.signal,
          keepalive: true,
        };

        const response = await fetch(urlObj || url, customConfig);
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Database connection timeout');
        }
        console.error('Supabase 연결 오류:', error);
        throw error;
      }
    },
  },
});

// 클라이언트 사이드 Supabase 클라이언트
export const supabase = createClient(validSupabaseUrl, validSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'biofox-kol-client',
    },
    fetch: async (...args) => {
      const [url, config] = args;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃 (클라이언트는 더 짧게)

      try {
        // IPv4 강제 적용을 위한 URL 직접 수정
        let urlObj;
        try {
          urlObj = new URL(url.toString());
          // 수정된 부분: URL의 hostname이 IPv6 주소인 경우 처리
          if (urlObj.hostname.includes(':')) {
            console.log('IPv6 주소 감지, IPv4로 변환 시도');
            // Supabase URL이 있다면 그것을 사용
            if (validSupabaseUrl && validSupabaseUrl !== 'https://placeholder-url.supabase.co') {
              urlObj = new URL(validSupabaseUrl);
            }
          }
        } catch (e) {
          console.error('URL 파싱 오류:', e);
        }

        const customConfig = {
          ...config,
          signal: controller.signal,
          keepalive: true,
        };

        const response = await fetch(urlObj || url, customConfig);
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Database connection timeout');
        }
        throw error;
      }
    },
  },
});

// 캐싱 설정 상수 (모든 API에서 공통으로 사용)
export const CACHE_SETTINGS = {
  REVALIDATE_TIME: 300, // 5분마다 재검증
  CACHE_CONTROL_HEADER: 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
};

// Supabase 쿼리 결과를 카멜케이스로 변환하는 유틸리티 함수
export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {} as any);
} 