/**
 * Supabase RPC 함수 설정 스크립트
 * 
 * 이 스크립트는 Supabase에 RPC 함수를 설정하는 SQL 코드를 생성합니다.
 * SQL 코드를 생성한 후 Supabase SQL 편집기에서 실행하세요.
 */

// SQL 코드 생성 함수
function generateSQLScript() {
  return `
-- 제품별 매출 비율 데이터를 제품 정보와 함께 조회하는 함수
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

-- 일반 SQL 쿼리 실행을 위한 함수
CREATE OR REPLACE FUNCTION execute_sql(query_text text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format(
    'SELECT jsonb_agg(t) FROM (%s) t',
    query_text
  ) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 함수에 대한 접근 권한 설정
GRANT EXECUTE ON FUNCTION get_product_sales_with_details(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION execute_sql(text, jsonb) TO service_role;
  `;
}

// 스크립트 실행 시 SQL 출력
if (require.main === module) {
  console.log(generateSQLScript());
  console.log(`
============================================================
  Supabase RPC 함수 설정 방법
============================================================

1. Supabase 대시보드에 로그인하세요.
2. 왼쪽 메뉴에서 "SQL 편집기"를 클릭하세요.
3. "새 쿼리" 버튼을 클릭하세요.
4. 위의 SQL 코드를 복사하여 붙여넣으세요.
5. "실행" 버튼을 클릭하여 RPC 함수를 생성하세요.
6. 함수가 성공적으로 생성되었는지 확인하세요.

참고: execute_sql 함수는 보안상의 이유로 service_role에만 접근 권한을 부여했습니다.
      API 라우트에서는 serverSupabase(service_role) 클라이언트를 사용하세요.
  `);
}

module.exports = {
  generateSQLScript
}; 