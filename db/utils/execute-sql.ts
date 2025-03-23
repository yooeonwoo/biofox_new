import { supabaseAdmin } from './index';

/**
 * SQL을 실행하는 함수
 * @param sql 실행할 SQL 쿼리
 * @param description 로깅을 위한 설명
 * @returns 실행 결과
 */
export async function executeSql(sql: string, description: string = ''): Promise<any> {
  if (!sql) return { success: false, message: '실행할 SQL이 없습니다.' };
  
  try {
    console.log(`[${description}] SQL 실행 중...`);
    
    // 관리자 권한으로 SQL 직접 실행
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { _sql: sql });
    
    if (error) {
      console.error(`[${description}] SQL 실행 오류:`, error);
      
      // 함수가 없는 경우
      if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
        console.log('[주의] exec_sql 함수가 없습니다. Supabase SQL 에디터에서 직접 실행해주세요.');
        
        // REST API로 직접 SQL 실행 시도
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              'Prefer': 'params=single-object'
            },
            body: JSON.stringify({ query: sql }),
          });
          
          if (!response.ok) {
            const result = await response.json();
            console.error('[REST API] SQL 실행 실패:', result);
            return { success: false, message: 'SQL 실행 실패 (REST API)', details: result };
          }
          
          const result = await response.json();
          console.log(`[${description}] REST API로 SQL 실행 성공:`, result);
          return { success: true, data: result };
        } catch (restError) {
          console.error('[REST API] 호출 실패:', restError);
          return { 
            success: false, 
            message: 'REST API 호출 실패', 
            details: restError instanceof Error ? restError.message : String(restError)
          };
        }
      }
      
      return { success: false, message: 'SQL 실행 실패', details: error };
    }
    
    console.log(`[${description}] SQL 실행 성공`);
    return { success: true, data };
  } catch (error) {
    console.error(`[${description}] SQL 실행 중 오류 발생:`, error);
    return { 
      success: false, 
      message: 'SQL 실행 중 오류 발생', 
      details: error instanceof Error ? error.message : String(error)
    };
  }
} 