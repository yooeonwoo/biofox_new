/**
 * Supabase와 DB 연동을 위한 유틸리티 함수
 */
import { createClient } from '@supabase/supabase-js';

// 환경 변수 체크 및 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : supabaseAnonKey;

// 환경 변수 로그 출력 (디버깅용)
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  console.log('DB Utils - Supabase URL:', supabaseUrl ? '설정됨' : '미설정');
  console.log('DB Utils - Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '미설정');
  console.log('DB Utils - Supabase Service Key:', supabaseServiceKey ? '설정됨' : '미설정');
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
  console.error('⚠️ DB Utils - 유효하지 않은 Supabase URL입니다:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_URL 환경 변수를 확인해주세요.');
}

// Supabase 클라이언트 설정
export const supabase = createClient(validSupabaseUrl, validSupabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Supabase Admin 클라이언트 설정
export const supabaseAdmin = createClient(validSupabaseUrl, validServiceKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * 사용자 정보를 DB에 저장합니다.
 * @param clerkId Clerk 사용자 ID
 * @param email 이메일
 * @param role 역할
 * @returns 저장된 사용자 정보
 */
export async function saveUserToDB(clerkId: string, email: string, role: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          clerk_id: clerkId,
          email,
          role,
        }
      ])
      .select();

    if (error) {
      console.error('사용자 저장 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('사용자 저장 실패:', error);
    throw error;
  }
}

/**
 * 사용자 정보를 DB에서 삭제합니다.
 * @param clerkId Clerk 사용자 ID
 * @returns 삭제 결과
 */
export async function deleteUserFromDB(clerkId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', clerkId);

    if (error) {
      console.error('사용자 삭제 오류:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    throw error;
  }
}

/**
 * Clerk 사용자 ID로 사용자 정보를 조회합니다.
 * @param clerkId Clerk 사용자 ID
 * @returns 사용자 정보
 */
export async function getUserByClerkId(clerkId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    throw error;
  }
}

/**
 * 모든 사용자 정보를 조회합니다.
 * @returns 사용자 목록
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
} 