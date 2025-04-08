import { serverSupabase as supabaseAdmin } from '@/lib/supabase';

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

/**
 * Supabase 저장 프로시저 생성 스크립트
 * 
 * 이 SQL 스크립트를 Supabase SQL 편집기에서 실행하여 필요한 저장 프로시저를 생성합니다.
 */

// 제품별 매출 비율 데이터를 제품 정보와 함께 조회하는 함수
const getProductSalesWithDetailsSQL = `
CREATE OR REPLACE FUNCTION get_product_sales_with_details(month_param text)
RETURNS TABLE (
  id int,
  year_month text,
  product_id int,
  total_sales_amount int,
  sales_ratio decimal,
  sales_growth_rate decimal,
  product_name text,
  product_category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pts.id,
    pts.year_month,
    pts.product_id,
    pts.total_sales_amount,
    pts.sales_ratio,
    pts.sales_growth_rate,
    p.name as product_name,
    p.category as product_category
  FROM 
    product_total_sales_stats pts
  INNER JOIN 
    products p ON pts.product_id = p.id
  WHERE 
    pts.year_month = month_param
  ORDER BY 
    pts.total_sales_amount DESC;
END;
$$ LANGUAGE plpgsql;
`;

/**
 * 저장 프로시저를 생성하는 함수
 * 
 * 이 함수는 스크립트를 직접 실행하지 않고 SQL 문을 반환합니다.
 * Supabase SQL 편집기에서 이 SQL을 실행하세요.
 */
export function generateStoredProcedures() {
  return [
    getProductSalesWithDetailsSQL,
    // 여기에 추가 저장 프로시저를 넣을 수 있습니다
  ].join('\n\n');
}

// 저장 프로시저 실행 경로를 제공하는 함수
export function suggestExecutionPath() {
  return {
    instructions: `
    다음 단계에 따라 저장 프로시저를 Supabase에 생성하세요:
    
    1. Supabase 대시보드에 로그인
    2. 왼쪽 메뉴에서 "SQL 편집기" 선택
    3. "New Query" 버튼 클릭
    4. 위의 SQL 코드를 복사하여 붙여넣기
    5. "Run" 버튼 클릭하여 저장 프로시저 생성
    6. "공개 액세스" 권한 부여 (API에서 호출할 수 있도록)
    `
  };
} 