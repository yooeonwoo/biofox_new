import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// 서버 사이드 전용 Supabase 클라이언트 (API 라우트에서 사용)
export const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
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
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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