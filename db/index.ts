import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 환경 변수에서 데이터베이스 연결 정보 가져오기
const connectionString = process.env.DATABASE_URL || '';

// 클라이언트 생성
const client = postgres(connectionString);

// Drizzle ORM 인스턴스 생성
export const db = drizzle(client, { schema });

// 스키마 내보내기
export * from './schema'; 