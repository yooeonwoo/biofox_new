-- ================================================
-- BIOFOX KOL - Test Data Seed Script
-- ================================================
-- 테스트 및 개발 환경을 위한 샘플 데이터 생성
-- 다양한 비즈니스 시나리오를 커버하는 데이터를 포함

-- 기존 테스트 데이터 정리 (필요시)
-- TRUNCATE TABLE shop_relationships CASCADE;
-- TRUNCATE TABLE profiles CASCADE;

-- ================================================
-- 1. Profiles 테이블 - 샘플 사용자들
-- ================================================

-- 1.1 Admin 사용자
INSERT INTO profiles (id, email, name, role, status, shop_name, region, commission_rate, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@biofox.co.kr', '시스템 관리자', 'admin', 'approved', '바이오폭스 본사', '서울시 강남구', NULL, NOW());

-- 1.2 KOL (Key Opinion Leaders) - 최상위 레벨
INSERT INTO profiles (id, email, name, role, status, shop_name, region, commission_rate, total_subordinates, active_subordinates, approved_at, approved_by, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'kol1@example.com', '김미용', 'kol', 'approved', '김미용 피부과', '서울시 강남구', 15.00, 8, 7, NOW() - INTERVAL '60 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days'),
('10000000-0000-0000-0000-000000000002', 'kol2@example.com', '이정훈', 'kol', 'approved', '이정훈 성형외과', '서울시 서초구', 18.00, 12, 10, NOW() - INTERVAL '45 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '80 days'),
('10000000-0000-0000-0000-000000000003', 'kol3@example.com', '박수진', 'kol', 'approved', '박수진 의원', '부산시 해운대구', 12.00, 5, 4, NOW() - INTERVAL '30 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '70 days');

-- 1.3 OL (Opinion Leaders) - 중간 레벨
INSERT INTO profiles (id, email, name, role, status, shop_name, region, commission_rate, total_subordinates, active_subordinates, approved_at, approved_by, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'ol1@example.com', '최영미', 'ol', 'approved', '영미 에스테틱', '서울시 강남구', 10.00, 3, 3, NOW() - INTERVAL '20 days', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days'),
('20000000-0000-0000-0000-000000000002', 'ol2@example.com', '정민수', 'ol', 'approved', '민수 뷰티샵', '서울시 강남구', 8.00, 4, 2, NOW() - INTERVAL '25 days', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '55 days'),
('20000000-0000-0000-0000-000000000003', 'ol3@example.com', '홍지연', 'ol', 'approved', '지연 스킨케어', '서울시 서초구', 9.00, 2, 2, NOW() - INTERVAL '15 days', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '45 days'),
('20000000-0000-0000-0000-000000000004', 'ol4@example.com', '강태현', 'ol', 'approved', '태현 미용실', '부산시 해운대구', 7.00, 3, 1, NOW() - INTERVAL '18 days', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '40 days');

-- 1.4 Shop Owners - 최하위 레벨 
INSERT INTO profiles (id, email, name, role, status, shop_name, region, commission_rate, approved_at, approved_by, created_at) VALUES
-- 김미용(KOL1) 산하 샵들
('30000000-0000-0000-0000-000000000001', 'shop1@example.com', '안효진', 'shop_owner', 'approved', '효진 뷰티룸', '서울시 강남구', 5.00, NOW() - INTERVAL '10 days', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days'),
('30000000-0000-0000-0000-000000000002', 'shop2@example.com', '신혜원', 'shop_owner', 'approved', '혜원 피부관리실', '서울시 강남구', 6.00, NOW() - INTERVAL '12 days', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '32 days'),
('30000000-0000-0000-0000-000000000003', 'shop3@example.com', '유지현', 'shop_owner', 'approved', '지현 스파', '서울시 강남구', 4.50, NOW() - INTERVAL '8 days', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '28 days'),
('30000000-0000-0000-0000-000000000004', 'shop4@example.com', '문서영', 'shop_owner', 'approved', '서영 에스테틱', '서울시 강남구', 5.50, NOW() - INTERVAL '14 days', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '35 days'),
('30000000-0000-0000-0000-000000000005', 'shop5@example.com', '조민정', 'shop_owner', 'approved', '민정 케어센터', '서울시 강남구', 5.00, NOW() - INTERVAL '9 days', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '29 days'),

-- 이정훈(KOL2) 산하 샵들  
('30000000-0000-0000-0000-000000000006', 'shop6@example.com', '김수연', 'shop_owner', 'approved', '수연 클리닉', '서울시 서초구', 7.00, NOW() - INTERVAL '11 days', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '31 days'),
('30000000-0000-0000-0000-000000000007', 'shop7@example.com', '이민아', 'shop_owner', 'approved', '민아 뷰티', '서울시 서초구', 6.50, NOW() - INTERVAL '13 days', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '33 days'),

-- 박수진(KOL3) 산하 샵들
('30000000-0000-0000-0000-000000000008', 'shop8@example.com', '전소라', 'shop_owner', 'approved', '소라 피부샵', '부산시 해운대구', 4.00, NOW() - INTERVAL '7 days', '20000000-0000-0000-0000-000000000004', NOW() - INTERVAL '27 days'),

-- 대기 중인 샵들 (승인 대기)
('30000000-0000-0000-0000-000000000009', 'pending1@example.com', '장미래', 'shop_owner', 'pending', '미래 스킨케어', '대구시 중구', NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
('30000000-0000-0000-0000-000000000010', 'pending2@example.com', '오현지', 'shop_owner', 'pending', '현지 뷰티룸', '인천시 남동구', NULL, NULL, NULL, NOW() - INTERVAL '5 days'),

-- 거부된 샵들
('30000000-0000-0000-0000-000000000011', 'rejected1@example.com', '한소희', 'shop_owner', 'rejected', '소희 에스테틱', '광주시 서구', NULL, NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days');

-- ================================================
-- 2. Shop Relationships 테이블 - 관계 설정
-- ================================================

-- 2.1 KOL -> OL 관계들 (최상위 -> 중간)
INSERT INTO shop_relationships (id, shop_owner_id, parent_id, started_at, is_active, relationship_type, notes, created_by, created_at) VALUES
-- 김미용(KOL1)의 하위 OL들
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days', true, 'direct', '김미용 피부과 직영 에스테틱 체인 관리자', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days'),
('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '55 days', true, 'direct', '김미용 피부과 강남점 관리자', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '55 days'),

-- 이정훈(KOL2)의 하위 OL들
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '45 days', true, 'direct', '이정훈 성형외과 서초점 관리자', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '45 days'),

-- 박수진(KOL3)의 하위 OL들
('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '40 days', true, 'direct', '박수진 의원 해운대점 관리자', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '40 days');

-- 2.2 OL -> Shop Owner 관계들 (중간 -> 최하위)
INSERT INTO shop_relationships (id, shop_owner_id, parent_id, started_at, is_active, relationship_type, notes, created_by, created_at) VALUES
-- 최영미(OL1) 산하 샵들
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', true, 'direct', '영미 에스테틱 체인 1호점', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '32 days', true, 'direct', '영미 에스테틱 체인 2호점', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '32 days'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '28 days', true, 'direct', '영미 에스테틱 체인 3호점', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '28 days'),

-- 정민수(OL2) 산하 샵들
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '35 days', true, 'direct', '민수 뷰티샵 프랜차이즈 1호', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '35 days'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '29 days', true, 'direct', '민수 뷰티샵 프랜차이즈 2호', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '29 days'),

-- 홍지연(OL3) 산하 샵들
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '31 days', true, 'direct', '지연 스킨케어 서초점', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '31 days'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '33 days', true, 'direct', '지연 스킨케어 신논현점', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '33 days'),

-- 강태현(OL4) 산하 샵들  
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', NOW() - INTERVAL '27 days', true, 'direct', '태현 미용실 해운대점', '20000000-0000-0000-0000-000000000004', NOW() - INTERVAL '27 days');

-- 2.3 특수한 관계들 (이전, 일시적, 종료된 관계)
INSERT INTO shop_relationships (id, shop_owner_id, parent_id, started_at, ended_at, is_active, relationship_type, notes, created_by, created_at) VALUES
-- 종료된 관계 (샵 이전)
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '100 days', NOW() - INTERVAL '35 days', false, 'transferred', '민수 뷰티샵에서 영미 에스테틱으로 이전', '20000000-0000-0000-0000-000000000002', NOW() - INTERVAL '100 days'),

-- 일시적 관계 (임시 관리)
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', true, 'temporary', '홍지연의 임시 관리 (정민수 휴가 기간)', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days');

-- ================================================
-- 3. 업데이트 통계 (total_subordinates, active_subordinates)
-- ================================================

-- KOL들의 총 하위 및 활성 하위 수 업데이트
UPDATE profiles SET 
  total_subordinates = (
    SELECT COUNT(*) FROM shop_relationships sr 
    WHERE sr.parent_id = profiles.id OR sr.parent_id IN (
      SELECT shop_owner_id FROM shop_relationships WHERE parent_id = profiles.id
    )
  ),
  active_subordinates = (
    SELECT COUNT(*) FROM shop_relationships sr 
    WHERE sr.is_active = true AND (
      sr.parent_id = profiles.id OR sr.parent_id IN (
        SELECT shop_owner_id FROM shop_relationships WHERE parent_id = profiles.id AND is_active = true
      )
    )
  )
WHERE role IN ('kol', 'ol');

-- ================================================
-- 4. 검증 쿼리들 (결과 확인용)
-- ================================================

-- 전체 구조 확인
SELECT 
  p.name as "사용자명",
  p.role as "역할",
  p.shop_name as "샵명",
  p.status as "상태",
  p.total_subordinates as "총하위수",
  p.active_subordinates as "활성하위수"
FROM profiles p 
ORDER BY 
  CASE p.role 
    WHEN 'admin' THEN 1 
    WHEN 'kol' THEN 2 
    WHEN 'ol' THEN 3 
    WHEN 'shop_owner' THEN 4 
  END, p.name;

-- 관계 구조 확인  
SELECT 
  child.name as "자식",
  child.role as "자식역할", 
  parent.name as "부모",
  parent.role as "부모역할",
  sr.relationship_type as "관계타입",
  sr.is_active as "활성여부",
  sr.started_at::date as "시작일"
FROM shop_relationships sr
JOIN profiles child ON sr.shop_owner_id = child.id
JOIN profiles parent ON sr.parent_id = parent.id
ORDER BY sr.started_at;

-- 트리 구조 확인 (WITH RECURSIVE 사용)
WITH RECURSIVE hierarchy AS (
  -- Root nodes (KOLs)
  SELECT 
    id, name, role, shop_name, 0 as level, 
    name as path
  FROM profiles 
  WHERE role = 'kol'
  
  UNION ALL
  
  -- Recursive part
  SELECT 
    p.id, p.name, p.role, p.shop_name, h.level + 1,
    h.path || ' > ' || p.name
  FROM profiles p
  JOIN shop_relationships sr ON p.id = sr.shop_owner_id
  JOIN hierarchy h ON sr.parent_id = h.id
  WHERE sr.is_active = true
)
SELECT 
  level,
  REPEAT('  ', level) || name as "계층구조",
  role as "역할",
  path as "전체경로"
FROM hierarchy 
ORDER BY path; 