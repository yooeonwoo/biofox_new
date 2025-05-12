/**
 * 데이터베이스 액세스 모듈
 * 전체 애플리케이션에서 일관된 Supabase 클라이언트 제공
 */
import { serverSupabase } from '../lib/supabase';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Supabase 클라이언트 내보내기
export const supabase = serverSupabase;

// 환경 변수에서 데이터베이스 URL을 가져옵니다.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

// Neon 데이터베이스 연결 풀을 생성합니다.
const pool = new Pool({ connectionString });

// Drizzle ORM 클라이언트를 생성합니다.
export const db = drizzle(pool, { schema });

// 단일 객체로 내보내기 (ESLint 경고 방지)
const dbExports = {
  db
};

export default dbExports;

// 이전 코드 호환성을 위해 getDB 함수도 유지
export async function getDB() {
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  }
  
  // Drizzle ORM 초기화 및 반환
  return db;
}

// SQL 헬퍼 함수
export const sql = {
  /**
   * 지정된 테이블의 모든 레코드를 조회
   * @param table 테이블 이름
   * @returns 테이블의 모든 레코드
   */
  async selectAll(table: string) {
    const { data, error } = await serverSupabase
      .from(table)
      .select('*');
      
    if (error) throw error;
    return data;
  },
  
  /**
   * 지정된 테이블에서 조건에 맞는 레코드 조회
   * @param table 테이블 이름
   * @param column 조건 컬럼
   * @param value 조건 값
   * @returns 조건에 맞는 레코드
   */
  async selectWhere(table: string, column: string, value: any) {
    const { data, error } = await serverSupabase
      .from(table)
      .select('*')
      .eq(column, value);
      
    if (error) throw error;
    return data;
  },
  
  /**
   * 지정된 테이블에 레코드 삽입
   * @param table 테이블 이름
   * @param record 삽입할 레코드
   * @returns 삽입된 레코드
   */
  async insert(table: string, record: any) {
    const { data, error } = await serverSupabase
      .from(table)
      .insert(record)
      .select();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * 지정된 테이블의 레코드 수정
   * @param table 테이블 이름
   * @param id 수정할 레코드 ID
   * @param updates 수정할 내용
   * @returns 수정된 레코드
   */
  async update(table: string, id: number, updates: any) {
    const { data, error } = await serverSupabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * 지정된 테이블의 레코드 삭제
   * @param table 테이블 이름
   * @param id 삭제할 레코드 ID
   * @returns 삭제 결과
   */
  async delete(table: string, id: number) {
    const { error } = await serverSupabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },
  
  /**
   * 원시 SQL 쿼리 실행
   * @param queryString SQL 쿼리 문자열
   * @param params 쿼리 파라미터
   * @returns 쿼리 결과
   */
  async raw(queryString: string, params?: any[]) {
    const { data, error } = await serverSupabase.rpc('execute_sql', {
      query_text: queryString,
      params: params || []
    });
    
    if (error) throw error;
    return data;
  }
};

// 스키마 타입 내보내기 (기존 타입 지원 유지)
export * from './schema'; 