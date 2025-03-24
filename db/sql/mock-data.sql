-- 제품 데이터 목업
INSERT INTO products (name, price, is_device, description, category, status)
VALUES
  ('바이오폭스 레이저', 1500000, true, '고급 레이저 치료기기', '기기', 'active'),
  ('바이오폭스 LED', 980000, true, 'LED 치료 기기', '기기', 'active'),
  ('스케일러', 550000, true, '치아 스케일링 장비', '기기', 'active'),
  ('치료용 젤', 45000, false, '치료용 젤', '소모품', 'active'),
  ('클리닝 킷', 25000, false, '구강 클리닝 제품 세트', '소모품', 'active'),
  ('구강 관리 키트', 35000, false, '구강 관리 제품 세트', '소모품', 'active'),
  ('마우스가드', 15000, false, '치아 보호용 가드', '소모품', 'active')
ON CONFLICT (id) DO NOTHING;

-- 제품별 매출 비율 데이터 목업
INSERT INTO product_sales_ratios (shop_id, kol_id, year_month, product_id, total_sales_amount, sales_ratio, sales_growth_rate)
VALUES
  (1, 1, '2025-03', 1, 4500000, '0.35', '0.05'),
  (1, 1, '2025-03', 2, 2940000, '0.23', '0.03'),
  (1, 1, '2025-03', 3, 1650000, '0.13', '0.02'),
  (1, 1, '2025-03', 4, 1350000, '0.11', '0.01'),
  (1, 1, '2025-03', 5, 1000000, '0.08', '0.01'),
  (1, 1, '2025-03', 6, 700000, '0.06', '0.00'),
  (1, 1, '2025-03', 7, 500000, '0.04', '0.00')
ON CONFLICT (shop_id, kol_id, year_month, product_id) DO UPDATE SET
  total_sales_amount = EXCLUDED.total_sales_amount,
  sales_ratio = EXCLUDED.sales_ratio,
  sales_growth_rate = EXCLUDED.sales_growth_rate;

-- 전문점 데이터 목업
INSERT INTO shops (kol_id, owner_name, region, smart_place_link, status)
VALUES
  (1, '김원장', '서울', 'https://smartplace.naver.com/example1', 'active'),
  (1, '이원장', '부산', 'https://smartplace.naver.com/example2', 'active'),
  (2, '박원장', '대구', 'https://smartplace.naver.com/example3', 'active'),
  (2, '최원장', '인천', 'https://smartplace.naver.com/example4', 'active'),
  (3, '정원장', '광주', 'https://smartplace.naver.com/example5', 'active')
ON CONFLICT (id) DO NOTHING;

-- 월별 매출 데이터 목업
INSERT INTO monthly_sales (kol_id, shop_id, year_month, total_amount, commission_amount, shop_count, order_count)
VALUES
  (1, 1, '2025-03', 6500000, 650000, 2, 10),
  (1, 2, '2025-03', 5800000, 580000, 1, 8),
  (2, 3, '2025-03', 4300000, 430000, 1, 6),
  (2, 4, '2025-03', 3700000, 370000, 1, 5),
  (3, 5, '2025-03', 2900000, 290000, 1, 4)
ON CONFLICT (kol_id, shop_id, year_month) DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  commission_amount = EXCLUDED.commission_amount,
  shop_count = EXCLUDED.shop_count,
  order_count = EXCLUDED.order_count;

-- KOL 총 월별 매출 데이터 목업
INSERT INTO kol_total_monthly_sales (kol_id, year_month, total_amount, commission_amount, shop_count, kol_count, order_count)
VALUES
  (1, '2025-03', 12300000, 1230000, 2, 1, 18),
  (2, '2025-03', 8000000, 800000, 2, 1, 11),
  (3, '2025-03', 2900000, 290000, 1, 1, 4)
ON CONFLICT (kol_id, year_month) DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  commission_amount = EXCLUDED.commission_amount,
  shop_count = EXCLUDED.shop_count,
  kol_count = EXCLUDED.kol_count,
  order_count = EXCLUDED.order_count;

-- 관리자 대시보드 통계 데이터 목업
INSERT INTO admin_dashboard_stats (year_month, total_sales, total_commission, total_shops, total_kols, total_orders, growth_rate)
VALUES
  ('2025-03', 23200000, 2320000, 5, 3, 33, '0.08'),
  ('2025-02', 21500000, 2150000, 5, 3, 31, '0.07'),
  ('2025-01', 20100000, 2010000, 5, 3, 29, '0.06'),
  ('2024-12', 19000000, 1900000, 5, 3, 27, '0.05'),
  ('2024-11', 18100000, 1810000, 5, 3, 26, '0.04'),
  ('2024-10', 17400000, 1740000, 5, 3, 25, '0.03')
ON CONFLICT (year_month) DO UPDATE SET
  total_sales = EXCLUDED.total_sales,
  total_commission = EXCLUDED.total_commission,
  total_shops = EXCLUDED.total_shops,
  total_kols = EXCLUDED.total_kols,
  total_orders = EXCLUDED.total_orders,
  growth_rate = EXCLUDED.growth_rate;

-- 제품 총 매출 통계 데이터 목업
INSERT INTO product_total_sales_stats (product_id, year_month, total_sales_amount, sales_ratio, sales_growth_rate, order_count)
  SELECT
    p.id,
    '2025-03',
    CASE 
      WHEN p.name = '바이오폭스 레이저' THEN 9000000
      WHEN p.name = '바이오폭스 LED' THEN 5880000
      WHEN p.name = '스케일러' THEN 3300000
      WHEN p.name = '치료용 젤' THEN 2700000
      WHEN p.name = '클리닝 킷' THEN 1250000
      WHEN p.name = '구강 관리 키트' THEN 700000
      WHEN p.name = '마우스가드' THEN 375000
      ELSE 300000  -- 기본값 추가
    END,
    CASE 
      WHEN p.name = '바이오폭스 레이저' THEN '0.39'
      WHEN p.name = '바이오폭스 LED' THEN '0.25'
      WHEN p.name = '스케일러' THEN '0.14'
      WHEN p.name = '치료용 젤' THEN '0.12'
      WHEN p.name = '클리닝 킷' THEN '0.06'
      WHEN p.name = '구강 관리 키트' THEN '0.03'
      WHEN p.name = '마우스가드' THEN '0.01'
      ELSE '0.01'  -- 기본값 추가
    END,
    CASE 
      WHEN p.name = '바이오폭스 레이저' THEN '0.05'
      WHEN p.name = '바이오폭스 LED' THEN '0.04'
      WHEN p.name = '스케일러' THEN '0.03'
      WHEN p.name = '치료용 젤' THEN '0.02'
      WHEN p.name = '클리닝 킷' THEN '0.01'
      WHEN p.name = '구강 관리 키트' THEN '0.00'
      WHEN p.name = '마우스가드' THEN '0.00'
      ELSE '0.00'  -- 기본값 추가
    END,
    CASE 
      WHEN p.name = '바이오폭스 레이저' THEN 6
      WHEN p.name = '바이오폭스 LED' THEN 6
      WHEN p.name = '스케일러' THEN 6
      WHEN p.name = '치료용 젤' THEN 60
      WHEN p.name = '클리닝 킷' THEN 50
      WHEN p.name = '구강 관리 키트' THEN 20
      WHEN p.name = '마우스가드' THEN 25
      ELSE 10  -- 기본값 추가
    END
  FROM products p
  ON CONFLICT (product_id, year_month) DO UPDATE SET
    total_sales_amount = EXCLUDED.total_sales_amount,
    sales_ratio = EXCLUDED.sales_ratio,
    sales_growth_rate = EXCLUDED.sales_growth_rate,
    order_count = EXCLUDED.order_count; 