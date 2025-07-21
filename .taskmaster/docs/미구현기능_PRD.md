# BIOFOX KOL 시스템 - 미구현 기능 PRD

## 1. 프로젝트 개요

BIOFOX KOL 시스템에서 현재 미구현된 핵심 기능들을 Supabase 백엔드 기반으로 구현하는 프로젝트입니다. 기존 사용자 관리, 주문 관리, 기기 판매, 임상 관리 기능들은 이미 구현되어 있으므로, 이 PRD는 추가로 필요한 기능들만을 다룹니다.

### 기술 스택
- **백엔드**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **프론트엔드**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **상태관리**: React Query, Zustand
- **UI/UX**: 모바일 반응형 (아이폰 미니 ~ 프로맥스)

## 2. CRM 관리 시스템

### 2.1 CRM 카드 관리 페이지
**경로**: `/biofox-admin/crm`

#### 기능 요구사항
- KOL/OL이 소속 전문점별로 CRM 카드를 생성하고 관리
- 10단계 CRM 프로세스 진행 상황 추적
- 특이사항 질문 4개 답변 관리 (Shop의 자가평가와 연동)
- 설치교육 정보 입력 및 셀프성장 카드 자동 동기화

#### 데이터베이스 설계 (Supabase)
```sql
-- CRM 카드 테이블 (이미 존재)
-- crm_cards 테이블 사용
-- 추가 필요: UI 구현, API 연동, 비즈니스 로직

-- 필요한 API 엔드포인트:
-- GET /api/crm/cards - CRM 카드 목록 조회
-- POST /api/crm/cards - 새 CRM 카드 생성
-- PUT /api/crm/cards/[id] - CRM 카드 정보 업데이트
-- GET /api/crm/cards/[id] - 특정 CRM 카드 상세 조회
```

#### UI/UX 요구사항
- 카드 기반 레이아웃으로 전문점별 CRM 현황 표시
- 10단계 진행 상황을 진행률 바로 시각화
- 단계별 체크박스와 상세 입력 폼
- 모바일에서 카드를 스와이프하여 조작 가능
- 필터링 기능: 완료/미완료, 전문점명 검색

## 3. 셀프성장 카드 시스템

### 3.1 셀프성장 카드 페이지  
**경로**: `/kol-new/self-growth` 및 `/shop/self-growth`

#### 기능 요구사항
- CRM 카드 생성 시 자동으로 셀프성장 카드 생성
- Shop Owner의 자가평가 4개 질문 답변
- 본사실무교육 신청 및 진행 상황 관리
- KOL CRM 카드와 실시간 양방향 동기화

#### 데이터베이스 설계 (Supabase)
```sql
-- 셀프성장 카드 테이블 (이미 존재)
-- self_growth_cards 테이블 사용

-- 필요한 API 엔드포인트:
-- GET /api/self-growth/[shopId] - 셀프성장 카드 조회
-- PUT /api/self-growth/[id]/assessment - 자가평가 업데이트
-- PUT /api/self-growth/[id]/education - 교육 정보 업데이트
```

#### UI/UX 요구사항
- 진행률 대시보드 (원형 차트)
- 자가평가 Y/N 체크박스 (4개 질문)
- 설치교육 정보 표시 (KOL이 입력한 정보)
- 본사실무교육 신청 버튼 및 상태 표시
- 실시간 동기화 표시 (마지막 업데이트 시간)

## 4. 교육 관리 시스템

### 4.1 교육 관리 페이지
**경로**: `/biofox-admin/education`

#### 기능 요구사항
- 본사실무교육 신청 내역 관리
- 설치교육 일정 및 담당자 관리
- 교육 완료 처리 및 수료증 발급
- 교육 통계 및 현황 대시보드

#### 데이터베이스 설계 (Supabase)
```sql
-- 교육 신청 테이블
CREATE TABLE education_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES users(id),
  education_type VARCHAR(50) NOT NULL, -- 'installation', 'company_training', 'advanced_training'
  status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'scheduled', 'in_progress', 'completed'
  applied_at TIMESTAMP DEFAULT NOW(),
  scheduled_date DATE,
  completed_at TIMESTAMP,
  manager_name VARCHAR(100),
  manager_contact VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API 엔드포인트:
-- GET /api/education/applications - 교육 신청 목록
-- POST /api/education/applications - 새 교육 신청
-- PUT /api/education/applications/[id] - 교육 정보 업데이트
-- POST /api/education/applications/[id]/complete - 교육 완료 처리
```

#### UI/UX 요구사항
- 신청 내역 테이블 (페이지네이션)
- 교육 타입별 필터링
- 일정 캘린더 뷰
- 완료 처리 모달
- 교육 통계 차트 (월별, 타입별)

## 5. Shop Owner 대시보드

### 5.1 Shop Owner 전용 대시보드
**경로**: `/shop/dashboard`

#### 기능 요구사항
- 나의 임상 현황 요약
- 셀프성장 카드 진행률
- 최근 알림 및 공지사항
- 교육 일정 및 신청 현황
- 간편 액션 버튼들 (임상 등록, 교육 신청 등)

#### UI/UX 요구사항
- 모바일 우선 반응형 디자인
- 큰 버튼과 직관적인 아이콘
- 진행률 원형 차트
- 최근 활동 타임라인
- 빠른 액션을 위한 FAB 버튼

## 6. 월별 종합 정산 리포트

### 6.1 월별 리포트 페이지
**경로**: `/biofox-admin/reports/monthly`

#### 기능 요구사항
- 월별 매출 및 수수료 종합 현황
- KOL/OL별 성과 순위
- 전문점 활성도 분석
- 기기 판매 현황 및 티어 변동
- 임상 진행률 및 통계

#### 데이터베이스 설계 (Supabase)
```sql
-- 월별 리포트 테이블
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_month DATE NOT NULL,
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_commission DECIMAL(15,2) DEFAULT 0,
  total_devices INTEGER DEFAULT 0,
  active_shops INTEGER DEFAULT 0,
  clinical_cases INTEGER DEFAULT 0,
  generated_at TIMESTAMP DEFAULT NOW(),
  report_data JSONB -- 상세 통계 데이터
);

-- API 엔드포인트:
-- GET /api/reports/monthly - 월별 리포트 목록
-- POST /api/reports/monthly/generate - 월별 리포트 생성
-- GET /api/reports/monthly/[month] - 특정 월 리포트 상세
```

#### UI/UX 요구사항
- 월별 선택 드롭다운
- 주요 지표 카드 레이아웃
- 차트 및 그래프 (Chart.js 사용)
- Excel 내보내기 기능
- 프린트 최적화 CSS

## 7. 실시간 알림 시스템

### 7.1 알림 센터 페이지
**경로**: `/biofox-admin/notifications` 및 각 사용자별 알림

#### 기능 요구사항
- 실시간 인앱 알림 (Supabase Realtime 활용)
- 알림 타입별 템플릿 관리
- 사용자별 알림 설정
- 알림 히스토리 및 읽음 상태 관리

#### 데이터베이스 설계 (Supabase)
```sql
-- 알림 테이블 (이미 존재하지만 강화 필요)
-- notifications 테이블 확장

-- 알림 설정 테이블
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  notification_type VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API 엔드포인트:
-- GET /api/notifications - 사용자 알림 목록
-- PUT /api/notifications/[id]/read - 알림 읽음 처리
-- GET /api/notifications/settings - 알림 설정 조회
-- PUT /api/notifications/settings - 알림 설정 업데이트
```

#### UI/UX 요구사항
- 헤더 알림 벨 아이콘 (미읽은 개수 표시)
- 알림 드롭다운 메뉴
- 알림 설정 토글 스위치
- 실시간 알림 팝업 (Toast)

## 8. 구현 우선순위 및 일정

### Phase 1 (1-2주) - 핵심 기능
1. CRM 카드 관리 시스템 기본 구현
2. 셀프성장 카드 시스템 기본 구현
3. 기본 알림 시스템

### Phase 2 (2-3주) - 고도화
1. 교육 관리 시스템
2. Shop Owner 대시보드
3. 데이터 동기화 로직 완성

### Phase 3 (1-2주) - 완성 및 최적화
1. 월별 리포트 시스템
2. 고급 알림 기능
3. UI/UX 최적화 및 테스트

## 9. 성공 지표

- CRM 카드 생성 및 관리 기능 정상 작동
- 셀프성장 카드와 CRM 카드 간 실시간 동기화
- 교육 신청 및 관리 프로세스 원활한 진행
- Shop Owner 사용성 개선 (모바일 반응형)
- 월별 리포트 자동 생성 및 정확성
- 실시간 알림 시스템 안정성

## 10. 기술적 고려사항

### Supabase 활용
- Row Level Security (RLS) 정책 설정
- Realtime 기능으로 실시간 동기화
- Storage를 활용한 교육 자료 관리
- Edge Functions 활용 (필요시)

### 프론트엔드 최적화
- React Query로 캐싱 및 동기화
- shadcn/ui 컴포넌트 활용
- 반응형 디자인 철저히 구현
- 로딩 상태 및 에러 처리 강화

### 데이터 무결성
- 기존 시스템과의 호환성 유지
- 마이그레이션 스크립트 작성
- 백업 및 복구 계획 수립 