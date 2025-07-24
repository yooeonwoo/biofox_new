# 📚 BioFox KOL Platform API Documentation

## 📋 개요

이 문서는 BioFox KOL 플랫폼의 모든 API 엔드포인트와 데이터 모델에 대한 포괄적인 기술 문서입니다. 플랫폼은 Convex 백엔드와 Next.js API 라우트의 하이브리드 아키텍처를 사용합니다.

## 🏗️ 아키텍처 개요

### 백엔드 시스템

- **Convex**: 실시간 데이터베이스 및 서버리스 함수
- **Next.js API Routes**: RESTful API 엔드포인트
- **Convex Auth**: 사용자 인증 및 권한 관리

### 인증 시스템

- **Convex Auth**: JWT 기반 인증
- **Role-based Access Control**: admin, kol, ol, shop_owner 역할
- **Session Management**: 자동 세션 갱신 및 만료 관리

---

## 📊 데이터 모델 (Convex Schema)

### 1. 핵심 사용자 관리

#### 1.1 Users (Convex Auth)

```typescript
// Convex Auth 자동 생성 테이블
users: {
  _id: Id<"users">,
  email: string,
  name: string,
  // 기타 Convex Auth 필드들...
}
```

#### 1.2 Profiles

사용자 프로필 및 비즈니스 정보를 관리하는 핵심 테이블

```typescript
profiles: {
  _id: Id<"profiles">,
  userId: Id<"users">,              // Convex Auth users 참조

  // 기본 정보
  email: string,                    // 이메일 주소
  name: string,                     // 사용자 이름

  // 역할 및 상태
  role: "admin" | "kol" | "ol" | "shop_owner",
  status: "pending" | "approved" | "rejected",

  // 매장 정보
  shop_name: string,                // 매장명
  region?: string,                  // 지역
  naver_place_link?: string,        // 네이버 플레이스 링크

  // 승인 관리
  approved_at?: number,             // 승인 일시
  approved_by?: Id<"profiles">,     // 승인자 ID

  // 수수료 및 관계 관리
  commission_rate?: number,         // 수수료율 (0.05 = 5%)
  total_subordinates?: number,      // 총 하위 매장 수
  active_subordinates?: number,     // 활성 하위 매장 수

  // 메타데이터 및 시스템 필드
  metadata?: any,                   // 추가 정보 (JSON)
  created_at: number,               // 생성 일시 (Unix timestamp)
  updated_at: number,               // 수정 일시 (Unix timestamp)
}
```

**인덱스:**

- `by_userId`: 사용자별 조회
- `by_email`: 이메일별 조회
- `by_role`: 역할별 조회
- `by_status`: 상태별 조회
- `by_role_status`: 역할+상태 복합 조회
- `by_region`: 지역별 조회
- `by_created_at`: 생성일순 정렬
- `by_updated_at`: 수정일순 정렬

### 2. 매장 관계 관리

#### 2.1 Shop Relationships

KOL과 매장 오너 간의 계층적 관계를 관리

```typescript
shop_relationships: {
  _id: Id<"shop_relationships">,
  shop_owner_id: Id<"profiles">,    // 매장 오너 ID
  parent_id?: Id<"profiles">,       // 상위 KOL ID

  // 관계 정보
  started_at: number,               // 관계 시작일
  ended_at?: number,                // 관계 종료일
  is_active: boolean,               // 활성 상태
  relationship_type?: "direct" | "transferred" | "temporary",

  // 추가 정보
  notes?: string,                   // 관계 메모
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by?: Id<"profiles">,      // 생성자 ID
}
```

**인덱스:**

- `by_shop_owner`: 매장 오너별 조회
- `by_parent`: 상위 KOL별 조회
- `by_parent_active`: 상위 KOL + 활성 상태
- `by_shop_active`: 매장 오너 + 활성 상태
- `by_relationship_type`: 관계 타입별 조회

### 3. 상품 관리

#### 3.1 Products

상품 정보 및 수수료 설정 관리

```typescript
products: {
  _id: Id<"products">,
  name: string,                     // 상품명
  code?: string,                    // 상품 코드

  // 분류 및 가격
  category?: "skincare" | "device" | "supplement" | "cosmetic" | "accessory",
  price: number,                    // 판매 가격

  // 상태 및 표시 설정
  is_active: boolean,               // 활성 상태
  is_featured?: boolean,            // 추천 상품 여부
  sort_order?: number,              // 정렬 순서

  // 상품 정보
  description?: string,             // 상품 설명
  specifications?: any,             // 상품 사양 (JSON)
  images?: string[],                // 이미지 URL 배열

  // 수수료 설정
  default_commission_rate?: number, // 기본 수수료율
  min_commission_rate?: number,     // 최소 수수료율
  max_commission_rate?: number,     // 최대 수수료율

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by?: Id<"profiles">,      // 생성자 ID
}
```

**인덱스:**

- `by_category`: 카테고리별 조회
- `by_active`: 활성 상품만 조회
- `by_featured`: 추천 상품 조회
- `by_category_active`: 카테고리 + 활성 상태
- `by_price`: 가격순 정렬
- `by_sort_order`: 정렬 순서

### 4. 주문 관리

#### 4.1 Orders

주문 정보 및 수수료 계산 관리

```typescript
orders: {
  _id: Id<"orders">,
  shop_id: Id<"profiles">,          // 매장 ID

  // 주문 기본 정보
  order_date: number,               // 주문 일시
  order_number?: string,            // 주문 번호
  total_amount: number,             // 총 주문 금액

  // 수수료 정보
  commission_rate?: number,         // 적용된 수수료율
  commission_amount?: number,       // 수수료 금액
  commission_status?: "calculated" | "adjusted" | "paid" | "cancelled",

  // 주문 상태
  order_status?: "pending" | "completed" | "cancelled" | "refunded",

  // 추가 정보
  is_self_shop_order?: boolean,     // 자체 매장 주문 여부
  notes?: string,                   // 주문 메모
  metadata?: any,                   // 주문 메타데이터 (JSON)

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by: Id<"profiles">,       // 생성자 ID
}
```

**인덱스:**

- `by_shop`: 매장별 조회
- `by_date`: 날짜별 조회
- `by_status`: 주문 상태별 조회
- `by_commission_status`: 수수료 상태별 조회
- `by_shop_date`: 매장 + 날짜 복합 조회
- `by_total_amount`: 금액순 정렬

#### 4.2 Order Items

주문 상품 세부 정보

```typescript
order_items: {
  _id: Id<"order_items">,
  order_id: Id<"orders">,           // 주문 ID
  product_id?: Id<"products">,      // 상품 ID

  // 상품 정보
  product_name: string,             // 상품명
  product_code?: string,            // 상품 코드
  quantity: number,                 // 수량
  unit_price: number,               // 단가
  subtotal: number,                 // 소계

  // 수수료 정보
  item_commission_rate?: number,    // 상품별 수수료율
  item_commission_amount?: number,  // 상품별 수수료 금액

  created_at: number,               // 생성 일시
}
```

### 5. 디바이스 판매 관리

#### 5.1 Device Sales

디바이스 판매 및 티어 관리

```typescript
device_sales: {
  _id: Id<"device_sales">,
  shop_id: Id<"profiles">,          // 매장 ID

  // 판매 정보
  sale_date: number,                // 판매 일시
  device_name?: string,             // 디바이스명
  quantity: number,                 // 판매 수량

  // 티어 및 수수료
  tier_at_sale: "tier_1_4" | "tier_5_plus", // 판매 시점 티어
  standard_commission: number,      // 표준 수수료
  actual_commission: number,        // 실제 수수료
  commission_status?: "calculated" | "adjusted" | "paid" | "cancelled",

  // 추가 정보
  notes?: string,                   // 메모
  serial_numbers?: string[],        // 시리얼 번호 배열

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by: Id<"profiles">,       // 생성자 ID
}
```

#### 5.2 KOL Device Accumulator

KOL별 디바이스 판매 누적 현황

```typescript
kol_device_accumulator: {
  _id: Id<"kol_device_accumulator">,
  kol_id: Id<"profiles">,           // KOL ID

  // 누적 통계
  total_devices_sold: number,       // 총 판매 수량
  total_devices_returned: number,   // 총 반품 수량
  net_devices_sold: number,         // 순 판매 수량

  // 티어 정보
  current_tier: "tier_1_4" | "tier_5_plus", // 현재 티어
  tier_1_4_count?: number,          // 1-4대 티어 카운트
  tier_5_plus_count?: number,       // 5대 이상 티어 카운트
  tier_changed_at?: number,         // 티어 변경 일시

  // 시스템 필드
  last_updated: number,             // 마지막 업데이트
  created_at: number,               // 생성 일시
}
```

### 6. CRM 관리

#### 6.1 CRM Cards

10단계 CRM 관리 시스템

```typescript
crm_cards: {
  _id: Id<"crm_cards">,
  kol_id: Id<"profiles">,           // KOL ID
  shop_id: Id<"profiles">,          // 매장 ID

  // 10단계 상태 관리
  stage_1_status?: boolean,         // 1단계 완료 여부
  stage_1_completed_at?: number,    // 1단계 완료 일시
  // ... stage_2 ~ stage_10 동일 패턴

  // 설치 정보
  installation_date?: number,       // 설치일
  installation_manager?: string,    // 설치 담당자
  installation_contact?: string,    // 설치 연락처

  // Q1-Q6 질문 답변
  q1_cleobios?: "Y" | "N",         // Q1: 클레오바이오스 사용
  q2_instasure?: "Y" | "N",        // Q2: 인스타슈어 사용
  q3_proper_procedure?: "Y" | "N",  // Q3: 적절한 절차 준수
  q4_progress_check?: "Y" | "N",    // Q4: 진행 상황 체크
  q5_feedback_need?: "상" | "중" | "하", // Q5: 피드백 필요도
  q6_management?: "상" | "중" | "하",    // Q6: 관리 수준

  // 메타데이터
  priority_level?: "high" | "normal" | "low", // 우선순위
  notes?: string,                   // 메모
  tags?: string[],                  // 태그 배열
  total_clinical_cases?: number,    // 총 임상 케이스 수
  active_clinical_cases?: number,   // 활성 임상 케이스 수
  last_activity_at?: number,        // 마지막 활동 일시

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by?: Id<"profiles">,      // 생성자 ID
}
```

#### 6.2 Self Growth Cards

자체 성장 관리 카드

```typescript
self_growth_cards: {
  _id: Id<"self_growth_cards">,
  shop_id: Id<"profiles">,          // 매장 ID
  crm_card_id?: Id<"crm_cards">,    // 연관 CRM 카드 ID

  // 설치 정보
  installation_date?: number,       // 설치일
  installation_manager?: string,    // 설치 담당자
  installation_contact?: string,    // 설치 연락처

  // Q1-Q4 질문과 완료 시간
  q1_cleobios?: "Y" | "N",         // Q1 답변
  q1_completed_at?: number,         // Q1 완료 일시
  // ... q2, q3, q4 동일 패턴

  // 교육 상태
  company_training_status?: "not_started" | "applied" | "in_progress" | "completed" | "cancelled",
  company_training_applied_at?: number,  // 교육 신청일
  company_training_completed_at?: number, // 교육 완료일

  // 목표 및 평가
  monthly_goals?: any,              // 월간 목표 (JSON)
  self_evaluation?: any,            // 자체 평가 (JSON)
  improvement_plans?: string[],     // 개선 계획 배열
  self_notes?: string,              // 자체 메모
  private_data?: any,               // 개인 데이터 (JSON)

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
}
```

### 7. 임상 관리

#### 7.1 Clinical Cases

임상 케이스 관리

```typescript
clinical_cases: {
  _id: Id<"clinical_cases">,
  shop_id: Id<"profiles">,          // 매장 ID

  // 대상자 정보
  subject_type: "self" | "customer", // 대상자 유형
  name: string,                     // 이름
  gender?: "male" | "female" | "other", // 성별
  age?: number,                     // 나이

  // 케이스 정보
  status: "in_progress" | "completed" | "paused" | "cancelled",
  treatment_item?: string,          // 치료 항목
  start_date?: number,              // 시작일
  end_date?: number,                // 종료일
  total_sessions?: number,          // 총 세션 수

  // 동의서 관리
  consent_status: "no_consent" | "consented" | "pending",
  consent_date?: number,            // 동의일
  marketing_consent?: boolean,      // 마케팅 동의 여부

  // 추가 정보
  notes?: string,                   // 메모
  tags?: string[],                  // 태그 배열
  custom_fields?: any,              // 커스텀 필드 (JSON)
  photo_count?: number,             // 사진 수
  latest_session?: number,          // 최근 세션 번호

  // 시스템 필드
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
  created_by?: Id<"profiles">,      // 생성자 ID
}
```

#### 7.2 Clinical Photos

임상 세션별 사진 관리

```typescript
clinical_photos: {
  _id: Id<"clinical_photos">,
  clinical_case_id: Id<"clinical_cases">, // 임상 케이스 ID

  // 사진 정보
  session_number: number,           // 세션 번호
  photo_type: "front" | "left_side" | "right_side", // 사진 타입
  file_path: string,                // 파일 경로
  file_size?: number,               // 파일 크기
  metadata?: any,                   // 메타데이터 (JSON)

  // 시스템 필드
  upload_date: number,              // 업로드 일시
  created_at: number,               // 생성 일시
  uploaded_by?: Id<"profiles">,     // 업로더 ID
}
```

#### 7.3 Consent Files

동의서 파일 관리

```typescript
consent_files: {
  _id: Id<"consent_files">,
  clinical_case_id: Id<"clinical_cases">, // 임상 케이스 ID

  // 파일 정보
  file_path: string,                // 파일 경로
  file_name: string,                // 파일명
  file_size?: number,               // 파일 크기
  file_type?: string,               // 파일 타입
  metadata?: any,                   // 메타데이터 (JSON)

  // 시스템 필드
  upload_date: number,              // 업로드 일시
  created_at: number,               // 생성 일시
  uploaded_by?: Id<"profiles">,     // 업로더 ID
}
```

### 8. 수수료 관리

#### 8.1 Commission Calculations

월별 수수료 계산서

```typescript
commission_calculations: {
  _id: Id<"commission_calculations">,
  kol_id: Id<"profiles">,           // KOL ID
  calculation_month: number,        // 계산 월 (월초 날짜)

  // 하위 매장 정보
  subordinate_shop_count?: number,  // 하위 매장 수
  active_shop_count?: number,       // 활성 매장 수
  subordinate_sales?: number,       // 하위 매장 매출
  subordinate_commission?: number,  // 하위 매장 수수료

  // 자체 매장 정보
  self_shop_sales?: number,         // 자체 매장 매출
  self_shop_commission?: number,    // 자체 매장 수수료

  // 디바이스 수수료
  device_count?: number,            // 디바이스 판매 수
  device_commission?: number,       // 디바이스 수수료

  // 수동 조정
  manual_adjustment?: number,       // 수동 조정 금액
  adjustment_reason?: string,       // 조정 사유

  // 최종 정보
  total_commission: number,         // 총 수수료
  status?: "calculated" | "reviewed" | "approved" | "paid" | "cancelled",
  payment_date?: number,            // 지급일
  payment_reference?: string,       // 지급 참조번호

  // 세부 정보
  calculation_details?: any,        // 계산 세부사항 (JSON)
  notes?: string,                   // 메모

  // 시스템 필드
  calculated_at: number,            // 계산일
  paid_at?: number,                 // 지급일
  created_by?: Id<"profiles">,      // 생성자 ID
  updated_by?: Id<"profiles">,      // 수정자 ID
  created_at: number,               // 생성 일시
  updated_at: number,               // 수정 일시
}
```

### 9. 알림 시스템

#### 9.1 Notifications

시스템 알림 관리

```typescript
notifications: {
  _id: Id<"notifications">,
  user_id: Id<"profiles">,          // 수신자 ID

  // 알림 분류
  type: "system" | "crm_update" | "order_created" | "commission_paid" |
        "clinical_progress" | "approval_required" | "status_changed" | "reminder",

  // 알림 내용
  title: string,                    // 제목
  message: string,                  // 메시지

  // 연관 정보
  related_type?: string,            // 연관 타입
  related_id?: string,              // 연관 ID
  action_url?: string,              // 액션 URL

  // 상태 관리
  is_read?: boolean,                // 읽음 여부
  read_at?: number,                 // 읽은 일시
  is_archived?: boolean,            // 보관 여부
  archived_at?: number,             // 보관 일시

  // 우선순위 및 메타데이터
  priority?: "low" | "normal" | "high" | "urgent",
  metadata?: any,                   // 추가 정보 (JSON)

  // 시스템 필드
  created_at: number,               // 생성 일시
  expires_at?: number,              // 만료 일시
}
```

### 10. 감사 및 로깅

#### 10.1 Audit Logs

변경 사항 추적 로그

```typescript
audit_logs: {
  _id: Id<"audit_logs">,

  // 변경 대상
  table_name: string,               // 테이블명
  record_id: string,                // 레코드 ID
  action: "INSERT" | "UPDATE" | "DELETE", // 액션

  // 사용자 정보
  user_id?: Id<"profiles">,         // 사용자 ID
  user_role?: string,               // 사용자 역할
  user_ip?: string,                 // 사용자 IP

  // 변경 내용
  old_values?: any,                 // 이전 값 (JSON)
  new_values?: any,                 // 새로운 값 (JSON)
  changed_fields?: string[],        // 변경된 필드 배열

  // 추가 정보
  metadata?: any,                   // 메타데이터 (JSON)
  created_at: number,               // 생성 일시
}
```

#### 10.2 File Metadata

파일 정보 관리

```typescript
file_metadata: {
  _id: Id<"file_metadata">,

  // 파일 위치
  bucket_name: string,              // 버킷명
  file_path: string,                // 파일 경로
  file_name: string,                // 파일명

  // 파일 정보
  file_size?: number,               // 파일 크기
  mime_type?: string,               // MIME 타입
  metadata?: any,                   // 메타데이터 (JSON)

  // 업로드 정보
  uploaded_by?: Id<"profiles">,     // 업로더 ID
  created_at: number,               // 업로드 일시
}
```

---

## 🔧 Convex Functions API

### 1. 인증 관련 함수 (auth.ts)

#### 1.1 ensureUserProfile

```typescript
// 사용자 프로필 자동 생성/업데이트
ensureUserProfile(args: {
  userId: Id<"users">,
  email: string,
  name: string,
  role?: "admin" | "kol" | "ol" | "shop_owner",
  shop_name?: string,
  region?: string,
  commission_rate?: number,
}): Promise<Id<"profiles">>
```

#### 1.2 getProfileCompleteness

```typescript
// 프로필 완성도 계산
getProfileCompleteness(args: {
  userId: Id<"users">
}): Promise<{
  isComplete: boolean,
  completionPercentage: number,
  missingFields: string[]
}>
```

### 2. 프로필 관리 함수 (profiles.ts)

#### 2.1 Query Functions

```typescript
// 모든 프로필 조회
getAllProfiles(): Promise<Profile[]>

// ID로 프로필 조회
getProfileById(args: { profileId: Id<"profiles"> }): Promise<Profile | null>

// 역할별 프로필 조회
getProfilesByRole(args: {
  role: "admin" | "kol" | "ol" | "shop_owner"
}): Promise<Profile[]>

// 승인 대기 프로필 조회
getPendingProfiles(): Promise<Profile[]>
```

#### 2.2 Mutation Functions

```typescript
// 프로필 생성
createProfile(args: CreateProfileArgs): Promise<Id<"profiles">>

// 프로필 업데이트
updateProfile(args: {
  profileId: Id<"profiles">,
  updates: Partial<Profile>
}): Promise<void>

// 프로필 승인/거절
approveProfile(args: {
  profileId: Id<"profiles">,
  approved: boolean,
  approvedBy: Id<"profiles">,
  commission_rate?: number
}): Promise<{ success: boolean }>

// 프로필 삭제
deleteProfile(args: { profileId: Id<"profiles"> }): Promise<void>
```

### 3. 주문 관리 함수 (orders.ts)

#### 3.1 Query Functions

```typescript
// 매장별 주문 조회
getOrdersByShop(args: {
  shopId: Id<"profiles">,
  limit?: number,
  cursor?: string
}): Promise<{ orders: Order[], cursor: string | null }>

// 주문 상세 조회
getOrderById(args: { orderId: Id<"orders"> }): Promise<Order | null>

// 날짜별 주문 조회
getOrdersByDateRange(args: {
  startDate: number,
  endDate: number,
  shopId?: Id<"profiles">
}): Promise<Order[]>
```

#### 3.2 Mutation Functions

```typescript
// 주문 생성
createOrder(args: CreateOrderArgs): Promise<Id<"orders">>

// 주문 상태 업데이트
updateOrderStatus(args: {
  orderId: Id<"orders">,
  status: "pending" | "completed" | "cancelled" | "refunded"
}): Promise<void>

// 수수료 상태 업데이트
updateCommissionStatus(args: {
  orderId: Id<"orders">,
  commissionStatus: "calculated" | "adjusted" | "paid" | "cancelled",
  commissionAmount?: number
}): Promise<void>
```

### 4. 관계 관리 함수 (relationships.ts)

#### 4.1 Query Functions

```typescript
// KOL의 하위 매장 조회
getSubordinateShops(args: {
  kolId: Id<"profiles">,
  activeOnly?: boolean
}): Promise<ShopRelationship[]>

// 매장의 상위 KOL 조회
getParentKOL(args: {
  shopId: Id<"profiles">
}): Promise<ShopRelationship | null>

// 관계 히스토리 조회
getRelationshipHistory(args: {
  shopId: Id<"profiles">
}): Promise<ShopRelationship[]>
```

#### 4.2 Mutation Functions

```typescript
// 관계 생성
createRelationship(args: {
  shopOwnerId: Id<"profiles">,
  parentId: Id<"profiles">,
  relationshipType?: "direct" | "transferred" | "temporary",
  notes?: string
}): Promise<Id<"shop_relationships">>

// 관계 비활성화
deactivateRelationship(args: {
  relationshipId: Id<"shop_relationships">
}): Promise<void>

// 관계 이전
transferRelationship(args: {
  shopOwnerId: Id<"profiles">,
  newParentId: Id<"profiles">,
  reason?: string
}): Promise<Id<"shop_relationships">>
```

### 5. 알림 함수 (notifications.ts)

#### 5.1 Query Functions

```typescript
// 사용자 알림 조회
getUserNotifications(args: {
  userId: Id<"profiles">,
  unreadOnly?: boolean,
  limit?: number
}): Promise<Notification[]>

// 알림 통계
getNotificationStats(args: {
  userId: Id<"profiles">
}): Promise<{
  total: number,
  unread: number,
  byType: Record<string, number>
}>
```

#### 5.2 Mutation Functions

```typescript
// 알림 생성
createNotification(args: {
  userId: Id<"profiles">,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: string,
  priority?: "low" | "normal" | "high" | "urgent"
}): Promise<Id<"notifications">>

// 알림 읽음 처리
markAsRead(args: {
  notificationId: Id<"notifications">
}): Promise<void>

// 모든 알림 읽음 처리
markAllAsRead(args: {
  userId: Id<"profiles">
}): Promise<void>
```

---

## 🌐 Next.js API Routes

### 1. 인증 API (`/api/auth/`)

#### 1.1 Current User

```
GET /api/auth/current-user
```

**Description**: 현재 로그인한 사용자 정보 조회

**Response**:

```typescript
{
  user: {
    id: string,
    email: string,
    name: string,
    profile?: Profile
  } | null
}
```

#### 1.2 Check Email

```
POST /api/auth/check-email
```

**Description**: 이메일 가입 가능 여부 확인

**Request Body**:

```typescript
{
  email: string;
}
```

**Response**:

```typescript
{
  available: boolean,
  message: string
}
```

### 2. 관리자 API (`/api/admin/`)

#### 2.1 Dashboard Stats

```
GET /api/admin/dashboard-stats
```

**Description**: 관리자 대시보드 통계 조회

**Response**:

```typescript
{
  stats: {
    totalUsers: number,
    pendingApprovals: number,
    totalOrders: number,
    totalCommission: number,
    activeShops: number,
    monthlyGrowth: number
  }
}
```

#### 2.2 Users Management

```
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/[id]
DELETE /api/admin/users/[id]
```

**GET Response**:

```typescript
{
  users: Profile[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

#### 2.3 Recent Activities

```
GET /api/admin/recent-activities
```

**Description**: 최근 활동 내역 조회

**Response**:

```typescript
{
  activities: {
    id: string,
    type: string,
    description: string,
    userId: string,
    userName: string,
    timestamp: number
  }[]
}
```

### 3. 프로필 API (`/api/profiles/`)

```
GET /api/profiles
POST /api/profiles
PUT /api/profiles/[id]
DELETE /api/profiles/[id]
```

### 4. 주문 API (`/api/orders/`)

```
GET /api/orders
POST /api/orders
PUT /api/orders/[id]
DELETE /api/orders/[id]
```

### 5. 관계 관리 API (`/api/relationships/`)

```
GET /api/relationships
POST /api/relationships
PUT /api/relationships/[id]
DELETE /api/relationships/[id]
```

### 6. 임상 관리 API (`/api/clinical/`)

#### 6.1 Cases

```
GET /api/clinical/cases
POST /api/clinical/cases
PUT /api/clinical/cases/[id]
DELETE /api/clinical/cases/[id]
```

#### 6.2 Photos

```
POST /api/clinical/photos
GET /api/clinical/photos/[caseId]
DELETE /api/clinical/photos/[photoId]
```

#### 6.3 Consent

```
POST /api/clinical/consent
GET /api/clinical/consent/[caseId]
```

---

## ❌ 에러 코드 및 응답 형식

### HTTP 상태 코드

| 코드 | 의미                  | 설명             |
| ---- | --------------------- | ---------------- |
| 200  | OK                    | 요청 성공        |
| 201  | Created               | 리소스 생성 성공 |
| 400  | Bad Request           | 잘못된 요청      |
| 401  | Unauthorized          | 인증 필요        |
| 403  | Forbidden             | 권한 없음        |
| 404  | Not Found             | 리소스 없음      |
| 409  | Conflict              | 리소스 충돌      |
| 422  | Unprocessable Entity  | 유효성 검사 실패 |
| 500  | Internal Server Error | 서버 오류        |

### 에러 응답 형식

```typescript
{
  error: {
    code: string,           // 에러 코드
    message: string,        // 에러 메시지
    details?: any,          // 상세 정보
    field?: string,         // 관련 필드 (유효성 검사 오류 시)
    timestamp: number       // 오류 발생 시간
  }
}
```

### 공통 에러 코드

| 코드                 | 메시지                        | 설명                  |
| -------------------- | ----------------------------- | --------------------- |
| `INVALID_REQUEST`    | Invalid request parameters    | 잘못된 요청 파라미터  |
| `UNAUTHORIZED`       | Authentication required       | 인증이 필요함         |
| `FORBIDDEN`          | Insufficient permissions      | 권한이 부족함         |
| `NOT_FOUND`          | Resource not found            | 리소스를 찾을 수 없음 |
| `DUPLICATE_EMAIL`    | Email already exists          | 이메일이 이미 존재함  |
| `INVALID_ROLE`       | Invalid user role             | 잘못된 사용자 역할    |
| `PROFILE_INCOMPLETE` | Profile is incomplete         | 프로필이 불완전함     |
| `VALIDATION_ERROR`   | Validation failed             | 유효성 검사 실패      |
| `COMMISSION_ERROR`   | Commission calculation error  | 수수료 계산 오류      |
| `RELATIONSHIP_ERROR` | Relationship management error | 관계 관리 오류        |

### 성공 응답 형식

```typescript
{
  success: true,
  data: any,              // 응답 데이터
  message?: string,       // 성공 메시지
  timestamp: number       // 응답 시간
}
```

---

## 🔐 인증 및 권한

### 인증 방식

- **JWT Token**: HTTP Authorization 헤더 또는 쿠키를 통한 전송
- **Session**: Convex Auth 세션 관리
- **Role-based**: 역할 기반 접근 제어

### 권한 레벨

| 역할         | 권한      | 접근 가능 API                  |
| ------------ | --------- | ------------------------------ |
| `admin`      | 전체 관리 | 모든 API 엔드포인트            |
| `kol`        | KOL 관리  | 자신의 하위 매장, 수수료, CRM  |
| `ol`         | 매장 관리 | 자신의 매장, 주문, 임상 케이스 |
| `shop_owner` | 매장 운영 | 자신의 주문, 임상 케이스       |

### 인증 헤더 형식

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📱 실시간 기능

### Convex Subscriptions

실시간 데이터 동기화를 위한 구독 기능

```typescript
// 실시간 알림 구독
const notifications = useQuery(api.notifications.getUserNotifications, {
  userId: currentUser.id,
});

// 실시간 주문 상태 구독
const orders = useQuery(api.orders.getOrdersByShop, {
  shopId: currentShop.id,
});
```

### WebSocket 연결

- **자동 재연결**: 네트워크 오류 시 자동 재연결
- **실시간 업데이트**: 데이터 변경 시 즉시 반영
- **오프라인 지원**: 오프라인 상태에서도 기본 기능 제공

---

## 🚀 성능 최적화

### 데이터베이스 인덱스

- **복합 인덱스**: 자주 사용되는 쿼리 조합에 대한 최적화
- **부분 인덱스**: 조건부 인덱스로 저장 공간 최적화
- **정렬 인덱스**: 정렬이 필요한 쿼리 최적화

### 캐싱 전략

- **Query Result Caching**: Convex 자동 쿼리 결과 캐싱
- **CDN Caching**: 정적 리소스 CDN 캐싱
- **Memory Caching**: 자주 사용되는 데이터 메모리 캐싱

### 페이지네이션

```typescript
// 커서 기반 페이지네이션
{
  data: T[],
  cursor: string | null,
  hasMore: boolean
}
```

---

## 📊 모니터링 및 로깅

### 감사 로그

- **자동 추적**: 모든 데이터 변경 사항 자동 기록
- **사용자 추적**: 변경한 사용자 및 IP 주소 기록
- **변경 내용**: 이전 값과 새로운 값 비교 저장

### 성능 모니터링

- **쿼리 성능**: 느린 쿼리 자동 감지
- **API 응답 시간**: 엔드포인트별 응답 시간 추적
- **에러 추적**: 에러 발생률 및 패턴 분석

---

이 문서는 BioFox KOL 플랫폼의 모든 API 엔드포인트와 데이터 모델에 대한 완전한 참조 가이드입니다. 각 API의 구체적인 사용 예제와 추가 세부사항은 해당 섹션의 개별 문서를 참조하시기 바랍니다.
