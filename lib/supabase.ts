import { createClient } from '@supabase/supabase-js';

// 환경 변수 체크 및 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : supabaseAnonKey;

// 환경 변수 로그 출력 (디버깅용)
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  console.log('Supabase URL:', supabaseUrl ? '설정됨' : '미설정');
  console.log('Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '미설정');
  console.log('Supabase Service Key:', supabaseServiceKey ? '설정됨' : '미설정');
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
const validServiceKey = supabaseServiceKey || validSupabaseKey;

if (!isValidUrl(supabaseUrl)) {
  console.error('⚠️ 유효하지 않은 Supabase URL입니다:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_URL 환경 변수를 확인해주세요.');
}

// 서버 사이드 전용 Supabase 클라이언트 (API 라우트에서 사용)
export const serverSupabase = createClient(validSupabaseUrl, validServiceKey, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: async (...args) => {
      const [url, config] = args;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
          keepalive: true,
        });
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
    fetch: async (...args) => {
      const [url, config] = args;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃 (클라이언트는 더 짧게)

      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
          keepalive: true,
        });
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

// 타임스탬프 형식의 현재 날짜를 YYYY-MM 형식으로 반환
export function getCurrentYearMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

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