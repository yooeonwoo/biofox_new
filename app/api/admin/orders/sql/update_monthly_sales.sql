-- 월별 매출 통계 업데이트 함수
-- 사용방법: SELECT * FROM update_monthly_sales(1, 2, '2023-01', 10000, 5000, 1500);
CREATE OR REPLACE FUNCTION update_monthly_sales(
  p_kol_id INTEGER,
  p_shop_id INTEGER,
  p_year_month VARCHAR,
  p_product_sales INTEGER,
  p_device_sales INTEGER,
  p_commission INTEGER
) RETURNS VOID AS $$
DECLARE
  v_total_sales INTEGER;
BEGIN
  -- 총 매출 계산
  v_total_sales := p_product_sales + p_device_sales;
  
  -- 월별 매출 테이블 업데이트 (없으면 insert, 있으면 update)
  INSERT INTO monthly_sales (
    kol_id,
    shop_id,
    year_month,
    product_sales,
    device_sales,
    total_sales,
    commission,
    created_at,
    updated_at
  ) VALUES (
    p_kol_id,
    p_shop_id,
    p_year_month,
    p_product_sales,
    p_device_sales,
    v_total_sales,
    p_commission,
    NOW(),
    NOW()
  )
  ON CONFLICT (kol_id, shop_id, year_month) DO UPDATE SET
    product_sales = monthly_sales.product_sales + p_product_sales,
    device_sales = monthly_sales.device_sales + p_device_sales,
    total_sales = monthly_sales.total_sales + v_total_sales,
    commission = monthly_sales.commission + p_commission,
    updated_at = NOW();
    
  -- KOL 전체 월별 매출 합계 테이블 업데이트 (없으면 insert, 있으면 update)
  INSERT INTO kol_total_monthly_sales (
    kol_id,
    year_month,
    total_sales,
    product_sales,
    device_sales,
    total_commission,
    created_at,
    updated_at
  ) VALUES (
    p_kol_id,
    p_year_month,
    v_total_sales,
    p_product_sales,
    p_device_sales,
    p_commission,
    NOW(),
    NOW()
  )
  ON CONFLICT (kol_id, year_month) DO UPDATE SET
    total_sales = kol_total_monthly_sales.total_sales + v_total_sales,
    product_sales = kol_total_monthly_sales.product_sales + p_product_sales,
    device_sales = kol_total_monthly_sales.device_sales + p_device_sales,
    total_commission = kol_total_monthly_sales.total_commission + p_commission,
    updated_at = NOW();
    
  -- 관리자 대시보드 통계 테이블 업데이트 (없으면 insert, 있으면 update)
  INSERT INTO admin_dashboard_stats (
    year_month,
    total_sales,
    product_sales,
    device_sales,
    total_commission,
    created_at,
    updated_at
  ) VALUES (
    p_year_month,
    v_total_sales,
    p_product_sales,
    p_device_sales,
    p_commission,
    NOW(),
    NOW()
  )
  ON CONFLICT (year_month) DO UPDATE SET
    total_sales = admin_dashboard_stats.total_sales + v_total_sales,
    product_sales = admin_dashboard_stats.product_sales + p_product_sales,
    device_sales = admin_dashboard_stats.device_sales + p_device_sales,
    total_commission = admin_dashboard_stats.total_commission + p_commission,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql; 