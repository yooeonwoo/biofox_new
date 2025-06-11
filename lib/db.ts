import { supabaseAdmin } from './supabase-admin';

/**
 * Supabase SDK 기반 DB 액세스 모듈
 * 기존 pg Pool 기반 구현을 Supabase RPC(exec_sql) 호출로 대체합니다.
 */

// pg Pool 제거 → Supabase RPC 래퍼 함수 구현
const query = async (text: string, params: any[] = []) => {
  const start = Date.now();
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      _sql: text,
      params,
    });

    if (error) throw error;

    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: data?.length || 0 });

    // pg Pool.query 와 유사한 반환 형태 유지
    return {
      rows: data,
      rowCount: data?.length || 0,
    };
  } catch (error) {
    console.error('쿼리 오류:', error);
    throw error;
  }
};

// Pool 등 불필요 객체 제거, query 만 노출
export const db = {
  query,
};