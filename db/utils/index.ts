/**
 * Supabase와 DB 연동을 위한 유틸리티 함수
 */
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
          clerkId,
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
      .eq('clerkId', clerkId);

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
      .eq('clerkId', clerkId)
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