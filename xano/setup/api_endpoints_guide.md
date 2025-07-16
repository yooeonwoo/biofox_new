# Xano API 엔드포인트 생성 가이드

## 1. CRM 관리 API

### 1.1 CRM 카드 생성
- **Path**: `/crm/create`
- **Method**: POST
- **Logic**:
  1. Input 검증 (kol_id, shop_id 필수)
  2. 중복 체크 (unique constraint)
  3. CRM 카드 생성
  4. Self Growth 카드 자동 생성
  5. Response 반환

### 1.2 CRM 단계 업데이트
- **Path**: `/crm/update-stage`
- **Method**: PUT
- **Logic**:
  1. Input: card_id, stage_number, status
  2. stage_X_status 업데이트
  3. stage_X_completed_at 타임스탬프 기록
  4. last_activity_at 업데이트

### 1.3 CRM-셀프성장 연동
- **Path**: `/crm/sync-self-growth`
- **Method**: POST
- **Logic**:
  1. CRM의 설치교육 정보 → Self Growth로 복사
  2. Self Growth의 Q1-Q4 → CRM으로 복사

## 2. 주문 및 수수료 API

### 2.1 주문 등록
- **Path**: `/orders/create`
- **Method**: POST
- **Input**: shop_id, order_date, items[], total_amount
- **Logic**:
  1. 주문 생성
  2. 주문 아이템 생성
  3. KOL 조회 (shop_relationships)
  4. 수수료 계산
  5. 수수료 저장

### 2.2 월별 수수료 계산
- **Path**: `/commission/calculate-monthly`
- **Method**: POST
- **Input**: year_month (예: "2025-01")
- **Logic**:
  1. 모든 KOL 조회
  2. 각 KOL의 소속 shop 조회
  3. 해당 월 매출 합계
  4. 수수료율 적용 (KOL: 30%, OL: 20%)
  5. 본인샵 별도 계산
  6. 결과 저장 및 반환

## 3. 기기 판매 API

### 3.1 기기 판매 등록
- **Path**: `/device/register-sale`
- **Method**: POST
- **Logic**:
  1. device_sales 레코드 생성
  2. KOL 찾기 (shop → KOL)
  3. kol_device_accumulator 업데이트
  4. net_devices_sold 재계산
  5. 티어 변경 체크 (5대 기준)
  6. current_tier 업데이트

## 4. 임상 관리 API

### 4.1 임상 케이스 생성
- **Path**: `/clinical/create-case`
- **Method**: POST
- **Input**: shop_id, subject_type, subject_name, treatment_type
- **Logic**:
  1. clinical_cases 생성
  2. 첫 세션 자동 생성 (session_number: 0)
  3. Response 반환

### 4.2 임상 세션 업데이트
- **Path**: `/clinical/update-session`
- **Method**: PUT
- **Input**: case_id, session_number, photos[], notes
- **Logic**:
  1. 세션 정보 업데이트
  2. 사진 URL 배열 저장
  3. 다음 세션 스케줄 업데이트

## 5. 대시보드 API

### 5.1 KOL 대시보드
- **Path**: `/dashboard/kol`
- **Method**: GET
- **Logic**:
  1. 소속 전문점 수 계산
  2. 활성 전문점 수 (당월 매출 있음)
  3. 총 매출 집계
  4. 수수료 집계
  5. CRM 진행 현황
  6. 임상 진행 현황

### 5.2 Shop 대시보드
- **Path**: `/dashboard/shop`
- **Method**: GET
- **Logic**:
  1. 당월 매출
  2. 임상 진행 현황
  3. CRM 단계 현황
  4. 교육 상태

## 6. 워크플로우 자동화

### 6.1 월말 정산 워크플로우
- **Schedule**: 매월 말일 23:00
- **Logic**:
  1. 모든 KOL 조회
  2. 월별 수수료 계산
  3. 리포트 생성
  4. 이메일 발송

### 6.2 CRM 알림 워크플로우
- **Trigger**: CRM 단계 변경 시
- **Logic**:
  1. 변경 내용 확인
  2. Shop Owner에게 알림
  3. 다음 단계 안내

## 구현 순서
1. 기본 CRUD API 먼저 생성
2. 복잡한 계산 로직 구현
3. 워크플로우 설정
4. 테스트 및 최적화

## Xano에서 구현 팁
- Function Stack 활용하여 재사용 가능한 로직 분리
- Addon으로 복잡한 계산 로직 구현
- Background Task로 무거운 작업 처리
- API Rate Limiting 설정
