import { serverSupabase as supabaseAdmin } from '@/lib/supabase';
import { executeSql as execSql } from './utils/execute-sql';
import fs from 'fs';
import path from 'path';

/**
 * SQL 파일을 읽어서 반환하는 함수
 */
function readSqlFile(fileName: string): string {
  const filePath = path.join(process.cwd(), 'db', 'sql', fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`${filePath} 파일이 존재하지 않습니다.`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * SQL을 직접 실행하는 함수
 */
async function executeSql(sql: string, description: string = ''): Promise<any> {
  // 외부 executeSql 함수 호출
  return execSql(sql, description);
}

export async function initializeRpcFunctions() {
  console.log('SQL 실행 RPC 함수 초기화 중...');
  
  // 1. exec_sql 함수 생성
  const execSqlFunctionSql = readSqlFile('create_exec_sql_function.sql');
  if (!execSqlFunctionSql) {
    console.error('exec_sql 함수 SQL 파일을 찾을 수 없습니다.');
    return { success: false, message: 'SQL 파일을 찾을 수 없습니다.' };
  }
  
  try {
    // exec_sql 함수가 없을 수 있으므로 직접 SQL을 실행
    const result = await directExecuteSql(execSqlFunctionSql);
    if (!result.success) {
      console.error('exec_sql 함수 생성 실패:', result);
      return result;
    }
    
    console.log('exec_sql 함수가 생성/업데이트되었습니다.');
    
    // 2. run_sql_query 함수 생성
    const runSqlQueryQuery = `
      CREATE OR REPLACE FUNCTION run_sql_query(sql_query text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;
        RETURN result;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
      END;
      $$;
      
      ALTER FUNCTION run_sql_query(text) OWNER TO postgres;
      REVOKE ALL ON FUNCTION run_sql_query(text) FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION run_sql_query(text) TO service_role;
    `;
    
    // exec_sql 함수를 사용해 run_sql_query 함수 생성
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { _sql: runSqlQueryQuery });
    
    if (error) {
      console.error('run_sql_query 함수 생성 실패:', error);
      return { success: false, message: 'run_sql_query 함수 생성 실패', details: error };
    }
    
    console.log('run_sql_query 함수가 생성/업데이트되었습니다.');
    
    // 3. create_users_table 함수 생성 - 테이블이 없을 때 사용할 함수
    const createUsersTableQuery = `
      CREATE OR REPLACE FUNCTION create_users_table()
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          clerk_id VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) NOT NULL DEFAULT 'kol',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        -- 업데이트 트리거 추가
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- 트리거가 없으면 생성
        DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
        CREATE TRIGGER update_users_modtime
          BEFORE UPDATE ON public.users
          FOR EACH ROW EXECUTE FUNCTION update_modified_column();
          
        RETURN jsonb_build_object('success', true, 'message', 'Users table created successfully');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', SQLSTATE);
      END;
      $$;
      
      ALTER FUNCTION create_users_table() OWNER TO postgres;
      REVOKE ALL ON FUNCTION create_users_table() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION create_users_table() TO service_role;
    `;
    
    // exec_sql 함수를 사용해 create_users_table 함수 생성
    const { data: usersData, error: usersError } = await supabaseAdmin.rpc('exec_sql', { _sql: createUsersTableQuery });
    
    if (usersError) {
      console.error('create_users_table 함수 생성 실패:', usersError);
      return { success: false, message: 'create_users_table 함수 생성 실패', details: usersError };
    }
    
    console.log('create_users_table 함수가 생성/업데이트되었습니다.');
    
    return { success: true };
  } catch (error) {
    console.error('RPC 함수 초기화 중 오류 발생:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * exec_sql 함수가 없을 때 직접 SQL을 실행하는 함수
 */
async function directExecuteSql(sql: string): Promise<any> {
  try {
    // 직접 Supabase API를 호출하여 SQL 실행
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return { 
        success: false, 
        message: 'Supabase URL 또는 SERVICE_ROLE_KEY가 설정되지 않았습니다.' 
      };
    }
    
    // SQL 쿼리를 직접 실행하려면 Supabase에서 제공하는 SQL 실행 API를 사용
    // 이 예제에서는 PSQL 명령을 직접 실행하므로 설정된 RLS를 우회
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('직접 SQL 실행 실패:', errorData);
      return { success: false, message: '직접 SQL 실행 실패', details: errorData };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('직접 SQL 실행 중 오류 발생:', error);
    return { 
      success: false, 
      message: '직접 SQL 실행 중 오류 발생', 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

// SQL 실행 함수를 외부로 노출
export { executeSql }; 