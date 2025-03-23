/**
 * 데이터베이스 테이블 생성 스크립트
 * 
 * 사용 방법: node scripts/init-db.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase 연결 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 서비스 롤 키 사용

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL 파일 읽기 함수
function readSqlFile(fileName) {
  try {
    const filePath = path.join(__dirname, '..', 'db', 'sql', fileName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    console.warn(`${filePath} 파일이 존재하지 않습니다.`);
    return null;
  } catch (error) {
    console.error(`SQL 파일 읽기 오류: ${error.message}`);
    return null;
  }
}

// exec_sql 함수 생성 (이 함수가 없으면 다른 SQL 실행이 불가능)
async function createExecSqlFunction() {
  console.log('exec_sql 함수 생성 중...');
  
  const sql = readSqlFile('create_exec_sql_function.sql');
  if (!sql) {
    console.error('create_exec_sql_function.sql 파일을 찾을 수 없습니다.');
    return false;
  }
  
  try {
    // SQL 직접 실행 (Supabase SQL API)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ _sql: sql }),
    }).catch(error => {
      console.log('fetch 오류:', error);
      return { ok: false, error };
    });
    
    if (!response.ok) {
      // 함수가 없다면 직접 SQL을 실행하기 위한 대체 방법 시도
      console.log('exec_sql 함수가 없습니다. 함수를 직접 생성합니다.');
      
      // pgrest 관련 오류인 경우 (함수 없음)
      if (response.status === 404 || response.status === 500) {
        // 직접 SQL 쿼리 실행 (PostgreSQL 연결 필요)
        console.log('백업 방법 시도: 데이터베이스 콘솔에서 직접 실행하는 SQL 스크립트를 제공합니다.');
        console.log('---------- SQL 스크립트 시작 ----------');
        console.log(sql);
        console.log('---------- SQL 스크립트 끝 ----------');
        console.log('위의 SQL을 Supabase 대시보드의 SQL 에디터에서 직접 실행한 후 이 스크립트를 다시 실행하세요.');
        
        return false;
      }
      
      const errorText = await response.text();
      console.error('exec_sql 함수 호출 실패:', errorText);
      return false;
    }
    
    console.log('exec_sql 함수가 생성되었습니다.');
    return true;
  } catch (error) {
    console.error('exec_sql 함수 생성 중 오류:', error);
    
    // 대체 방법 안내
    console.log('대체 방법: Supabase 대시보드의 SQL 에디터에서 다음 SQL을 실행하세요:');
    console.log(sql);
    
    return false;
  }
}

// SQL 실행 함수
async function execSql(sql, description = '') {
  if (!sql) {
    console.error('SQL이 제공되지 않았습니다.');
    return false;
  }
  
  try {
    console.log(`[${description}] SQL 실행 중...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { _sql: sql });
    
    if (error) {
      console.error(`[${description}] SQL 실행 오류:`, error);
      return false;
    }
    
    console.log(`[${description}] SQL 실행 성공`);
    return true;
  } catch (error) {
    console.error(`[${description}] SQL 실행 중 오류:`, error);
    return false;
  }
}

// 테이블 생성 함수
async function createTable(tableName, fileName, description) {
  console.log(`${description} 생성 중...`);
  
  const sql = readSqlFile(fileName);
  if (!sql) {
    console.warn(`${fileName} 파일이 없습니다. 이 테이블은 건너뜁니다.`);
    return false;
  }
  
  const result = await execSql(sql, description);
  console.log(`${tableName} 테이블 생성 결과: ${result ? '성공' : '실패'}`);
  return result;
}

// 메인 함수
async function main() {
  console.log('데이터베이스 테이블 생성을 시작합니다...');
  
  // 1. exec_sql 함수 생성
  const execSqlCreated = await createExecSqlFunction();
  if (!execSqlCreated) {
    console.error('exec_sql 함수를 생성할 수 없습니다. 프로세스를 중단합니다.');
    process.exit(1);
  }
  
  // 2. 테이블 생성
  const tables = [
    { name: 'users', file: 'create_users_table.sql', description: 'Users 테이블' },
    { name: 'whitelisted_emails', file: 'create_whitelist_table.sql', description: 'Whitelist 테이블' },
    { name: 'kols', file: 'create_kols_table.sql', description: 'KOLs 테이블' },
    { name: 'shops', file: 'create_shops_table.sql', description: 'Shops 테이블' },
    { name: 'products', file: 'create_products_table.sql', description: 'Products 테이블' },
    { name: 'orders', file: 'create_orders_table.sql', description: 'Orders 테이블' },
    { name: 'order_items', file: 'create_order_items_table.sql', description: 'Order Items 테이블' },
    { name: 'commissions', file: 'create_commissions_table.sql', description: 'Commissions 테이블' },
    { name: 'notifications', file: 'create_notifications_table.sql', description: 'Notifications 테이블' }
  ];
  
  for (const table of tables) {
    await createTable(table.name, table.file, table.description);
  }
  
  console.log('데이터베이스 테이블 생성이 완료되었습니다.');
}

// 스크립트 실행
main().catch(error => {
  console.error('데이터베이스 테이블 생성 중 오류 발생:', error);
  process.exit(1);
}); 