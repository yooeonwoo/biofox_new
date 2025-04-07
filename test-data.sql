-- KOL 대시보드 테스트 데이터 생성 스크립트

-- 현재 로그인한 사용자의 Clerk ID 변수 설정
DO $$
DECLARE
  v_clerk_id TEXT := 'user_2vOMBlx3BzR7CK6Vw3N74q0t8CT'; -- 여기에 실제 로그인한 사용자의 Clerk ID를 입력하세요
  v_user_id INTEGER;
  v_kol_id INTEGER;
  v_current_date DATE := CURRENT_DATE;
  v_current_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_previous_month TEXT := TO_CHAR((CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM');
BEGIN
  -- 사용자 ID 가져오기
  SELECT id INTO v_user_id FROM users WHERE clerk_id = v_clerk_id;
  
  -- 사용자가 존재하지 않는 경우에만 새로 추가
  IF v_user_id IS NULL THEN
    INSERT INTO users (clerk_id, email, role, name, created_at, updated_at)
    VALUES (
      v_clerk_id, 
      'kol-test@biofox.kr', 
      'kol', 
      '테스트 KOL', 
      NOW(), 
      NOW()
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  -- 사용자 ID가 확인된 경우에만 진행
  IF v_user_id IS NOT NULL THEN
    -- KOL 정보 추가 (없는 경우)
    INSERT INTO kols (user_id, name, shop_name, region, status, created_at, updated_at)
    SELECT 
      v_user_id, 
      '김바이오', 
      '아바에 대구', 
      '대구', 
      'active', 
      NOW(), 
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM kols WHERE user_id = v_user_id
    )
    RETURNING id INTO v_kol_id;
    
    -- 이미 KOL 정보가 있는 경우 ID 가져오기
    IF v_kol_id IS NULL THEN
      SELECT id INTO v_kol_id FROM kols WHERE user_id = v_user_id;
    END IF;
    
    -- 전문점 데이터 추가 (7개)
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '장미영', v_kol_id, 'active', '대구 수성구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '장미영' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '이수진', v_kol_id, 'active', '대구 중구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '이수진' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '박지영', v_kol_id, 'active', '대구 북구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '박지영' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '최은희', v_kol_id, 'active', '대구 동구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '최은희' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '김현정', v_kol_id, 'active', '대구 달서구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '김현정' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '정혜원', v_kol_id, 'active', '대구 남구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '정혜원' AND kol_id = v_kol_id);
    
    INSERT INTO shops (owner_name, kol_id, status, region, created_at, updated_at)
    SELECT '황미란', v_kol_id, 'active', '대구 서구', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM shops WHERE owner_name = '황미란' AND kol_id = v_kol_id);
    
    -- 월별 매출 요약 데이터 추가
    -- 현재 월
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      v_current_month, 
      4004, -- 당월 매출 (만원)
      2100, -- 당월 수당 (만원)
      3500, -- 평균 월 매출 (만원)
      15000, -- 누적 수당 (만원)
      2052, -- 이전 월 매출 (만원)
      1115, -- 이전 월 수당 (만원)
      4, -- 활성 전문점 수
      7, -- 전체 전문점 수
      NOW(), 
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = v_current_month
    );
    
    -- 이전 월
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      v_previous_month, 
      2052, -- 당월 매출 (만원)
      1115, -- 당월 수당 (만원)
      3000, -- 평균 월 매출 (만원)
      12900, -- 누적 수당 (만원)
      2300, -- 이전 월 매출 (만원)
      1200, -- 이전 월 수당 (만원)
      3, -- 활성 전문점 수
      7, -- 전체 전문점 수
      NOW(), 
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = v_previous_month
    );
    
    -- 2개월 전 ~ 6개월 전 데이터 추가 (차트용)
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      TO_CHAR((CURRENT_DATE - INTERVAL '2 month'), 'YYYY-MM'), 
      2300, 1200, 3000, 11700, 2000, 1000, 3, 6, NOW(), NOW() 
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = TO_CHAR((CURRENT_DATE - INTERVAL '2 month'), 'YYYY-MM')
    );
    
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      TO_CHAR((CURRENT_DATE - INTERVAL '3 month'), 'YYYY-MM'), 
      2000, 1000, 2800, 10500, 1800, 900, 3, 6, NOW(), NOW() 
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = TO_CHAR((CURRENT_DATE - INTERVAL '3 month'), 'YYYY-MM')
    );
    
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      TO_CHAR((CURRENT_DATE - INTERVAL '4 month'), 'YYYY-MM'), 
      1800, 900, 2500, 9500, 1500, 750, 2, 5, NOW(), NOW() 
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = TO_CHAR((CURRENT_DATE - INTERVAL '4 month'), 'YYYY-MM')
    );
    
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      TO_CHAR((CURRENT_DATE - INTERVAL '5 month'), 'YYYY-MM'), 
      1500, 750, 2200, 8600, 1200, 600, 2, 4, NOW(), NOW() 
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = TO_CHAR((CURRENT_DATE - INTERVAL '5 month'), 'YYYY-MM')
    );
    
    INSERT INTO kol_monthly_summary (kol_id, year_month, monthly_sales, monthly_commission, avg_monthly_sales, cumulative_commission, previous_month_sales, previous_month_commission, active_shops_count, total_shops_count, created_at, updated_at)
    SELECT 
      v_kol_id, 
      TO_CHAR((CURRENT_DATE - INTERVAL '6 month'), 'YYYY-MM'), 
      1200, 600, 2000, 7850, 1000, 500, 2, 3, NOW(), NOW() 
    WHERE NOT EXISTS (
      SELECT 1 FROM kol_monthly_summary WHERE kol_id = v_kol_id AND year_month = TO_CHAR((CURRENT_DATE - INTERVAL '6 month'), 'YYYY-MM')
    );
    
    -- 월별 매출 데이터 추가 (전문점별)
    -- 현재 월 데이터
    INSERT INTO monthly_sales (kol_id, shop_id, year_month, product_sales, device_sales, total_sales, commission, created_at, updated_at)
    SELECT 
      v_kol_id,
      s.id,
      v_current_month,
      CASE 
        WHEN s.owner_name = '장미영' THEN 1204
        WHEN s.owner_name = '이수진' THEN 980
        WHEN s.owner_name = '박지영' THEN 892
        WHEN s.owner_name = '최은희' THEN 928
        ELSE 0
      END,
      CASE 
        WHEN s.owner_name = '장미영' THEN 0
        WHEN s.owner_name = '이수진' THEN 0
        WHEN s.owner_name = '박지영' THEN 0
        WHEN s.owner_name = '최은희' THEN 0
        ELSE 0
      END,
      CASE 
        WHEN s.owner_name = '장미영' THEN 1204
        WHEN s.owner_name = '이수진' THEN 980
        WHEN s.owner_name = '박지영' THEN 892
        WHEN s.owner_name = '최은희' THEN 928
        ELSE 0
      END,
      CASE 
        WHEN s.owner_name = '장미영' THEN 602
        WHEN s.owner_name = '이수진' THEN 490
        WHEN s.owner_name = '박지영' THEN 446
        WHEN s.owner_name = '최은희' THEN 464
        ELSE 0
      END,
      NOW(),
      NOW()
    FROM shops s
    WHERE s.kol_id = v_kol_id AND s.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM monthly_sales ms WHERE ms.kol_id = v_kol_id AND ms.shop_id = s.id AND ms.year_month = v_current_month
    );
    
    -- 태스크/알림 데이터 추가
    INSERT INTO notifications (user_id, title, content, read, created_at, updated_at)
    SELECT 
      v_user_id,
      '아바에 수성구 세미나',
      '7월 15일 오후 2시 ~ 4시, 참가자 12명 예상',
      false,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = v_user_id AND title = '아바에 수성구 세미나'
    );
    
    INSERT INTO notifications (user_id, title, content, read, created_at, updated_at)
    SELECT 
      v_user_id,
      '아바에 중구 방문',
      '7월 18일 오전 11시, 제품 데모 및 신규 계약 논의',
      false,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = v_user_id AND title = '아바에 중구 방문'
    );
    
    INSERT INTO notifications (user_id, title, content, read, created_at, updated_at)
    SELECT 
      v_user_id,
      '월간 KOL 미팅',
      '7월 25일 오후 3시, 온라인 미팅, 신제품 출시 안내',
      false,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = v_user_id AND title = '월간 KOL 미팅'
    );
    
    INSERT INTO notifications (user_id, title, content, read, created_at, updated_at)
    SELECT 
      v_user_id,
      '신규 전문점 주문 확인',
      '아바에 북구 전문점 첫 주문이 접수되었습니다. 확인 부탁드립니다.',
      true,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = v_user_id AND title = '신규 전문점 주문 확인'
    );
    
    INSERT INTO notifications (user_id, title, content, read, created_at, updated_at)
    SELECT 
      v_user_id,
      '7월 교육 일정 안내',
      '7월 30일 신제품 교육이 본사에서 진행됩니다. 참석 여부를 알려주세요.',
      false,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = v_user_id AND title = '7월 교육 일정 안내'
    );
    
    RAISE NOTICE '테스트 데이터 생성 완료. KOL ID: %, 사용자 ID: %', v_kol_id, v_user_id;
  ELSE
    RAISE EXCEPTION '사용자 ID를 찾을 수 없습니다. Clerk ID: %', v_clerk_id;
  END IF;
END $$;