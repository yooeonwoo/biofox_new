-- 전문점별 매출 요약 정보를 저장하는 테이블 생성
CREATE TABLE shop_sales_summary (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  kol_id INTEGER NOT NULL REFERENCES kols(id),
  current_month_sales INTEGER NOT NULL DEFAULT 0, -- 당월 매출
  avg_monthly_sales NUMERIC(14, 2) NOT NULL DEFAULT 0, -- 월평균 매출
  total_accumulated_sales INTEGER NOT NULL DEFAULT 0, -- 누적 매출
  last_updated_month VARCHAR NOT NULL, -- 마지막 업데이트된 년월 (YYYY-MM 형식)
  month_count INTEGER NOT NULL DEFAULT 1, -- 매출이 있는 개월 수
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_shop_sales_summary_shop_id ON shop_sales_summary (shop_id);
CREATE INDEX idx_shop_sales_summary_kol_id ON shop_sales_summary (kol_id);
CREATE INDEX idx_shop_sales_summary_last_updated_month ON shop_sales_summary (last_updated_month);

-- 월별 매출 데이터로부터 전문점별 매출 요약 정보를 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_shop_sales_summary()
RETURNS TRIGGER AS $$
DECLARE
  shop_record RECORD;
  total_sales INTEGER;
  months_with_sales INTEGER;
  avg_sales NUMERIC(14, 2);
  current_month VARCHAR;
BEGIN
  -- 매출이 업데이트된 년월 가져오기
  current_month := NEW.year_month;
  
  -- 해당 상점에 대한 요약 정보가 이미 있는지 확인
  SELECT * INTO shop_record 
  FROM shop_sales_summary 
  WHERE shop_id = NEW.shop_id AND kol_id = NEW.kol_id;
  
  -- 전체 누적 매출 계산
  SELECT COALESCE(SUM(total_sales), 0) INTO total_sales
  FROM monthly_sales
  WHERE shop_id = NEW.shop_id AND kol_id = NEW.kol_id;
  
  -- 매출이 있는 개월 수 계산
  SELECT COUNT(DISTINCT year_month) INTO months_with_sales
  FROM monthly_sales
  WHERE shop_id = NEW.shop_id AND kol_id = NEW.kol_id AND total_sales > 0;
  
  -- 월평균 매출 계산 (0으로 나누기 방지)
  IF months_with_sales > 0 THEN
    avg_sales := total_sales::NUMERIC / months_with_sales;
  ELSE
    avg_sales := 0;
  END IF;
  
  -- 요약 정보 업데이트 또는 삽입
  IF shop_record IS NOT NULL THEN
    UPDATE shop_sales_summary
    SET current_month_sales = NEW.total_sales,
        avg_monthly_sales = avg_sales,
        total_accumulated_sales = total_sales,
        last_updated_month = current_month,
        month_count = months_with_sales,
        updated_at = NOW()
    WHERE id = shop_record.id;
  ELSE
    INSERT INTO shop_sales_summary (
      shop_id, kol_id, current_month_sales, avg_monthly_sales, 
      total_accumulated_sales, last_updated_month, month_count
    ) VALUES (
      NEW.shop_id, NEW.kol_id, NEW.total_sales, avg_sales, 
      total_sales, current_month, months_with_sales
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- monthly_sales 테이블에 새로운 매출 데이터가 추가되거나 업데이트될 때 트리거 실행
CREATE TRIGGER monthly_sales_update_summary
AFTER INSERT OR UPDATE ON monthly_sales
FOR EACH ROW
EXECUTE FUNCTION update_shop_sales_summary();

-- 기존 데이터에 대한 요약 정보 초기화를 위한 함수
CREATE OR REPLACE FUNCTION initialize_shop_sales_summary()
RETURNS VOID AS $$
DECLARE
  shop_record RECORD;
BEGIN
  -- 모든 고유한 shop_id, kol_id 조합 순회
  FOR shop_record IN 
    SELECT DISTINCT shop_id, kol_id 
    FROM monthly_sales 
    WHERE shop_id IS NOT NULL AND kol_id IS NOT NULL
  LOOP
    -- 각 shop-kol 조합에 대해 요약 정보 업데이트 트리거 실행
    -- 최신 매출 데이터를 이용하여 업데이트
    PERFORM update_shop_sales_summary() 
    FROM monthly_sales 
    WHERE shop_id = shop_record.shop_id 
      AND kol_id = shop_record.kol_id 
    ORDER BY year_month DESC 
    LIMIT 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 기존 데이터의 요약 정보 초기화 실행
-- 주의: 이 함수는 처음 테이블 생성 후 한 번만 실행해야 합니다
-- SELECT initialize_shop_sales_summary(); 