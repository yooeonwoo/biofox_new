-- 데이터베이스 year_month 형식 통일 마이그레이션
-- YYYYMM 형식을 YYYY-MM 형식으로 변환

-- 백업 테이블 생성 (안전을 위해)
BEGIN;

-- 1. kol_dashboard_metrics 테이블 백업 및 변환
DO $$
BEGIN
  -- 백업 테이블이 존재하지 않으면 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kol_dashboard_metrics_backup') THEN
    CREATE TABLE kol_dashboard_metrics_backup AS SELECT * FROM kol_dashboard_metrics;
    RAISE NOTICE 'kol_dashboard_metrics 백업 완료';
  END IF;

  -- YYYYMM 형식을 YYYY-MM 형식으로 변환
  UPDATE kol_dashboard_metrics 
  SET year_month = 
    CASE 
      WHEN LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$' THEN
        SUBSTRING(year_month, 1, 4) || '-' || SUBSTRING(year_month, 5, 2)
      ELSE 
        year_month -- 이미 올바른 형식이면 그대로 유지
    END
  WHERE LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$';
  
  RAISE NOTICE 'kol_dashboard_metrics year_month 형식 변환 완료';
END $$;

-- 2. shop_sales_metrics 테이블 백업 및 변환
DO $$
BEGIN
  -- 백업 테이블이 존재하지 않으면 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shop_sales_metrics_backup') THEN
    CREATE TABLE shop_sales_metrics_backup AS SELECT * FROM shop_sales_metrics;
    RAISE NOTICE 'shop_sales_metrics 백업 완료';
  END IF;

  -- YYYYMM 형식을 YYYY-MM 형식으로 변환
  UPDATE shop_sales_metrics 
  SET year_month = 
    CASE 
      WHEN LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$' THEN
        SUBSTRING(year_month, 1, 4) || '-' || SUBSTRING(year_month, 5, 2)
      ELSE 
        year_month -- 이미 올바른 형식이면 그대로 유지
    END
  WHERE LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$';
  
  RAISE NOTICE 'shop_sales_metrics year_month 형식 변환 완료';
END $$;

-- 3. kol_total_monthly_sales 테이블 백업 및 변환 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kol_total_monthly_sales') THEN
    -- 백업 테이블이 존재하지 않으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kol_total_monthly_sales_backup') THEN
      CREATE TABLE kol_total_monthly_sales_backup AS SELECT * FROM kol_total_monthly_sales;
      RAISE NOTICE 'kol_total_monthly_sales 백업 완료';
    END IF;

    -- YYYYMM 형식을 YYYY-MM 형식으로 변환
    UPDATE kol_total_monthly_sales 
    SET year_month = 
      CASE 
        WHEN LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$' THEN
          SUBSTRING(year_month, 1, 4) || '-' || SUBSTRING(year_month, 5, 2)
        ELSE 
          year_month -- 이미 올바른 형식이면 그대로 유지
      END
    WHERE LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$';
    
    RAISE NOTICE 'kol_total_monthly_sales year_month 형식 변환 완료';
  END IF;
END $$;

-- 4. product_sales_metrics 테이블 백업 및 변환 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_sales_metrics') THEN
    -- 백업 테이블이 존재하지 않으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_sales_metrics_backup') THEN
      CREATE TABLE product_sales_metrics_backup AS SELECT * FROM product_sales_metrics;
      RAISE NOTICE 'product_sales_metrics 백업 완료';
    END IF;

    -- YYYYMM 형식을 YYYY-MM 형식으로 변환
    UPDATE product_sales_metrics 
    SET year_month = 
      CASE 
        WHEN LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$' THEN
          SUBSTRING(year_month, 1, 4) || '-' || SUBSTRING(year_month, 5, 2)
        ELSE 
          year_month -- 이미 올바른 형식이면 그대로 유지
      END
    WHERE LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$';
    
    RAISE NOTICE 'product_sales_metrics year_month 형식 변환 완료';
  END IF;
END $$;

-- 5. admin_dashboard_stats 테이블 백업 및 변환 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_dashboard_stats') THEN
    -- 백업 테이블이 존재하지 않으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_dashboard_stats_backup') THEN
      CREATE TABLE admin_dashboard_stats_backup AS SELECT * FROM admin_dashboard_stats;
      RAISE NOTICE 'admin_dashboard_stats 백업 완료';
    END IF;

    -- YYYYMM 형식을 YYYY-MM 형식으로 변환
    UPDATE admin_dashboard_stats 
    SET year_month = 
      CASE 
        WHEN LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$' THEN
          SUBSTRING(year_month, 1, 4) || '-' || SUBSTRING(year_month, 5, 2)
        ELSE 
          year_month -- 이미 올바른 형식이면 그대로 유지
      END
    WHERE LENGTH(year_month) = 6 AND year_month ~ '^\d{6}$';
    
    RAISE NOTICE 'admin_dashboard_stats year_month 형식 변환 완료';
  END IF;
END $$;

-- 6. 변환 결과 확인
DO $$
DECLARE
  table_name text;
  converted_count integer;
BEGIN
  FOR table_name IN VALUES ('kol_dashboard_metrics'), ('shop_sales_metrics'), ('kol_total_monthly_sales'), ('product_sales_metrics'), ('admin_dashboard_stats')
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE information_schema.tables.table_name = table_name) THEN
      EXECUTE format('SELECT COUNT(*) FROM %I WHERE year_month ~ ''^[0-9]{4}-[0-9]{2}$''', table_name) INTO converted_count;
      RAISE NOTICE '% 테이블: YYYY-MM 형식 레코드 수 = %', table_name, converted_count;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- 마이그레이션 완료 메시지
SELECT 'Year-Month 형식 마이그레이션이 완료되었습니다. 모든 year_month 필드가 YYYY-MM 형식으로 통일되었습니다.' AS message; 