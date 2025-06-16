import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// 테스트나 서버 사이드 환경에서는 SERVICE_ROLE 키를 우선 사용해 RLS 제한을 우회
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// test 환경(jsdom) 또는 서버 사이드(Node)에서는 SERVICE_ROLE 키 사용
const isTestEnv = typeof process !== 'undefined' && (process.env.VITEST || process.env.NODE_ENV === 'test');
const useServiceKey = (typeof window === 'undefined' || isTestEnv) && supabaseServiceKey;

// 브라우저에 노출되지 않는 안전한 키 선택 (SERVICE_ROLE 키가 있으면 사용, 없으면 익명키)
const supabaseKey = useServiceKey ? supabaseServiceKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

// Supabase 클라이언트 (테스트/서버 → service key, 브라우저 → anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * API 요청 시 사용할 fetchOptions 
 * (Supabase 세션 쿠키를 API 요청에 포함시키기 위해 사용)
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // credentials: 'include'를 설정하여 쿠키가 요청과 함께 전송되도록 합니다
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 옵션 병합
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // 401 (Unauthorized) 응답을 받았을 때 처리
    if (response.status === 401) {
      console.error('인증 실패: API 세션이 만료되었거나 유효하지 않습니다.');
      
      // 로그인 페이지로 리다이렉트 (선택적)
      // window.location.href = '/signin';
    }
    
    return response;
  } catch (error) {
    console.error('API 요청 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 클라이언트에서의 Supabase 로그인 처리
 * (이메일/비밀번호 로그인)
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

/**
 * 로그아웃 처리
 */
export const signOut = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    // 로그아웃 후 메인 페이지로 리다이렉트 (선택적)
    // window.location.href = '/';
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
};

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
};

/**
 * 세션 상태 구독 (세션 변경 감지)
 * @param callback 세션 변경 시 호출될 콜백 함수
 */
export const subscribeToAuthChanges = (
  callback: (event: any, session: any) => void
) => {
  const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};

// Supabase SSR & Browser 클라이언트 헬퍼 -----------------------------
// 브라우저(클라이언트 컴포넌트) 전용 클라이언트
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Server Component / API Route 등 쿠키 기반 세션이 필요한 환경 전용 클라이언트
// 서버 측에서는 (Service Role → RLS 우회) 키를 우선 사용, 없으면 익명키 사용
export const supabaseServer = (cookieStore: any) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore as any,
    }
  ); 