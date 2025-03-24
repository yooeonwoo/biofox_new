-- 제품 카테고리별 매출 통계 조회 함수
-- 사용방법: SELECT * FROM get_product_category_stats('2023-01');
CREATE OR REPLACE FUNCTION get_product_category_stats(p_year_month VARCHAR)
RETURNS TABLE (
  category VARCHAR,
  total_sales_amount BIGINT,
  sales_ratio NUMERIC(5,4),
  product_count INTEGER,
  avg_growth_rate NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH category_stats AS (
    SELECT 
      COALESCE(p.category, '기타') AS category,
      SUM(pts.total_sales_amount) AS total_sales_amount,
      COUNT(DISTINCT pts.product_id) AS product_count,
      AVG(pts.sales_growth_rate) AS avg_growth_rate
    FROM 
      product_total_sales_stats pts
    JOIN 
      products p ON pts.product_id = p.id
    WHERE 
      pts.year_month = p_year_month
    GROUP BY 
      COALESCE(p.category, '기타')
  ),
  total_sales AS (
    SELECT SUM(total_sales_amount) AS total_amount
    FROM category_stats
  )
  SELECT 
    cs.category,
    cs.total_sales_amount,
    CASE 
      WHEN ts.total_amount > 0 THEN 
        ROUND((cs.total_sales_amount::numeric / ts.total_amount), 4)
      ELSE 0 
    END AS sales_ratio,
    cs.product_count,
    COALESCE(cs.avg_growth_rate, 0) AS avg_growth_rate
  FROM 
    category_stats cs,
    total_sales ts
  ORDER BY 
    cs.total_sales_amount DESC;
END;
$$ LANGUAGE plpgsql; 