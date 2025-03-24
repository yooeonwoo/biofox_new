-- KOL의 제품별 매출 데이터 조회 함수
-- 사용방법: SELECT * FROM get_kol_product_sales(1, '2023-01');
CREATE OR REPLACE FUNCTION get_kol_product_sales(p_kol_id INTEGER, p_year_month VARCHAR)
RETURNS TABLE (
  id INTEGER,
  kol_id INTEGER,
  year_month VARCHAR,
  product_id INTEGER,
  sales_amount INTEGER,
  sales_ratio NUMERIC(5,4),
  product_name VARCHAR,
  product_category VARCHAR,
  is_device BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psr.id,
    psr.kol_id,
    psr.year_month,
    psr.product_id,
    psr.sales_amount,
    psr.sales_ratio,
    p.name AS product_name,
    p.category AS product_category,
    p.is_device
  FROM 
    product_sales_ratios psr
  JOIN 
    products p ON psr.product_id = p.id
  WHERE 
    psr.kol_id = p_kol_id
    AND psr.year_month = p_year_month
  ORDER BY 
    psr.sales_ratio DESC;
END;
$$ LANGUAGE plpgsql; 