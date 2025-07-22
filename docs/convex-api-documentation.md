# Convex API Documentation

BioFox KOL 플랫폼의 Convex API 함수들에 대한 개발자 문서입니다.

## 목차

1. [개요](#개요)
2. [공통 유틸리티](#공통-유틸리티)
3. [사용자 관리 API](#사용자-관리-api)
4. [주문 관리 API](#주문-관리-api)
5. [에러 처리](#에러-처리)
6. [인증 및 권한](#인증-및-권한)
7. [사용 예제](#사용-예제)

## 개요

본 문서는 기존 REST API를 Convex Query/Mutation 함수로 마이그레이션한 결과를 설명합니다. 모든 함수는 타입 안전성, 실시간 업데이트, 강력한 에러 처리를 제공합니다.

### 주요 특징

- **타입 안전성**: Convex의 강력한 타입 시스템 활용
- **실시간 업데이트**: 데이터 변경 시 자동 리렌더링
- **체계적인 에러 처리**: 구조화된 에러 코드와 메시지
- **권한 기반 접근 제어**: 역할별 API 접근 권한 관리
- **자동 감사 로그**: 모든 데이터 변경 추적
- **알림 시스템**: 중요한 이벤트 자동 알림

## 공통 유틸리티

### `convex/utils.ts`

모든 API 함수에서 사용하는 공통 유틸리티 함수들입니다.

#### 권한 확인 함수

```typescript
// 현재 사용자 조회 및 인증 확인
await getCurrentUser(ctx);

// 관리자 권한 필수
await requireAdmin(ctx);

// 특정 역할 권한 확인
await requireRole(ctx, ['admin', 'kol']);
```

#### 검증 함수

```typescript
// 이메일 형식 검증
validateEmail(email: string): boolean

// 수수료율 검증 (0-1 범위)
validateCommissionRate(rate: number): void

// 문자열 길이 검증
validateStringLength(value: string, min?: number, max?: number, fieldName?: string): void

// 날짜 범위 검증
validateDateRange(fromDate?: string, toDate?: string): void
```

#### 헬퍼 함수

```typescript
// 감사 로그 생성
await createAuditLog(ctx, {
  tableName: string,
  recordId: any,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  userId: any,
  userRole: string,
  oldValues?: any,
  newValues?: any,
  changedFields?: string[],
  metadata?: any
})

// 알림 생성
await createNotification(ctx, {
  userId: any,
  type: string,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: any,
  priority?: 'low' | 'normal' | 'high'
})
```

## 사용자 관리 API

### Query Functions

#### `listUsers`

사용자 목록을 페이지네이션과 필터링을 지원하며 조회합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  paginationOpts: PaginationOpts,  // 페이지네이션 설정
  search?: string,                 // 검색어 (이름, 이메일, 전문점명)
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner',  // 역할 필터
  status?: 'pending' | 'approved' | 'rejected',  // 상태 필터
  createdFrom?: string,            // 시작 날짜 (ISO string)
  createdTo?: string,              // 종료 날짜 (ISO string)
  sortBy?: 'created_at' | 'name' | 'email' | 'status',  // 정렬 기준
  sortOrder?: 'asc' | 'desc'       // 정렬 순서
}
```

**응답**:

```typescript
{
  page: Array<{
    id: string,
    userId: string,
    email: string,
    name: string,
    role: string,
    status: string,
    shop_name?: string,
    region?: string,
    commission_rate?: number,
    total_subordinates: number,
    active_subordinates: number,
    naver_place_link?: string,
    approved_at?: number,
    created_at: number,
    updated_at: number
  }>,
  isDone: boolean,
  continueCursor?: string
}
```

**사용 예제**:

```typescript
// 기본 사용법
const users = await convex.query('users:listUsers', {
  paginationOpts: { numItems: 10 },
});

// 필터링 및 검색
const kolUsers = await convex.query('users:listUsers', {
  paginationOpts: { numItems: 20 },
  role: 'kol',
  status: 'approved',
  search: '홍길동',
});
```

#### `getUserById`

특정 사용자의 상세 정보를 조회합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userId: Id<'profiles'>; // 조회할 사용자 ID
}
```

**응답**: `listUsers`와 동일하지만 단일 객체, `metadata` 필드 추가

#### `searchUsers`

자동완성을 위한 사용자 검색 기능입니다.

**권한**: 인증된 사용자

**매개변수**:

```typescript
{
  searchTerm: string,              // 검색어 (최소 2자)
  limit?: number,                  // 결과 개수 (기본 10개, 최대 50개)
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner'  // 역할 필터
}
```

#### `getUserStats`

대시보드용 사용자 통계를 조회합니다.

**권한**: 관리자 전용

**매개변수**: 없음

**응답**:

```typescript
{
  total: number,
  byStatus: {
    pending: number,
    approved: number,
    rejected: number
  },
  byRole: {
    admin: number,
    kol: number,
    ol: number,
    shop_owner: number
  },
  recentSignups: number  // 최근 7일간 가입자 수
}
```

#### `getUserRelationships`

사용자의 조직 관계(상하위 매장)를 조회합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userId: Id<'profiles'>;
}
```

**응답**:

```typescript
{
  user: UserBasicInfo,
  parents: Array<UserWithRelationship>,
  children: Array<UserWithRelationship>,
  totalSubordinates: number,
  activeSubordinates: number
}
```

#### `getUsersByRole`

특정 역할의 사용자 목록을 조회합니다. (드롭다운, 선택 UI용)

**권한**: 인증된 사용자

**매개변수**:

```typescript
{
  role: 'admin' | 'kol' | 'ol' | 'shop_owner',
  status?: 'pending' | 'approved' | 'rejected',  // 기본값: 'approved'
  limit?: number  // 기본값: 100, 최대: 500
}
```

### Mutation Functions

#### `updateUser`

사용자 정보를 수정합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userId: Id<'profiles'>,
  updates: {
    name?: string,           // 이름 (2-50자)
    email?: string,          // 이메일 (형식 검증, 중복 확인)
    role?: 'admin' | 'kol' | 'ol' | 'shop_owner',
    status?: 'pending' | 'approved' | 'rejected',
    shop_name?: string,      // 전문점명 (2-100자)
    region?: string,
    naver_place_link?: string,
    commission_rate?: number,  // 수수료율 (0-1 범위)
    metadata?: any
  }
}
```

**응답**:

```typescript
{
  success: boolean,
  userId: string,
  message: string
}
```

**검증 규칙**:

- 이메일: 형식 검증 및 중복 확인
- 이름: 2-50자 길이
- 전문점명: 2-100자 길이
- 수수료율: 0-1 범위 (0% - 100%)

#### `bulkUserAction`

여러 사용자에 대한 일괄 작업을 수행합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userIds: Array<Id<'profiles'>>,
  action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete',
  reason?: string  // 작업 사유
}
```

**응답**:

```typescript
{
  success: boolean,
  processed: number,    // 성공한 작업 수
  failed: number,       // 실패한 작업 수
  results: Array<{
    userId: string,
    success: boolean,
    message: string
  }>,
  errors: Array<{
    userId: string,
    error: string
  }>
}
```

#### `approveUser`

개별 사용자를 승인합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userId: Id<'profiles'>,
  commission_rate?: number  // 수수료율 설정 (선택사항)
}
```

**부가 기능**:

- 자동 알림 생성
- 감사 로그 기록
- 이미 승인된 사용자 중복 승인 방지

#### `rejectUser`

개별 사용자를 거절합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  userId: Id<'profiles'>,
  reason?: string  // 거절 사유
}
```

#### `createRelationship`

매장 간 상하위 관계를 설정합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  shopOwnerId: Id<'profiles'>,  // 하위 매장 소유자
  parentId?: Id<'profiles'>,    // 상위 매장 소유자 (선택사항)
  relationshipType?: 'direct' | 'transferred' | 'temporary',
  notes?: string
}
```

**검증 규칙**:

- 순환 참조 방지 (자기 자신을 상위로 설정 불가)
- 기존 활성 관계 자동 비활성화
- 상위 매장의 하위 매장 수 자동 업데이트

## 주문 관리 API

### Mutation Functions

#### `createOrder`

새 주문을 생성합니다.

**권한**: 관리자 또는 해당 매장 소유자

**매개변수**:

```typescript
{
  shopId: Id<'profiles'>,      // 매장 ID
  orderDate: number,           // 주문 날짜 (timestamp)
  orderNumber?: string,        // 주문번호 (자동 생성 가능)
  totalAmount: number,         // 총 금액 (양수)
  commissionRate?: number,     // 수수료율 (0-1 범위)
  orderStatus?: 'pending' | 'completed' | 'cancelled' | 'refunded',
  isSelfShopOrder?: boolean,   // 자매점 주문 여부
  notes?: string,
  items: Array<{
    productId?: Id<'products'>,
    productName: string,
    productCode?: string,
    quantity: number,          // 수량 (양수)
    unitPrice: number,         // 단가 (양수)
    itemCommissionRate?: number
  }>,
  metadata?: any
}
```

**응답**:

```typescript
{
  success: boolean,
  orderId: string,
  orderNumber: string,
  message: string
}
```

**자동 처리**:

- 주문번호 자동 생성 (ORD-YYYYMMDD-XXXX 형식)
- 수수료 자동 계산
- 주문 항목별 소계 및 수수료 계산
- 알림 생성 (관리자가 타 매장 주문 생성 시)

#### `updateOrder`

기존 주문을 수정합니다.

**권한**: 관리자 또는 해당 매장 소유자

**매개변수**:

```typescript
{
  orderId: Id<'orders'>,
  updates: {
    orderStatus?: 'pending' | 'completed' | 'cancelled' | 'refunded',
    totalAmount?: number,
    commissionRate?: number,
    notes?: string,
    metadata?: any
  },
  recalculateCommission?: boolean  // 수수료 재계산 여부
}
```

**자동 처리**:

- 주문 완료 시 자동 알림 생성
- 수수료 재계산 (필요 시)
- 상태 변경 추적

#### `deleteOrder`

주문을 삭제합니다. (Soft Delete)

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  orderId: Id<'orders'>,
  reason?: string  // 삭제 사유
}
```

**제한사항**:

- 이미 완료되고 수수료가 지급된 주문은 삭제 불가
- 실제 삭제 대신 상태를 'cancelled'로 변경
- 관련 주문 항목의 수수료도 취소

#### `bulkOrderAction`

여러 주문에 대한 일괄 작업을 수행합니다.

**권한**: 관리자 전용

**매개변수**:

```typescript
{
  orderIds: Array<Id<'orders'>>,
  action: 'complete' | 'cancel' | 'approve_commission' | 'pay_commission',
  reason?: string
}
```

**특별 기능**:

- 수수료 지급 시 월별 수수료 계산서 자동 생성/업데이트
- 각 주문별 개별 결과 및 오류 보고

#### `updateOrderItem`

개별 주문 항목을 수정합니다.

**권한**: 관리자 또는 해당 매장 소유자

**매개변수**:

```typescript
{
  itemId: Id<'order_items'>,
  quantity?: number,
  unitPrice?: number,
  itemCommissionRate?: number
}
```

**자동 처리**:

- 항목별 소계 자동 재계산
- 주문 총액 자동 업데이트
- 전체 주문 수수료 재계산

## 에러 처리

### 에러 코드 체계

모든 API 함수는 구조화된 에러 코드를 사용합니다:

```typescript
const ERROR_CODES = {
  // 인증/권한 관련
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  FORBIDDEN: 'FORBIDDEN', // 403

  // 검증 관련
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 400
  INVALID_EMAIL: 'INVALID_EMAIL', // 400
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE', // 400
  INVALID_AMOUNT: 'INVALID_AMOUNT', // 400

  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND', // 404
  ALREADY_EXISTS: 'ALREADY_EXISTS', // 409
  CONFLICT: 'CONFLICT', // 409

  // 비즈니스 로직 관련
  ALREADY_APPROVED: 'ALREADY_APPROVED', // 409
  ALREADY_REJECTED: 'ALREADY_REJECTED', // 409
  CANNOT_DELETE_PAID_ORDER: 'CANNOT_DELETE_PAID_ORDER', // 409
  CIRCULAR_RELATIONSHIP: 'CIRCULAR_RELATIONSHIP', // 409

  // 시스템 관련
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 500
};
```

### 에러 응답 형식

```typescript
{
  code: string,        // 에러 코드
  message: string,     // 사용자 친화적 메시지
  statusCode: number,  // HTTP 상태 코드
  details?: any        // 추가 상세 정보 (선택사항)
}
```

### 클라이언트 에러 처리 예제

```typescript
try {
  const result = await convex.mutation('users:updateUser', {
    userId: 'user123',
    updates: { email: 'invalid-email' },
  });
} catch (error) {
  const apiError = formatError(error);

  switch (apiError.code) {
    case 'INVALID_EMAIL':
      showToast('올바른 이메일 형식을 입력해주세요.', 'error');
      break;
    case 'ALREADY_EXISTS':
      showToast('이미 사용 중인 이메일입니다.', 'warning');
      break;
    case 'FORBIDDEN':
      redirectToLogin();
      break;
    default:
      showToast('오류가 발생했습니다. 다시 시도해주세요.', 'error');
  }
}
```

## 인증 및 권한

### 권한 레벨

1. **공개 접근**: 인증 불필요
2. **인증된 사용자**: 로그인 필수
3. **역할별 접근**: 특정 역할 필수
4. **관리자 전용**: 관리자 권한 필수
5. **소유권 기반**: 자신의 데이터만 접근 가능

### 함수별 권한 요구사항

| 함수                   | 권한 요구사항           |
| ---------------------- | ----------------------- |
| `listUsers`            | 관리자 전용             |
| `getUserById`          | 관리자 전용             |
| `searchUsers`          | 인증된 사용자           |
| `getUserStats`         | 관리자 전용             |
| `getUserRelationships` | 관리자 전용             |
| `getUsersByRole`       | 인증된 사용자           |
| `updateUser`           | 관리자 전용             |
| `bulkUserAction`       | 관리자 전용             |
| `approveUser`          | 관리자 전용             |
| `rejectUser`           | 관리자 전용             |
| `createRelationship`   | 관리자 전용             |
| `createOrder`          | 관리자 또는 매장 소유자 |
| `updateOrder`          | 관리자 또는 매장 소유자 |
| `deleteOrder`          | 관리자 전용             |
| `bulkOrderAction`      | 관리자 전용             |
| `updateOrderItem`      | 관리자 또는 매장 소유자 |

## 사용 예제

### React에서 Convex 사용하기

#### 기본 설정

```typescript
// convex/react에서 훅 import
import { useQuery, useMutation } from 'convex/react';

// 사용자 목록 조회
function UserList() {
  const users = useQuery('users:listUsers', {
    paginationOpts: { numItems: 10 },
    status: 'approved'
  });

  if (users === undefined) return <Loading />;

  return (
    <div>
      {users.page.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// 사용자 승인
function ApproveUserButton({ userId }: { userId: string }) {
  const approveUser = useMutation('users:approveUser');

  const handleApprove = async () => {
    try {
      await approveUser({
        userId,
        commission_rate: 0.1  // 10% 수수료
      });
      toast.success('사용자가 승인되었습니다.');
    } catch (error) {
      toast.error('승인 중 오류가 발생했습니다.');
    }
  };

  return (
    <button onClick={handleApprove}>
      승인
    </button>
  );
}
```

#### 실시간 업데이트

```typescript
// 실시간 통계 대시보드
function Dashboard() {
  const stats = useQuery('users:getUserStats', {});

  // stats가 변경되면 자동으로 컴포넌트 리렌더링
  return (
    <div>
      <StatCard title="총 사용자" value={stats?.total} />
      <StatCard title="승인 대기" value={stats?.byStatus.pending} />
      <StatCard title="최근 가입" value={stats?.recentSignups} />
    </div>
  );
}
```

#### 페이지네이션

```typescript
function PaginatedUserList() {
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 10,
    cursor: null
  });

  const users = useQuery('users:listUsers', { paginationOpts });

  const loadMore = () => {
    if (!users?.isDone && users?.continueCursor) {
      setPaginationOpts(prev => ({
        ...prev,
        cursor: users.continueCursor
      }));
    }
  };

  return (
    <div>
      {users?.page.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      {!users?.isDone && (
        <button onClick={loadMore}>더 보기</button>
      )}
    </div>
  );
}
```

#### 검색 및 필터링

```typescript
function UserSearch() {
  const [filters, setFilters] = useState({
    search: '',
    role: undefined,
    status: 'approved'
  });

  const users = useQuery('users:listUsers', {
    paginationOpts: { numItems: 20 },
    ...filters
  });

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          search: e.target.value
        }))}
        placeholder="이름, 이메일, 전문점명 검색..."
      />

      <select
        value={filters.role || ''}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          role: e.target.value || undefined
        }))}
      >
        <option value="">모든 역할</option>
        <option value="kol">KOL</option>
        <option value="ol">OL</option>
        <option value="shop_owner">매장 소유자</option>
      </select>

      <UserGrid users={users?.page || []} />
    </div>
  );
}
```

### 에러 처리 패턴

#### 글로벌 에러 핸들러

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any) {
  const apiError = formatError(error);

  const errorMessages = {
    UNAUTHORIZED: '로그인이 필요합니다.',
    FORBIDDEN: '권한이 없습니다.',
    NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
    VALIDATION_ERROR: '입력 정보를 확인해주세요.',
    INVALID_EMAIL: '올바른 이메일 형식을 입력해주세요.',
    ALREADY_EXISTS: '이미 존재하는 데이터입니다.',
    INTERNAL_ERROR: '서버 오류가 발생했습니다.',
  };

  const message = errorMessages[apiError.code] || apiError.message;

  toast.error(message);

  // 인증 오류 시 로그인 페이지로 리다이렉트
  if (apiError.code === 'UNAUTHORIZED') {
    window.location.href = '/login';
  }
}
```

#### 뮤테이션 에러 처리

```typescript
function UserForm({ userId }: { userId?: string }) {
  const updateUser = useMutation('users:updateUser');

  const handleSubmit = async (data: UserFormData) => {
    try {
      await updateUser({
        userId,
        updates: data
      });

      toast.success('사용자 정보가 업데이트되었습니다.');
      onSuccess();
    } catch (error) {
      handleApiError(error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 성능 최적화

### 인덱스 활용

모든 쿼리 함수는 적절한 인덱스를 사용하여 성능을 최적화했습니다:

- `by_role`: 역할별 필터링
- `by_status`: 상태별 필터링
- `by_created_at`: 생성일별 정렬
- `by_userId`: 사용자 ID 조회
- `by_email`: 이메일 중복 확인

### 페이지네이션

모든 리스트 조회 함수는 페이지네이션을 지원하여 대용량 데이터 처리 시 성능을 보장합니다.

### 최적화된 데이터 반환

각 함수는 용도에 맞는 최소한의 데이터만 반환하여 네트워크 비용을 줄입니다:

- `searchUsers`: 자동완성용 기본 정보만
- `getUsersByRole`: 드롭다운용 간소화된 정보
- `getUserStats`: 통계 정보만

## 보안 고려사항

1. **권한 기반 접근 제어**: 모든 함수에 적절한 권한 확인
2. **입력 검증**: 모든 사용자 입력에 대한 엄격한 검증
3. **SQL 인젝션 방지**: Convex의 타입 안전한 쿼리 시스템 활용
4. **민감한 정보 보호**: 비밀번호 등 민감한 정보 노출 방지
5. **감사 로그**: 모든 중요한 작업에 대한 추적 가능한 로그 생성
6. **Rate Limiting**: 과도한 요청 방지 (향후 구현 예정)

---

## 마이그레이션 노트

기존 REST API에서 Convex로 마이그레이션된 주요 변경사항:

1. **URL 기반 → 함수 기반**: `/api/users` → `users:listUsers`
2. **HTTP 상태 코드 → 구조화된 에러**: 404 → `{ code: 'NOT_FOUND', statusCode: 404 }`
3. **수동 실시간 업데이트 → 자동 실시간**: `setInterval` → Convex 자동 업데이트
4. **복잡한 권한 미들웨어 → 간단한 헬퍼 함수**: `requireAdmin(ctx)`
5. **수동 감사 로그 → 자동 감사 로그**: `createAuditLog()` 헬퍼 사용

---

_이 문서는 Convex API 함수의 구현 완료 시점 기준으로 작성되었습니다. 향후 기능 추가나 변경사항이 있을 경우 이 문서도 함께 업데이트됩니다._
