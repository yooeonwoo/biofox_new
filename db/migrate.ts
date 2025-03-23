import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from './utils';
import { initializeRpcFunctions } from './init-rpc';
import { executeSql } from './utils/execute-sql';

/**
 * SQL 파일의 내용을 읽어 반환하는 함수
 */
function readSqlFile(fileName: string): string {
  const filePath = path.join(process.cwd(), 'db', 'sql', fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`${filePath} 파일을 찾을 수 없습니다.`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 데이터베이스 마이그레이션 실행
 */
export async function migrateDatabase() {
  console.log('데이터베이스 마이그레이션을 시작합니다...');

  try {
    // 1. RPC 함수 초기화
    const rpcResult = await initializeRpcFunctions();
    console.log('RPC 함수 초기화 결과:', rpcResult);
    
    if (!rpcResult.success) {
      console.error('RPC 함수 초기화에 실패했습니다.');
      return { success: false, message: 'RPC 함수 초기화 실패', details: rpcResult };
    }
    
    // 2. 종속성 순서대로 테이블 생성
    const tables = [
      { name: 'users', file: 'create_users_table.sql', description: 'Users 테이블' },
      { name: 'whitelist', file: 'create_whitelist_table.sql', description: 'Whitelist 테이블' },
      { name: 'kols', file: 'create_kols_table.sql', description: 'KOLs 테이블' },
      { name: 'shops', file: 'create_shops_table.sql', description: 'Shops 테이블' }
    ];
    
    const tableResults = [];
    
    // 테이블 순서대로 생성
    for (const table of tables) {
      try {
        // 파일이 존재하는지 확인
        const sqlContent = readSqlFile(table.file);
        
        if (!sqlContent) {
          console.warn(`${table.file} 파일이 없습니다. 이 테이블은 건너뜁니다.`);
          continue;
        }
        
        // SQL 실행 - exec_sql RPC 함수 사용
        console.log(`${table.description} 생성 중...`);
        const result = await executeSql(sqlContent, table.description);
        
        tableResults.push({
          table: table.name,
          success: result.success,
          data: result.data,
          error: result.success ? null : result.message
        });
        
        console.log(`${table.name} 테이블 생성 결과:`, result.success ? '성공' : '실패');
      } catch (error) {
        console.error(`${table.name} 테이블 생성 중 오류:`, error);
        tableResults.push({
          table: table.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 3. 테이블 존재 확인
    const { data, error } = await supabaseAdmin.from('users').select('count');
    if (error) {
      console.error('users 테이블이 없습니다:', error);
    } else {
      console.log('users 테이블이 확인되었습니다:', data);
    }

    console.log('데이터베이스 마이그레이션이 완료되었습니다.');
    return { success: true, tableResults, usersTable: error ? null : data };
  } catch (error) {
    console.error('데이터베이스 마이그레이션 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 