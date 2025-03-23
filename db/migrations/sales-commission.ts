/**
 * 매출수당계산 데이터베이스 마이그레이션 스크립트
 * 
 * 다음 테이블을 생성합니다:
 * - monthly_sales: KOL별, 전문점별 월별 매출 및 수당 관리
 * - product_sales_ratios: 전문점별 제품 매출 비율 관리
 * - kol_hierarchy: KOL 계층 구조 관리
 * - kol_monthly_summary: KOL 월별 매출/수당 요약 데이터
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// 환경변수에서 데이터베이스 연결 정보 가져오기
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 마이그레이션 실행 함수
async function runMigration() {
  console.log('매출수당계산 테이블 마이그레이션을 시작합니다...');
  
  try {
    // Postgres 연결 설정
    const sql = postgres(connectionString, { max: 1 });
    
    // Drizzle 인스턴스 생성
    const db = drizzle(sql);
    
    // 마이그레이션 실행
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('마이그레이션이 성공적으로 완료되었습니다.');
    
    // 연결 종료
    await sql.end();
  } catch (error) {
    console.error('마이그레이션 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
runMigration(); 