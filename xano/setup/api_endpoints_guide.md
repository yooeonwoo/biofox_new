# BIOFOX KOL System API 엔드포인트 가이드

## 📋 개요

BIOFOX KOL 시스템의 완전한 API 엔드포인트 가이드입니다. PostgreSQL 직접 연결을 통해 Xano 데이터베이스와 연동됩니다.

## 🏗️ 시스템 아키텍처

```
📦 BIOFOX KOL System
├── 🗃️ Database Layer (Xano PostgreSQL)
│   ├── 8개 테이블, 122개 컬럼
│   ├── 자동 트리거 & 제약조건
│   └── 배열 & JSON 지원
├── 🔌 API Layer (Next.js API Routes)
│   ├── 완전한 CRUD 작업
│   ├── 트랜잭션 안전성
│   └── 타입 안전성
└── 📊 Business Logic
    ├── 자동 티어 계산
    ├── 수수료 계산
    ├── CRM 진행률 추적
    └── 실시간 통계
```

## 🔗 API 엔드포인트

### 1. 📦 주문 관리 API

**Base URL**: `/api/xano/orders`

#### GET - 주문 목록 조회
```
GET /api/xano/orders?page=1&limit=10&shop_id=1&commission_status=pending
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `shop_id`: 전문점 ID 필터
- `commission_status`: 수수료 상태 필터 (`pending`, `approved`, `paid`, `cancelled`)
- `start_date`: 시작일 필터 (YYYY-MM-DD)
- `end_date`: 종료일 필터 (YYYY-MM-DD)

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shop_id": 1,
      "order_date": "2024-01-15",
      "total_amount": 150000.00,
      "commission_rate": 30.00,
      "commission_amount": 45000.00,
      "commission_status": "approved",
      "is_self_shop_order": false,
      "items": [
        {
          "id": 1,
          "product_name": "BIOFOX 크림",
          "quantity": 2,
          "unit_price": 75000.00,
          "subtotal": 150000.00
        }
      ]
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### POST - 새 주문 생성
```
POST /api/xano/orders
```

**요청 본문**:
```json
{
  "shop_id": 1,
  "order_date": "2024-01-15",
  "total_amount": 150000.00,
  "commission_rate": 30.00,
  "commission_amount": 45000.00,
  "commission_status": "pending",
  "is_self_shop_order": false,
  "items": [
    {
      "product_name": "BIOFOX 크림",
      "product_code": "BF001",
      "quantity": 2,
      "unit_price": 75000.00,
      "subtotal": 150000.00
    }
  ]
}
```

#### PUT - 주문 수정
```
PUT /api/xano/orders
```

**요청 본문**:
```json
{
  "id": 1,
  "commission_status": "approved"
}
```

#### DELETE - 주문 삭제
```
DELETE /api/xano/orders?id=1
```

### 2. 🔧 기기 판매 API

**Base URL**: `/api/xano/device-sales`

#### GET - 기기 판매 목록 조회
```
GET /api/xano/device-sales?page=1&limit=10&kol_id=1&tier=tier_5_plus
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `kol_id`: KOL ID 필터
- `tier`: 티어 필터 (`tier_1_4`, `tier_5_plus`)
- `start_date`: 시작일 필터
- `end_date`: 종료일 필터
- `device_model`: 기기 모델 필터

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kol_id": 1,
      "device_model": "BIOFOX-2024-PRO",
      "sale_date": "2024-01-15",
      "tier": "tier_5_plus",
      "standard_commission": 500000.00,
      "actual_commission": 600000.00,
      "serial_numbers": ["BF2024001", "BF2024002", "BF2024003"],
      "device_count": 3
    }
  ],
  "stats": {
    "total_sales": 10,
    "total_devices": 25,
    "total_commission": 5000000.00
  }
}
```

#### POST - 새 기기 판매 등록
```
POST /api/xano/device-sales
```

**요청 본문**:
```json
{
  "kol_id": 1,
  "device_model": "BIOFOX-2024-PRO",
  "sale_date": "2024-01-15",
  "serial_numbers": ["BF2024001", "BF2024002"],
  "standard_commission": 500000.00,
  "actual_commission": 600000.00
}
```

**특징**:
- 🔄 **자동 티어 계산**: 5대 미만 → `tier_1_4`, 5대 이상 → `tier_5_plus`
- 💰 **수수료 자동 계산**: 티어에 따른 차등 적용
- 📊 **누적 데이터 업데이트**: KOL별 기기 판매 누적 자동 업데이트

### 3. 🔄 CRM 워크플로우 API

**Base URL**: `/api/xano/crm-workflow`

#### GET - CRM 카드 목록 조회
```
GET /api/xano/crm-workflow?page=1&limit=10&kol_id=1&stage=5&status=completed
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `kol_id`: KOL ID 필터
- `stage`: 현재 단계 필터 (1-10)
- `status`: 특정 단계 상태 필터 (`pending`, `in_progress`, `completed`, `skipped`)
- `tags`: 태그 필터 (쉼표로 구분)
- `installation_training`: 설치 교육 완료 여부 필터

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kol_id": 1,
      "shop_id": 1,
      "stage_1_status": "completed",
      "stage_1_completed_at": "2024-01-10T10:00:00Z",
      "stage_2_status": "in_progress",
      "current_stage": 2,
      "progress_percentage": 20,
      "installation_training_completed": true,
      "tags": ["premium", "vip"],
      "q1_answer": "매우 만족",
      "q2_answer": "추천하겠습니다"
    }
  ],
  "stats": {
    "total_cards": 50,
    "stage_1_completed": 45,
    "stage_10_completed": 5,
    "avg_progress": 65.5
  }
}
```

#### POST - 새 CRM 카드 생성
```
POST /api/xano/crm-workflow
```

**요청 본문**:
```json
{
  "kol_id": 1,
  "shop_id": 1,
  "tags": ["premium", "vip"],
  "initial_stage": 1,
  "q1_answer": "매우 만족"
}
```

#### PUT - CRM 카드 업데이트
```
PUT /api/xano/crm-workflow
```

**요청 본문**:
```json
{
  "id": 1,
  "stage": 2,
  "action": "complete",
  "tags": ["premium", "vip", "completed"],
  "installation_training_completed": true
}
```

**특징**:
- 🔄 **10단계 워크플로우**: 각 단계별 상태 추적
- 📊 **실시간 진행률**: 자동 진행률 계산
- 🏷️ **태그 시스템**: 유연한 카테고리 관리
- 📝 **6개 질문**: 설문조사 및 답변 관리

### 4. 🏥 임상 관리 API

**Base URL**: `/api/xano/clinical-management`

#### GET - 임상 케이스 목록 조회
```
GET /api/xano/clinical-management?page=1&limit=10&kol_id=1&status=active
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `kol_id`: KOL ID 필터
- `shop_id`: 전문점 ID 필터
- `status`: 케이스 상태 필터 (`active`, `completed`, `cancelled`, `on_hold`)
- `subject_type`: 대상자 유형 필터 (`customer`, `personal`, `model`)
- `consent_status`: 동의서 상태 필터 (`pending`, `approved`, `rejected`)

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kol_id": 1,
      "shop_id": 1,
      "subject_type": "customer",
      "subject_name": "김○○",
      "subject_age": 35,
      "subject_gender": "female",
      "status": "active",
      "consent_status": "approved",
      "start_date": "2024-01-15",
      "treatment_type": "안티에이징 케어",
      "session_count": 3,
      "progress_percentage": 60,
      "latest_session": {
        "session_number": 3,
        "session_date": "2024-01-20",
        "session_type": "treatment",
        "next_session_date": "2024-01-25"
      }
    }
  ],
  "stats": {
    "total_cases": 20,
    "active_cases": 15,
    "completed_cases": 5,
    "approved_consent": 18
  }
}
```

#### POST - 새 임상 케이스 생성
```
POST /api/xano/clinical-management
```

**요청 본문**:
```json
{
  "kol_id": 1,
  "shop_id": 1,
  "subject_type": "customer",
  "subject_name": "김○○",
  "subject_age": 35,
  "subject_gender": "female",
  "subject_phone": "010-1234-5678",
  "start_date": "2024-01-15",
  "estimated_duration_weeks": 4,
  "treatment_type": "안티에이징 케어",
  "treatment_area": "얼굴 전체",
  "consent_status": "approved"
}
```

### 5. 📋 임상 세션 API

**Base URL**: `/api/xano/clinical-sessions`

#### GET - 임상 세션 목록 조회
```
GET /api/xano/clinical-sessions?case_id=1&page=1&limit=10
```

**쿼리 파라미터**:
- `case_id`: 케이스 ID (필수)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `session_type`: 세션 유형 필터 (`consultation`, `treatment`, `followup`, `final`)

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "case_id": 1,
      "session_number": 1,
      "session_date": "2024-01-15",
      "session_type": "consultation",
      "duration_minutes": 90,
      "notes": "초기 상담 및 피부 상태 확인",
      "before_photos": ["photo1.jpg", "photo2.jpg"],
      "after_photos": [],
      "pain_level": 0,
      "satisfaction_score": 8,
      "next_session_date": "2024-01-18",
      "before_photos_count": 2,
      "after_photos_count": 0
    }
  ],
  "stats": {
    "total_sessions": 5,
    "consultation_sessions": 1,
    "treatment_sessions": 3,
    "followup_sessions": 1,
    "avg_satisfaction_score": 8.5
  }
}
```

#### POST - 새 임상 세션 생성
```
POST /api/xano/clinical-sessions
```

**요청 본문**:
```json
{
  "case_id": 1,
  "session_number": 1,
  "session_date": "2024-01-15",
  "session_type": "consultation",
  "duration_minutes": 90,
  "notes": "초기 상담 및 피부 상태 확인",
  "before_photos": ["photo1.jpg", "photo2.jpg"],
  "pain_level": 0,
  "satisfaction_score": 8,
  "next_session_date": "2024-01-18"
}
```

#### PATCH - 세션 사진 추가/제거
```
PATCH /api/xano/clinical-sessions
```

**요청 본문**:
```json
{
  "id": 1,
  "action": "add",
  "photo_type": "after",
  "photo_urls": ["after1.jpg", "after2.jpg"]
}
```

### 6. 📊 대시보드 API

**Base URL**: `/api/xano/dashboard`

#### GET - 대시보드 데이터 조회
```
GET /api/xano/dashboard?kol_id=1&period=month
```

**쿼리 파라미터**:
- `kol_id`: KOL ID 필터 (선택사항)
- `start_date`: 시작일 필터 (선택사항)
- `end_date`: 종료일 필터 (선택사항)
- `period`: 기간 필터 (`today`, `week`, `month`, `quarter`, `year`)

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "orders": {
        "total_orders": 100,
        "total_amount": 15000000.00,
        "total_commission": 4500000.00,
        "avg_order_amount": 150000.00
      },
      "devices": {
        "total_devices_sold": 25,
        "total_device_sales": 10,
        "total_actual_commission": 5000000.00
      },
      "crm": {
        "total_crm_cards": 50,
        "stage_10_completed": 5,
        "avg_crm_progress": 65.5
      },
      "clinical": {
        "total_clinical_cases": 20,
        "active_cases": 15,
        "completed_cases": 5
      }
    },
    "recent_activities": [
      {
        "activity_type": "order",
        "activity_id": 1,
        "activity_value": 150000.00,
        "activity_status": "approved",
        "activity_date": "2024-01-15T10:00:00Z"
      }
    ],
    "monthly_trends": [
      {
        "month": "2024-01-01T00:00:00Z",
        "orders": 20,
        "devices": 5,
        "clinical_cases": 3,
        "commission": 1000000.00
      }
    ],
    "kpis": {
      "total_revenue": 15000000.00,
      "total_commission": 4500000.00,
      "total_devices_sold": 25,
      "avg_crm_progress": 65.5,
      "clinical_completion_rate": "25.0",
      "avg_satisfaction_score": 8.5
    }
  }
}
```

## 🗃️ 데이터베이스 스키마

### 테이블 구조

| 테이블 | 컬럼 수 | 주요 기능 |
|--------|---------|-----------|
| `orders` | 11개 | 주문 관리, 수수료 추적 |
| `order_items` | 8개 | 주문 상세 정보 |
| `device_sales` | 10개 | 기기 판매, 티어 관리 |
| `kol_device_accumulator` | 8개 | KOL 기기 누적 데이터 |
| `crm_cards` | 35개 | 10단계 CRM 워크플로우 |
| `self_growth_cards` | 15개 | 셀프 성장 관리 |
| `clinical_cases` | 20개 | 임상 케이스 관리 |
| `clinical_sessions` | 15개 | 임상 세션 기록 |

**총 8개 테이블, 122개 컬럼**

### 주요 특징

- 🔄 **자동 업데이트 트리거**: 모든 테이블의 `updated_at` 자동 업데이트
- 📊 **배열 지원**: 시리얼 번호, 사진 URL, 태그 등
- 🔒 **제약 조건**: 데이터 무결성 보장
- 🚀 **성능 최적화**: 인덱스 및 쿼리 최적화

## 💻 사용 방법

### 1. 환경 설정

```bash
# 필요한 패키지 설치
npm install pg @types/pg

# 환경 변수 설정 (.env.local)
XANO_DB_HOST=34.64.147.136
XANO_DB_NAME=xano-xcj1-wluk-xdjk-db
XANO_DB_USER=full-33f4a67d
XANO_DB_PASSWORD=7fa048da53a894e14aac1ba4ce160601
XANO_DB_PORT=5432
```

### 2. 데이터베이스 초기화

```bash
# 데이터베이스 테이블 생성
python3 xano_direct_implementation.py
```

### 3. API 사용 예시

```typescript
// 주문 생성 예시
const createOrder = async (orderData: any) => {
  const response = await fetch('/api/xano/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  return response.json();
};

// 기기 판매 등록 예시
const registerDeviceSale = async (saleData: any) => {
  const response = await fetch('/api/xano/device-sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  });
  
  return response.json();
};
```

## 🔧 비즈니스 로직

### 1. 자동 티어 계산

```typescript
// 5대 미만: tier_1_4 (기본 수수료)
// 5대 이상: tier_5_plus (프리미엄 수수료)

const calculateTier = (totalDevicesSold: number) => {
  return totalDevicesSold >= 5 ? 'tier_5_plus' : 'tier_1_4';
};
```

### 2. 수수료 계산

```typescript
const calculateCommission = (tier: string, baseAmount: number) => {
  const rate = tier === 'tier_5_plus' ? 1.2 : 1.0; // 20% 추가
  return baseAmount * rate;
};
```

### 3. CRM 진행률 계산

```typescript
const calculateCrmProgress = (stageStatuses: any) => {
  let maxCompletedStage = 0;
  for (let i = 10; i >= 1; i--) {
    if (stageStatuses[`stage_${i}_status`] === 'completed') {
      maxCompletedStage = i;
      break;
    }
  }
  return maxCompletedStage * 10; // 10% per stage
};
```

## 🚀 다음 단계

1. **프론트엔드 통합**: React/Next.js 컴포넌트 생성
2. **인증 시스템**: JWT 또는 세션 기반 인증 추가
3. **실시간 알림**: WebSocket 또는 Server-Sent Events
4. **파일 업로드**: 이미지 및 문서 업로드 기능
5. **모바일 최적화**: 반응형 디자인 및 PWA

## 🔍 문제 해결

### 일반적인 오류

1. **연결 오류**: 데이터베이스 연결 정보 확인
2. **권한 오류**: 데이터베이스 사용자 권한 확인
3. **타입 오류**: TypeScript 타입 정의 확인

### 성능 최적화

1. **인덱스 사용**: 자주 조회하는 컬럼에 인덱스 추가
2. **쿼리 최적화**: 필요한 컬럼만 선택
3. **연결 풀**: 적절한 연결 풀 크기 설정

---

🎯 **BIOFOX KOL 시스템이 완성되었습니다!** 

이제 프론트엔드 개발을 시작하거나 추가 기능을 구현할 수 있습니다.
