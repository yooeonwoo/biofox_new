import { drizzle } from 'drizzle-orm/postgres-js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { supabase } from './utils';
import * as schema from './schema';

// Supabase 연결을 래핑하여 Drizzle ORM과 함께 사용
// PostgreSQL 네이티브 연결 대신 Supabase 클라이언트를 통한 연결 사용
let db: PostgresJsDatabase<typeof schema>;

// Supabase 클라이언트를 통한 데이터베이스 접근을 래핑한 함수
export async function getDB(): Promise<PostgresJsDatabase<typeof schema>> {
  // db 인스턴스가 이미 생성되어 있으면 그것을 반환
  if (db) {
    return db;
  }

  try {
    // Supabase의 REST API 대신 직접 DB 연결이 필요한 경우
    // 환경 변수에서 데이터베이스 연결 정보 가져오기
    const connectionString = process.env.DATABASE_URL || '';

    // 동적으로 postgres 모듈 가져오기
    const postgres = (await import('postgres')).default;

    // 클라이언트 생성 (SSL 옵션 추가)
    const client = postgres(connectionString, { 
      ssl: true,
      max: 10, // 커넥션 풀 최대 크기
      idle_timeout: 20, // 유휴 타임아웃(초)
      connect_timeout: 30, // 연결 타임아웃 증가(초)
    });

    // Drizzle ORM 인스턴스 생성
    db = drizzle(client, { schema });
    return db;
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    throw error;
  }
}

// Supabase 클라이언트를 통한 데이터 접근 함수 제공
export { supabase };

// 스키마 내보내기
export * from './schema'; 