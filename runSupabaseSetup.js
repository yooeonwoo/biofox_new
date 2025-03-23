const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('=== Supabase 데이터베이스 테이블 생성 스크립트 실행 ===');
console.log('Supabase URL:', supabaseUrl);

try {
  console.log('테이블 생성 SQL 스크립트를 실행합니다...');
  console.log('이 작업은 Supabase SQL 에디터에서 직접 실행하는 것이 더 안전합니다.');
  console.log('README-DB-SETUP.md 파일을 참조하여 SQL 에디터에서 실행하세요.');
  console.log('supabase-setup.sql 파일에 모든 테이블 생성 및 목업 데이터 삽입 SQL이 포함되어 있습니다.');
  
  console.log('\n=== 스크립트 파일 확인 ===');
  console.log('supabase-setup.sql 파일 경로:', path.resolve('./supabase-setup.sql'));
  console.log('README-DB-SETUP.md 파일 경로:', path.resolve('./README-DB-SETUP.md'));
  
  console.log('\n=== 수행할 단계 ===');
  console.log('1. Supabase 대시보드에 로그인 (https://app.supabase.com)');
  console.log('2. 프로젝트를 선택하고 왼쪽 메뉴에서 SQL 편집기 선택');
  console.log('3. 새 쿼리 생성 후 supabase-setup.sql 내용을 붙여넣기');
  console.log('4. 실행 버튼 클릭');
  
  console.log('\n완료 후 테이블 에디터에서 다음 테이블이 생성되었는지 확인:');
  console.log('users, kols, shops, products, orders, order_items, commissions, notifications');
} catch (error) {
  console.error('오류 발생:', error);
  process.exit(1);
} 