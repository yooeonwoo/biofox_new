-- 1. 전문점별 매출 요약 정보 조회 API를 위한 SQL 쿼리 예제
SELECT 
  s.id AS shop_id,
  s.shop_name,
  s.owner_name,
  s.region,
  s.status,
  s.created_at,
  s.is_owner_kol,
  COALESCE(summary.current_month_sales, 0) AS total_sales,
  COALESCE(summary.avg_monthly_sales, 0) AS avg_monthly_sales,
  COALESCE(summary.total_accumulated_sales, 0) AS accumulated_sales,
  COALESCE(ms.product_sales, 0) AS product_sales,
  COALESCE(ms.device_sales, 0) AS device_sales,
  CASE WHEN ms.id IS NOT NULL THEN true ELSE false END AS has_ordered
FROM 
  shops s
LEFT JOIN 
  shop_sales_summary summary ON s.id = summary.shop_id
LEFT JOIN 
  monthly_sales ms ON s.id = ms.shop_id AND ms.year_month = '2023-04'
WHERE 
  s.kol_id = 1;  -- KOL ID는 실제 사용자 ID로 대체

-- 2. 현재 API 응답 구조에 맞게 가공하는 예제
SELECT json_build_object(
  'id', s.id,
  'shop_name', s.shop_name,
  'ownerName', s.owner_name,
  'region', s.region,
  'status', s.status,
  'createdAt', s.created_at,
  'is_owner_kol', s.is_owner_kol,
  'sales', json_build_object(
    'total', COALESCE(summary.current_month_sales, 0),
    'product', COALESCE(ms.product_sales, 0),
    'device', COALESCE(ms.device_sales, 0),
    'hasOrdered', CASE WHEN ms.id IS NOT NULL THEN true ELSE false END,
    'avg_monthly', COALESCE(summary.avg_monthly_sales, 0),
    'accumulated', COALESCE(summary.total_accumulated_sales, 0)
  )
) AS shop_data
FROM 
  shops s
LEFT JOIN 
  shop_sales_summary summary ON s.id = summary.shop_id
LEFT JOIN 
  monthly_sales ms ON s.id = ms.shop_id AND ms.year_month = '2023-04'
WHERE 
  s.kol_id = 1;  -- KOL ID는 실제 사용자 ID로 대체

-- 3. 상위 5개 전문점 데이터 조회 예제 (당월 매출 기준)
SELECT 
  s.shop_name AS name,
  COALESCE(summary.current_month_sales, 0) AS "매출"
FROM 
  shops s
LEFT JOIN 
  shop_sales_summary summary ON s.id = summary.shop_id
WHERE 
  s.kol_id = 1
ORDER BY 
  COALESCE(summary.current_month_sales, 0) DESC
LIMIT 5;

-- 4. 상위 5개 전문점 데이터 조회 예제 (월평균 매출 기준)
SELECT 
  s.shop_name AS name,
  COALESCE(summary.avg_monthly_sales, 0) AS "매출"
FROM 
  shops s
LEFT JOIN 
  shop_sales_summary summary ON s.id = summary.shop_id
WHERE 
  s.kol_id = 1
ORDER BY 
  COALESCE(summary.avg_monthly_sales, 0) DESC
LIMIT 5;

-- 5. 상위 5개 전문점 데이터 조회 예제 (누적 매출 기준)
SELECT 
  s.shop_name AS name,
  COALESCE(summary.total_accumulated_sales, 0) AS "매출"
FROM 
  shops s
LEFT JOIN 
  shop_sales_summary summary ON s.id = summary.shop_id
WHERE 
  s.kol_id = 1
ORDER BY 
  COALESCE(summary.total_accumulated_sales, 0) DESC
LIMIT 5; 