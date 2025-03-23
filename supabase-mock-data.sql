-- 기본 데이터 삽입
-- 1. 사용자(KOL) 데이터
INSERT INTO users (clerk_id, email, name, role, created_at, updated_at)
VALUES
  ('user_2Rkl4XEKmTVHl4OyHj8nPxzPgPB', 'kol1@example.com', 'KOL 1', 'kol', NOW(), NOW()),
  ('user_3Tmn5YFLnUWIm5PzIk9oPxzPgQC', 'kol2@example.com', 'KOL 2', 'kol', NOW(), NOW()),
  ('user_4Uop6ZGMoVXJn6QAJl0pQxzPgRD', 'kol3@example.com', 'KOL 3', 'kol', NOW(), NOW()),
  ('user_5Vpq7aHNpWYKo7RBKm1qRxzPgSE', 'admin@example.com', '관리자', '본사관리자', NOW(), NOW())
ON CONFLICT (clerk_id) DO NOTHING;

-- 2. KOL 데이터
INSERT INTO kols (user_id, name, shop_name, region, status, created_at, updated_at)
VALUES
  (1, 'KOL 1', 'KOL 1의 샵', '서울', 'active', NOW(), NOW()),
  (2, 'KOL 2', 'KOL 2의 샵', '부산', 'active', NOW(), NOW()),
  (3, 'KOL 3', 'KOL 3의 샵', '대구', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 전문점 데이터
INSERT INTO shops (kol_id, owner_name, region, status, created_at, updated_at)
VALUES
  (1, '전문점A 점주', '서울 강남', 'active', NOW(), NOW()),
  (1, '전문점B 점주', '서울 서초', 'active', NOW(), NOW()),
  (1, '전문점C 점주', '서울 송파', 'active', NOW(), NOW()),
  (2, '전문점D 점주', '부산 해운대', 'active', NOW(), NOW()),
  (2, '전문점E 점주', '부산 남구', 'active', NOW(), NOW()),
  (3, '전문점F 점주', '대구 중구', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. 제품 데이터
INSERT INTO products (name, price, is_device, category, status, created_at, updated_at)
VALUES
  ('큐어부스터', 74800, false, '미스트', 'active', NOW(), NOW()),
  ('올인원세럼', 77000, false, '세럼', 'active', NOW(), NOW()),
  ('V앰플', 220000, false, '앰플', 'active', NOW(), NOW()),
  ('퓨어솔루션', 418000, true, '앰플', 'active', NOW(), NOW()),
  ('마이크로젯 부스터', 149000, true, '에어젯', 'active', NOW(), NOW()),
  ('큐어 페이셜 마스크', 33000, false, '마스크팩', 'active', NOW(), NOW()),
  ('프리미엄 마스크', 66000, false, '마스크팩', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 주문 데이터 삽입
-- 5. 주문 데이터
-- 현재 월과 이전 월에 대한 주문 생성
DO $$
DECLARE
  current_month VARCHAR := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  prev_month VARCHAR := TO_CHAR((CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM');
  shop_ids INT[] := ARRAY[1, 2, 3, 4, 5, 6];
  shop_id INT;
  order_id INT;
  current_date DATE := CURRENT_DATE;
  prev_date DATE := (CURRENT_DATE - INTERVAL '1 month');
BEGIN
  -- 각 전문점별 주문 생성
  FOREACH shop_id IN ARRAY shop_ids
  LOOP
    -- 현재 월 주문 (2개씩)
    FOR i IN 1..2 LOOP
      -- 주문 생성
      INSERT INTO orders (order_number, shop_id, total_amount, status, order_date, payment_method, payment_status, created_at, updated_at)
      VALUES (
        'ORD-' || current_month || '-' || shop_id || '-' || i,
        shop_id,
        0, -- 나중에 업데이트
        'completed',
        current_date - (i * INTERVAL '1 day'),
        'card',
        'completed',
        current_date - (i * INTERVAL '1 day'),
        current_date - (i * INTERVAL '1 day')
      )
      RETURNING id INTO order_id;
      
      -- 주문 상세 추가 (2-3개 랜덤 제품)
      FOR j IN 1..FLOOR(RANDOM() * 2 + 2)::INT LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at)
        VALUES (
          order_id,
          FLOOR(RANDOM() * 5 + 1)::INT, -- 1-5 제품 중 랜덤
          FLOOR(RANDOM() * 3 + 1)::INT, -- 1-3개 랜덤 수량
          (ARRAY[50000, 70000, 120000, 500000, 700000])[FLOOR(RANDOM() * 5 + 1)::INT], -- 제품 가격
          current_date - (i * INTERVAL '1 day'),
          current_date - (i * INTERVAL '1 day')
        );
      END LOOP;
    END LOOP;
    
    -- 이전 월 주문 (1개씩)
    INSERT INTO orders (order_number, shop_id, total_amount, status, order_date, payment_method, payment_status, created_at, updated_at)
    VALUES (
      'ORD-' || prev_month || '-' || shop_id,
      shop_id,
      0, -- 나중에 업데이트
      'completed',
      prev_date - (FLOOR(RANDOM() * 15)::INT * INTERVAL '1 day'),
      'card',
      'completed',
      prev_date,
      prev_date
    )
    RETURNING id INTO order_id;
    
    -- 주문 상세 추가 (1-3개 랜덤 제품)
    FOR j IN 1..FLOOR(RANDOM() * 3 + 1)::INT LOOP
      INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at)
      VALUES (
        order_id,
        FLOOR(RANDOM() * 5 + 1)::INT, -- 1-5 제품 중 랜덤
        FLOOR(RANDOM() * 3 + 1)::INT, -- 1-3개 랜덤 수량
        (ARRAY[50000, 70000, 120000, 500000, 700000])[FLOOR(RANDOM() * 5 + 1)::INT], -- 제품 가격
        prev_date,
        prev_date
      );
    END LOOP;
  END LOOP;
  
  -- 주문 총액 업데이트
  UPDATE orders o
  SET total_amount = (
    SELECT SUM(quantity * price)
    FROM order_items
    WHERE order_id = o.id
  )
  WHERE total_amount = 0;
END $$;

-- 수당 데이터 생성
INSERT INTO commissions (kol_id, order_id, amount, settled, created_at, updated_at)
SELECT 
  s.kol_id,
  o.id,
  FLOOR(o.total_amount * 0.1), -- 매출의 10%를 수당으로 책정
  CASE WHEN RANDOM() > 0.3 THEN true ELSE false END, -- 70% 확률로 정산 완료
  o.created_at,
  o.updated_at
FROM orders o
JOIN shops s ON o.shop_id = s.id
ON CONFLICT DO NOTHING;

-- 수당 정산된 항목 정산일 추가
UPDATE commissions
SET settled_date = created_at + INTERVAL '5 days',
    settled_note = '자동 정산 처리'
WHERE settled = true;

-- 월별 집계 데이터 생성
-- 월별 매출 집계
INSERT INTO monthly_sales (kol_id, shop_id, year_month, product_sales, device_sales, total_sales, commission, created_at, updated_at)
SELECT 
  s.kol_id,
  o.shop_id,
  TO_CHAR(o.order_date, 'YYYY-MM'),
  SUM(CASE WHEN p.is_device = false THEN oi.quantity * oi.price ELSE 0 END),
  SUM(CASE WHEN p.is_device = true THEN oi.quantity * oi.price ELSE 0 END),
  SUM(oi.quantity * oi.price),
  SUM(FLOOR((oi.quantity * oi.price) * 0.1)),
  NOW(),
  NOW()
FROM orders o
JOIN shops s ON o.shop_id = s.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
GROUP BY s.kol_id, o.shop_id, TO_CHAR(o.order_date, 'YYYY-MM')
ON CONFLICT DO NOTHING;

-- 제품별 매출 비율 계산
INSERT INTO product_sales_ratios (shop_id, kol_id, year_month, product_id, sales_amount, sales_ratio, created_at, updated_at)
WITH shop_monthly_sales AS (
  SELECT 
    o.shop_id,
    s.kol_id,
    TO_CHAR(o.order_date, 'YYYY-MM') as year_month,
    SUM(oi.quantity * oi.price) as total_amount
  FROM orders o
  JOIN shops s ON o.shop_id = s.id
  JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.shop_id, s.kol_id, TO_CHAR(o.order_date, 'YYYY-MM')
),
product_sales AS (
  SELECT 
    o.shop_id,
    s.kol_id,
    TO_CHAR(o.order_date, 'YYYY-MM') as year_month,
    oi.product_id,
    SUM(oi.quantity * oi.price) as product_amount
  FROM orders o
  JOIN shops s ON o.shop_id = s.id
  JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.shop_id, s.kol_id, TO_CHAR(o.order_date, 'YYYY-MM'), oi.product_id
)
SELECT 
  ps.shop_id,
  ps.kol_id,
  ps.year_month,
  ps.product_id,
  ps.product_amount,
  CAST(CASE WHEN sms.total_amount > 0 THEN ps.product_amount::decimal / sms.total_amount ELSE 0 END AS DECIMAL(5,4)),
  NOW(),
  NOW()
FROM product_sales ps
JOIN shop_monthly_sales sms ON ps.shop_id = sms.shop_id AND ps.year_month = sms.year_month
ON CONFLICT DO NOTHING;

-- KOL 월별 요약 데이터 생성
INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
WITH current_month_data AS (
  SELECT 
    ms.kol_id,
    ms.year_month,
    SUM(ms.total_sales) as total_sales,
    SUM(ms.commission) as total_commission,
    COUNT(DISTINCT ms.shop_id) as active_shops
  FROM monthly_sales ms
  GROUP BY ms.kol_id, ms.year_month
),
prev_month_data AS (
  SELECT 
    kol_id,
    TO_CHAR(TO_DATE(year_month, 'YYYY-MM') + INTERVAL '1 month', 'YYYY-MM') as next_month,
    SUM(total_sales) as total_sales,
    SUM(commission) as total_commission
  FROM monthly_sales
  GROUP BY kol_id, year_month
),
avg_3month_sales AS (
  SELECT 
    kol_id,
    year_month,
    AVG(total_sales) OVER (PARTITION BY kol_id ORDER BY year_month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as avg_sales
  FROM (
    SELECT kol_id, year_month, SUM(total_sales) as total_sales
    FROM monthly_sales
    GROUP BY kol_id, year_month
  ) t
),
cumulative_comm AS (
  SELECT 
    kol_id,
    year_month,
    SUM(commission) OVER (PARTITION BY kol_id ORDER BY year_month ROWS UNBOUNDED PRECEDING) as cum_commission
  FROM (
    SELECT kol_id, year_month, SUM(commission) as commission
    FROM monthly_sales
    GROUP BY kol_id, year_month
  ) t
),
total_shops_count AS (
  SELECT kol_id, COUNT(*) as total_shops FROM shops GROUP BY kol_id
)
SELECT 
  cmd.kol_id,
  cmd.year_month,
  cmd.total_sales,
  cmd.total_commission,
  COALESCE(a3s.avg_sales, 0),
  COALESCE(cc.cum_commission, 0),
  COALESCE(pmd.total_sales, 0),
  COALESCE(pmd.total_commission, 0),
  cmd.active_shops,
  tsc.total_shops,
  NOW(),
  NOW()
FROM current_month_data cmd
LEFT JOIN prev_month_data pmd ON cmd.kol_id = pmd.kol_id AND cmd.year_month = pmd.next_month
LEFT JOIN avg_3month_sales a3s ON cmd.kol_id = a3s.kol_id AND cmd.year_month = a3s.year_month
LEFT JOIN cumulative_comm cc ON cmd.kol_id = cc.kol_id AND cmd.year_month = cc.year_month
LEFT JOIN total_shops_count tsc ON cmd.kol_id = tsc.kol_id
ON CONFLICT DO NOTHING; 