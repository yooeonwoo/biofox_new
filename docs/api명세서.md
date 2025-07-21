## 📋 BIOFOX Admin API & Frontend 상세 명세서 (업데이트)

### 🏗️ 프로젝트 구조
```
biofox-admin/
├── app/
│   ├── biofox-admin/
│   │   ├── (auth)/
│   │   │   ├── login/          ✅ 완료
│   │   │   └── layout.tsx      ✅ 완료
│   │   ├── (dashboard)/
│   │   │   ├── users/          ✅ 완료
│   │   │   ├── relationships/  ✅ 완료
│   │   │   ├── orders/         🔄 다음 구현
│   │   │   ├── devices/
│   │   │   ├── commissions/
│   │   │   ├── clinical/
│   │   │   ├── reports/
│   │   │   └── layout.tsx      ✅ 완료
│   │   └── layout.tsx          ✅ 완료
│   ├── api/
│   │   ├── users/              ✅ 완료
│   │   ├── relationships/      ✅ 완료
│   │   ├── orders/             🔄 다음 구현
│   │   ├── devices/
│   │   ├── commissions/
│   │   ├── clinical/
│   │   └── reports/
├── components/
│   └── biofox-admin/
│       ├── users/              ✅ 완료
│       ├── relationships/      ✅ 완료
│       └── orders/             🔄 다음 구현
├── types/
│   └── biofox-admin/           ✅ 완료
└── utils/
    └── supabase/               ✅ 완료
```

---

## ✅ 구현 완료 기능

### 1. 사용자 관리 (✅ 완료)
- 고급 필터링 (상태, 역할, 검색, 날짜 범위)
- 일괄 작업 (승인, 거절, 역할 변경, 삭제)
- 사용자 상세 정보 모달
- 페이지네이션
- API: GET/POST `/api/users`, `/api/users/[userId]`, `/api/users/bulk-action`

### 2. 소속 관계 관리 (✅ 완료)
- 계층적 조직도 트리 뷰
- 드래그 앤 드롭으로 관계 변경
- 관계 변경 이력 조회
- 실시간 검색 및 하이라이트
- API: `/api/relationships`, `/api/relationships/tree`, `/api/relationships/history`

---

## 🔄 다음 구현: 주문/매출 관리

### API Layer

#### 3.1 주문 목록 조회
```typescript
GET /api/orders

// Query Parameters
{
  page: number              // 기본: 1
  limit: number            // 기본: 20, 최대: 100
  shop_id?: string         // 특정 샵 필터
  date_from?: string       // 시작 날짜 (YYYY-MM-DD)
  date_to?: string         // 종료 날짜
  status?: "pending" | "completed" | "cancelled" | "refunded"
  min_amount?: number      // 최소 금액
  max_amount?: number      // 최대 금액
  has_commission?: boolean // 수수료 여부
  is_self_shop?: boolean   // 본인샵 여부
  sortBy?: "order_date" | "total_amount" | "shop_name"
  sortOrder?: "asc" | "desc"
}

// Response
{
  data: [
    {
      id: string
      shop: {
        id: string
        name: string
        shop_name: string
        parent: {
          id: string
          name: string
          role: string
        } | null
      }
      order_date: string
      order_number: string | null
      items: [
        {
          id: string
          product_name: string
          quantity: number
          unit_price: number
          subtotal: number
        }
      ]
      total_amount: number
      commission: {
        rate: number
        amount: number
        status: string
      }
      is_self_shop_order: boolean
      status: string
      notes: string | null
      created_by: {
        id: string
        name: string
      }
      created_at: string
    }
  ]
  pagination: {...}
  summary: {
    total_sales: number
    total_commission: number
    order_count: number
  }
}
```

#### 3.2 주문 상세 조회
```typescript
GET /api/orders/:id

// Response (3.1과 동일한 구조의 단일 객체)
```

#### 3.3 주문 생성
```typescript
POST /api/orders

// Request Body
{
  shop_id: string
  order_date: string
  order_number?: string
  items: Array<{
    product_id?: string
    product_name: string
    quantity: number
    unit_price: number
  }>
  is_self_shop_order?: boolean
  notes?: string
}

// Response
{
  data: Order
}
```

#### 3.4 주문 수정
```typescript
PUT /api/orders/:id

// Request Body (3.3과 동일)
// Response (3.3과 동일)
```

#### 3.5 주문 삭제
```typescript
DELETE /api/orders/:id

// Response
{
  success: boolean
}
```

#### 3.6 주문 일괄 등록
```typescript
POST /api/orders/bulk-import

// Request Body
{
  file_type: "csv" | "excel"
  data: string  // base64 encoded
  options: {
    date_column: string
    shop_identifier_column: string  // email or shop_name
    amount_column: string
    product_column?: string
    quantity_column?: string
    skip_first_row: boolean
    date_format: string  // 예: "YYYY-MM-DD"
  }
}

// Response
{
  success: boolean
  summary: {
    total_rows: number
    success_count: number
    error_count: number
    total_amount: number
    total_commission: number
  }
  errors: [
    {
      row: number
      error: string
      data: object
    }
  ]
  preview?: Array<{  // 처음 5개 미리보기
    shop_name: string
    order_date: string
    total_amount: number
    commission_amount: number
  }>
}
```

#### 3.7 수수료 재계산
```typescript
POST /api/orders/recalculate-commission

// Request Body
{
  order_ids?: string[]  // 특정 주문들만
  shop_id?: string      // 특정 샵의 모든 주문
  date_from?: string    // 기간 지정
  date_to?: string
}

// Response
{
  success: boolean
  affected_count: number
  total_commission_before: number
  total_commission_after: number
  changes: Array<{
    order_id: string
    old_commission: number
    new_commission: number
  }>
}
```

### Frontend Components

#### OrderManagementPage
```typescript
// app/biofox-admin/(dashboard)/orders/page.tsx

주요 기능:
- 날짜 범위 필터 (프리셋: 오늘, 이번주, 이번달, 지난달, 사용자 정의)
- 고급 필터링 (샵, 상태, 금액 범위, 수수료 여부)
- 주문 목록 테이블
- 일괄 선택 및 삭제
- 엑셀/CSV 내보내기
- 일괄 등록 (드래그 앤 드롭 지원)
- 수수료 재계산
- 매출 요약 통계 카드
```

#### OrderFormModal
```typescript
// components/biofox-admin/orders/OrderFormModal.tsx

interface OrderFormModalProps {
  order?: Order  // 수정시
  open: boolean
  onClose: () => void
  onSubmit: (data: OrderFormData) => void
}

주요 기능:
- Shop 자동완성 검색 (소속 KOL/OL 정보 표시)
- 제품 추가/삭제 (동적 폼)
- 실시간 금액 계산
- 수수료 미리보기 (KOL/OL 자동 계산)
- 본인샵 자동 감지
- 날짜 선택기
```

#### BulkImportModal
```typescript
// components/biofox-admin/orders/BulkImportModal.tsx

interface BulkImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

주요 기능:
- 파일 드래그 앤 드롭
- CSV/Excel 파일 지원
- 컬럼 매핑 UI
- 데이터 미리보기 (처음 10행)
- 유효성 검사 결과 표시
- 진행률 표시
- 오류 상세 내역 다운로드
```

#### OrderSummaryCards
```typescript
// components/biofox-admin/orders/OrderSummaryCards.tsx

표시 정보:
- 선택 기간 총 매출
- 총 수수료
- 주문 건수
- 평균 주문 금액
- 전월 대비 성장률
- 활성 샵 수
```

---

## 📋 주요 요구사항 반영

### 1. 비즈니스 규칙
- **수수료 계산**: KOL 30%, OL 20% (관리자가 변경 가능)
- **본인샵 매출**: 별도 수수료 계산하여 다음달 환급
- **소속 관계 기반**: 주문 시점의 소속 관계로 수수료 계산
- **반품 처리**: 음수 금액 입력 가능

### 2. 사용성 개선
- **일괄 작업**: CSV/Excel 대량 등록 지원
- **날짜 프리셋**: 자주 사용하는 기간 빠른 선택
- **실시간 계산**: 입력 중 수수료 자동 계산
- **자동완성**: Shop 검색시 소속 정보도 함께 표시

### 3. 데이터 무결성
- **수수료 재계산**: 소속 관계 변경시 재계산 기능
- **감사 로그**: 주문 생성/수정/삭제 이력 기록
- **권한 체크**: 관리자만 주문 관리 가능

---

## 🚀 구현 우선순위

### Phase 1: 기본 주문 관리 (1일)
1. ✅ 주문 CRUD API
2. ✅ 주문 목록 페이지
3. ✅ 주문 입력 폼

### Phase 2: 일괄 처리 (1일)
1. ✅ CSV/Excel 일괄 등록
2. ✅ 수수료 재계산
3. ✅ 엑셀 내보내기

### Phase 3: 고급 기능 (반나절)
1. ✅ 매출 통계 대시보드
2. ✅ 고급 필터링
3. ✅ 감사 로그

---

## 💡 특별 고려사항

### 1. 성능 최적화
- 대량 데이터 처리시 페이징 필수
- 수수료 계산은 DB 레벨에서 처리
- 인덱스: shop_id + order_date 복합 인덱스

### 2. UX 개선
- 로딩 상태 명확히 표시
- 에러 메시지 구체적으로
- 성공 피드백 제공

### 3. 데이터 검증
- 날짜 유효성 (미래 날짜 불가)
- 금액 범위 체크
- Shop 존재 여부 확인

이제 주문/매출 관리 기능을 구현할 준비가 되었습니다!