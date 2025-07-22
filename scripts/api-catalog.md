# API Endpoints Catalog for Convex Migration

프로젝트의 모든 API 엔드포인트를 카탈로그화한 문서입니다. 이 정보를 바탕으로 Convex query/mutation 함수를 구현합니다.

## 📊 Overview

- **총 API 그룹**: 18개
- **총 엔드포인트**: 47개
- **인증 필요**: 대부분의 엔드포인트
- **권한 체크**: admin, kol, shop_owner 역할 기반

---

## 🔐 Authentication Patterns

### 1. Admin 전용 API (관리자만 접근)

- `/api/users/*`
- `/api/orders/*`
- `/api/devices/*`
- `/api/commissions/*`
- `/api/relationships/*`

### 2. KOL/Shop Owner API (인증된 사용자)

- `/api/kol-new/*`
- `/api/clinical/*`
- `/api/shop/*`

### 3. Mixed/Public API

- `/api/profiles` (일부 제한)
- `/api/auth/*`

---

## 📋 API Groups and Endpoints

### 1. **사용자 관리 (User Management)**

**Base Path**: `/api/users`

| Method | Endpoint                 | Description                             | Auth  | Input                                                     | Output                    |
| ------ | ------------------------ | --------------------------------------- | ----- | --------------------------------------------------------- | ------------------------- |
| GET    | `/api/users`             | 사용자 목록 조회 (페이지네이션, 필터링) | Admin | page, limit, search, role, status, createdFrom, createdTo | User list with pagination |
| GET    | `/api/users/[userId]`    | 특정 사용자 상세 조회                   | Admin | userId (UUID)                                             | User profile details      |
| PUT    | `/api/users/[userId]`    | 사용자 정보 수정                        | Admin | userId + update data                                      | Updated user              |
| POST   | `/api/users/bulk-action` | 일괄 작업 (승인, 거절, 삭제)            | Admin | action, userIds[]                                         | Bulk operation result     |
| GET    | `/api/users/export`      | 사용자 데이터 내보내기                  | Admin | format, filters                                           | Export file               |

**Input Schema Example**:

```typescript
// GET /api/users 쿼리 파라미터
{
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  createdFrom?: string;
  createdTo?: string;
}

// PUT /api/users/[userId] 본문
{
  name?: string;
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  shop_name?: string;
  region?: string;
  commission_rate?: number;
  naver_place_link?: string;
}
```

---

### 2. **주문 관리 (Order Management)**

**Base Path**: `/api/orders`

| Method | Endpoint                | Description                  | Auth  | Input                                                                         | Output                  |
| ------ | ----------------------- | ---------------------------- | ----- | ----------------------------------------------------------------------------- | ----------------------- |
| GET    | `/api/orders`           | 주문 목록 조회 (고급 필터링) | Admin | page, limit, shop_id, date_from, date_to, status, amounts, commission filters | Order list with items   |
| GET    | `/api/orders/[orderId]` | 주문 상세 조회               | Admin | orderId (UUID)                                                                | Order with full details |
| POST   | `/api/orders`           | 새 주문 생성                 | Admin | shop_id, order_date, items[], is_self_shop_order                              | Created order           |
| PUT    | `/api/orders/[orderId]` | 주문 수정                    | Admin | orderId + update data                                                         | Updated order           |
| DELETE | `/api/orders/[orderId]` | 주문 삭제                    | Admin | orderId                                                                       | Success confirmation    |

**Complex Features**:

- 수수료 자동 계산 (소속 관계 기반)
- 주문 항목 (order_items) 관리
- 본인샵 주문 여부 추적

---

### 3. **디바이스 판매 관리 (Device Sales)**

**Base Path**: `/api/devices`

| Method | Endpoint                            | Description          | Auth  | Input                                                     | Output                     |
| ------ | ----------------------------------- | -------------------- | ----- | --------------------------------------------------------- | -------------------------- |
| GET    | `/api/devices`                      | 디바이스 판매 목록   | Admin | page, limit, shop_id, kol_id, date_from, date_to, sortBy  | Device sales list          |
| GET    | `/api/devices/[deviceId]`           | 디바이스 판매 상세   | Admin | deviceId                                                  | Sale details with KOL info |
| POST   | `/api/devices`                      | 디바이스 판매 등록   | Admin | shop_id, sale_date, quantity, device_name, serial_numbers | Created sale record        |
| POST   | `/api/devices/simulate-tier-change` | 티어 변경 시뮬레이션 | Admin | kol_id, quantity_change                                   | Tier calculation           |
| GET    | `/api/devices/statistics`           | 디바이스 판매 통계   | Admin | period, kol_id                                            | Statistics summary         |

**Special Features**:

- 티어 시스템 (tier_1_4, tier_5_plus)
- KOL 누적 판매 대수 추적
- 반품 처리 (음수 수량)

---

### 4. **수수료 관리 (Commission Management)**

**Base Path**: `/api/commissions`

| Method | Endpoint                          | Description            | Auth  | Input                              | Output                  |
| ------ | --------------------------------- | ---------------------- | ----- | ---------------------------------- | ----------------------- |
| GET    | `/api/commissions`                | 수수료 계산 목록       | Admin | month, kol_id, status, page, limit | Commission calculations |
| POST   | `/api/commissions`                | 월별 수수료 계산 실행  | Admin | month (YYYY-MM)                    | Calculation results     |
| GET    | `/api/commissions/[commissionId]` | 수수료 상세 조회       | Admin | commissionId                       | Detailed calculation    |
| PUT    | `/api/commissions/[commissionId]` | 수수료 상태 업데이트   | Admin | commissionId + status              | Updated commission      |
| GET    | `/api/commissions/export`         | 수수료 데이터 내보내기 | Admin | month, format                      | Export file             |

---

### 5. **소속 관계 관리 (Relationship Management)**

**Base Path**: `/api/relationships`

| Method | Endpoint                              | Description      | Auth  | Input                                | Output               |
| ------ | ------------------------------------- | ---------------- | ----- | ------------------------------------ | -------------------- |
| GET    | `/api/relationships`                  | 소속 관계 목록   | Admin | shop_id, parent_id, active_only      | Relationship list    |
| POST   | `/api/relationships`                  | 새 관계 생성     | Admin | shop_owner_id, parent_id, started_at | Created relationship |
| PUT    | `/api/relationships/[relationshipId]` | 관계 수정        | Admin | relationshipId + update data         | Updated relationship |
| DELETE | `/api/relationships/[relationshipId]` | 관계 종료        | Admin | relationshipId                       | Success confirmation |
| GET    | `/api/relationships/tree`             | 조직도 트리 조회 | Admin | root_id, depth                       | Tree structure       |
| GET    | `/api/relationships/history`          | 관계 변경 이력   | Admin | shop_id, parent_id, page, limit      | History records      |

---

### 6. **임상 관리 (Clinical Management)**

**Base Path**: `/api/clinical`

| Method | Endpoint                       | Description         | Auth       | Input                             | Output           |
| ------ | ------------------------------ | ------------------- | ---------- | --------------------------------- | ---------------- |
| GET    | `/api/clinical/cases`          | 임상 케이스 목록    | Shop Owner | page, limit, status, subject_type | Clinical cases   |
| POST   | `/api/clinical/cases`          | 새 임상 케이스 생성 | Shop Owner | case details                      | Created case     |
| GET    | `/api/clinical/cases/[caseId]` | 임상 케이스 상세    | Shop Owner | caseId                            | Case with photos |
| PUT    | `/api/clinical/cases/[caseId]` | 케이스 정보 수정    | Shop Owner | caseId + updates                  | Updated case     |
| POST   | `/api/clinical/photos`         | 임상 사진 업로드    | Shop Owner | caseId, photos[], session_number  | Upload result    |
| POST   | `/api/clinical/consent`        | 동의서 업로드       | Shop Owner | caseId, consent_file              | Upload result    |

---

### 7. **KOL 대시보드 API**

**Base Path**: `/api/kol-new`

| Method | Endpoint                                           | Description               | Auth | Input                    | Output             |
| ------ | -------------------------------------------------- | ------------------------- | ---- | ------------------------ | ------------------ |
| GET    | `/api/kol-new/dashboard`                           | KOL 기본 대시보드         | KOL  | -                        | Dashboard data     |
| GET    | `/api/kol-new/dashboard-complete`                  | 통합 대시보드 (Xano 연동) | KOL  | -                        | Complete dashboard |
| GET    | `/api/kol-new/shops`                               | KOL 소속 전문점 목록      | KOL  | -                        | Shops list         |
| GET    | `/api/kol-new/monthly-sales`                       | 월별 매출 데이터          | KOL  | month                    | Sales data         |
| GET    | `/api/kol-new/sales-journal`                       | 영업일지                  | KOL  | page, limit              | Journal entries    |
| GET    | `/api/kol-new/notifications`                       | 알림 목록                 | KOL  | page, limit, read_status | Notifications      |
| POST   | `/api/kol-new/notifications/[notificationId]/read` | 알림 읽음 처리            | KOL  | notificationId           | Success            |

---

### 8. **Xano 통합 API** (레거시/통합)

**Base Path**: `/api/xano`

| Method | Endpoint                        | Description           | Auth | Input                                   | Output            |
| ------ | ------------------------------- | --------------------- | ---- | --------------------------------------- | ----------------- |
| GET    | `/api/xano/dashboard`           | Xano 대시보드 데이터  | -    | kol_id, period, dates                   | Dashboard metrics |
| GET    | `/api/xano/orders`              | Xano 주문 목록        | -    | page, limit, shop_id, commission_status | Orders from Xano  |
| POST   | `/api/xano/orders`              | Xano 주문 생성        | -    | order data                              | Created order     |
| GET    | `/api/xano/clinical-management` | Xano 임상 관리        | -    | filters                                 | Clinical data     |
| POST   | `/api/xano/clinical-management` | Xano 임상 케이스 생성 | -    | case data                               | Created case      |
| GET    | `/api/xano/crm-workflow`        | CRM 워크플로우        | -    | kol_id, stage, status                   | CRM cards         |
| POST   | `/api/xano/crm-workflow`        | CRM 카드 생성         | -    | card data                               | Created card      |

---

### 9. **프로필 관리 (Profile Management)**

**Base Path**: `/api/profiles`

| Method | Endpoint        | Description          | Auth | Input        | Output       |
| ------ | --------------- | -------------------- | ---- | ------------ | ------------ |
| GET    | `/api/profiles` | 프로필 목록 (제한적) | -    | status, role | Profile list |

---

### 10. **인증 API (Authentication)**

**Base Path**: `/api/auth`

| Method | Endpoint                 | Description      | Auth | Input | Output              |
| ------ | ------------------------ | ---------------- | ---- | ----- | ------------------- |
| GET    | `/api/auth/current-user` | 현재 사용자 정보 | User | -     | User profile        |
| POST   | `/api/auth/check-email`  | 이메일 중복 확인 | -    | email | Availability status |

---

## 🎯 Convex Migration Priority

### **High Priority** (Core Business Logic)

1. **User Management** - 사용자 관리 (5 endpoints)
2. **Order Management** - 주문 관리 (5 endpoints)
3. **Relationship Management** - 소속 관계 관리 (6 endpoints)
4. **KOL Dashboard** - KOL 대시보드 (7 endpoints)

### **Medium Priority** (Important Features)

5. **Device Sales** - 디바이스 판매 관리 (5 endpoints)
6. **Commission Management** - 수수료 관리 (5 endpoints)
7. **Clinical Management** - 임상 관리 (6 endpoints)

### **Low Priority** (Legacy/Integration)

8. **Xano Integration** - Xano 통합 API (7 endpoints)
9. **Profile/Auth** - 기타 API (3 endpoints)

---

## 🔄 Common Patterns

### **Pagination Pattern**

```typescript
// 쿼리 파라미터
{
  page?: number; // 기본: 1
  limit?: number; // 기본: 20, 최대: 100
}

// 응답 형식
{
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
}
```

### **Filter Pattern**

```typescript
// 공통 필터
{
  search?: string; // 이름, 이메일, 전문점명 검색
  status?: string; // 상태 필터
  role?: string; // 역할 필터
  date_from?: string; // 시작일 (YYYY-MM-DD)
  date_to?: string; // 종료일 (YYYY-MM-DD)
  sortBy?: string; // 정렬 필드
  sortOrder?: 'asc' | 'desc'; // 정렬 방향
}
```

### **Authentication Pattern**

```typescript
// 권한 체크 순서
1. 인증된 사용자인지 확인
2. 사용자 프로필 조회
3. 역할별 권한 확인 (admin, kol, shop_owner)
4. 리소스별 접근 권한 확인 (본인 데이터 등)
```

### **Error Response Pattern**

```typescript
{
  success: false;
  error: string;
  details?: string; // 개발 환경에서만
}
```

---

## 📝 Notes for Convex Implementation

### **Query Functions (읽기 전용)**

- 모든 GET 엔드포인트
- 페이지네이션, 필터링, 정렬 지원
- 사용자별 권한 필터링 적용

### **Mutation Functions (데이터 변경)**

- POST, PUT, DELETE 엔드포인트
- 트랜잭션 처리 필요한 복합 작업
- 수수료 계산, 소속 관계 변경 등

### **Action Functions (외부 서비스 연동)**

- 파일 업로드/다운로드
- 이메일 발송
- 외부 API 호출 (Xano 등)

### **특별 고려사항**

1. **수수료 계산 로직**: 복잡한 비즈니스 규칙 포함
2. **소속 관계 관리**: 계층형 데이터 구조 처리
3. **임상 사진 관리**: 파일 업로드/저장 처리
4. **실시간 알림**: 실시간 업데이트 필요
5. **데이터 내보내기**: 대용량 데이터 처리

이 카탈로그를 바탕으로 단계별로 Convex query/mutation 함수를 구현하겠습니다.
