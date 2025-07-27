# TypeScript 타입 안전성 완벽 가이드

## 목차

1. [개요](#개요)
2. [주요 타입 오류 패턴 및 해결 방법](#주요-타입-오류-패턴-및-해결-방법)
3. [프로젝트별 체크리스트](#프로젝트별-체크리스트)
4. [도구 및 설정](#도구-및-설정)
5. [베스트 프랙티스](#베스트-프랙티스)
6. [자주 발생하는 실수](#자주-발생하는-실수)
7. [디버깅 팁](#디버깅-팁)
8. [실전 케이스 스터디](#실전-케이스-스터디)

## 개요

### 배경

BIOFOX KOL 프로젝트는 Xano에서 Convex로 마이그레이션하면서 TypeScript strict 모드를 채택했습니다. 이 과정에서 126개의 타입 오류가 발생했고, 체계적인 접근을 통해 모든 오류를 해결하여 0개로 만들었습니다.

### 목표

- **런타임 오류 방지**: 컴파일 시점에 잠재적 버그 발견
- **코드 품질 향상**: 명시적 타입으로 의도 명확화
- **개발 생산성**: IDE의 자동완성과 리팩토링 지원
- **팀 협업**: 타입을 통한 인터페이스 문서화

### 핵심 원칙

1. **any 타입 금지**: unknown 또는 구체적 타입 사용
2. **strict 모드 유지**: 타협 없는 타입 안전성
3. **점진적 개선**: 한 번에 모든 것을 해결하려 하지 않기
4. **실용적 접근**: 필요시 타입 단언 허용, 단 주석으로 이유 명시

## 주요 타입 오류 패턴 및 해결 방법

### 1. 불완전한 객체 타입 정의

#### 문제 상황

TypeScript는 객체 리터럴을 특정 타입에 할당할 때 모든 필수 속성이 있는지 검사합니다. 누락된 속성이 있으면 타입 오류가 발생합니다.

#### 실제 오류 예시

```typescript
// components/biofox-admin/orders/OrderFormModal.tsx
const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
  const newItems = [...formData.items];
  // ❌ Type '{ id: string; product_name: string; }' is missing properties:
  // order_id, quantity, unit_price, subtotal, created_at
  newItems[index] = {
    id: currentItem?.id || `temp-${Date.now()}`,
    product_name: currentItem?.product_name || '',
  };
};
```

#### 상세 해결 방법

```typescript
const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
  const newItems = [...formData.items];
  const currentItem = newItems[index];

  // ✅ 방법 1: 모든 필수 속성을 명시적으로 포함
  const updatedItem: OrderItem = {
    id: currentItem?.id || `temp-${Date.now()}`,
    order_id: currentItem?.order_id || '',
    product_name: currentItem?.product_name || '',
    quantity: currentItem?.quantity || 1,
    unit_price: currentItem?.unit_price || 0,
    subtotal: currentItem?.subtotal || 0,
    created_at: currentItem?.created_at || new Date().toISOString(),
    // 선택적 속성도 처리
    product_id: currentItem?.product_id,
    product_code: currentItem?.product_code,
  };

  // 필드 업데이트
  (updatedItem as any)[field] = value;

  // subtotal 자동 계산
  if (field === 'quantity' || field === 'unit_price') {
    updatedItem.subtotal = updatedItem.quantity * updatedItem.unit_price;
  }

  newItems[index] = updatedItem;
  setFormData({ ...formData, items: newItems });
};

// ✅ 방법 2: 스프레드 연산자로 기존 객체 복사
const updateItem = (item: Partial<OrderItem>): OrderItem => {
  const defaultItem: OrderItem = {
    id: `temp-${Date.now()}`,
    order_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
    created_at: new Date().toISOString(),
  };

  return { ...defaultItem, ...item };
};

// ✅ 방법 3: 팩토리 함수 사용
function createOrderItem(partial?: Partial<OrderItem>): OrderItem {
  const base: OrderItem = {
    id: `temp-${Date.now()}`,
    order_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
    created_at: new Date().toISOString(),
  };

  if (partial) {
    return { ...base, ...partial };
  }

  return base;
}
```

#### 추가 고려사항

- **인터페이스 vs 타입**: 확장 가능성이 있다면 interface 사용
- **Required vs Partial**: 유틸리티 타입 활용
- **디폴트 값 관리**: 별도 상수로 관리하여 일관성 유지

### 2. Enum 타입 캐스팅 문제

#### 문제 상황

문자열 리터럴 유니온 타입은 TypeScript의 강력한 기능이지만, 외부 입력(사용자 입력, API 응답 등)과 연결할 때 타입 불일치가 발생합니다.

#### 실제 오류 예시

```typescript
// components/biofox-admin/commissions/CommissionFilters.tsx
<Select
  value={filters.status || 'all'}
  onValueChange={(value) => {
    // ❌ Type 'string' is not assignable to type
    // '"calculated" | "adjusted" | "paid" | "cancelled" | undefined'
    setFilters(prev => ({ ...prev, status: value }));
  }}
>
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: 타입 가드 함수 사용
type CommissionStatus = 'calculated' | 'adjusted' | 'paid' | 'cancelled';

function isCommissionStatus(value: string): value is CommissionStatus {
  return ['calculated', 'adjusted', 'paid', 'cancelled'].includes(value);
}

onValueChange={(value) => {
  if (value === 'all') {
    setFilters(prev => ({ ...prev, status: undefined }));
  } else if (isCommissionStatus(value)) {
    setFilters(prev => ({ ...prev, status: value }));
  } else {
    console.error(`Invalid status value: ${value}`);
  }
}}

// ✅ 방법 2: as const와 배열 활용
const COMMISSION_STATUSES = ['calculated', 'adjusted', 'paid', 'cancelled'] as const;
type CommissionStatus = typeof COMMISSION_STATUSES[number];

const statusMap: Record<string, CommissionStatus | undefined> = {
  all: undefined,
  calculated: 'calculated',
  adjusted: 'adjusted',
  paid: 'paid',
  cancelled: 'cancelled',
};

onValueChange={(value) => {
  const mappedStatus = statusMap[value];
  if (mappedStatus !== undefined || value === 'all') {
    setFilters(prev => ({ ...prev, status: mappedStatus }));
  }
}}

// ✅ 방법 3: 제네릭 헬퍼 함수
function createEnumParser<T extends string>(validValues: readonly T[]) {
  return (value: string): T | undefined => {
    return validValues.includes(value as T) ? value as T : undefined;
  };
}

const parseCommissionStatus = createEnumParser(COMMISSION_STATUSES);

onValueChange={(value) => {
  setFilters(prev => ({
    ...prev,
    status: value === 'all' ? undefined : parseCommissionStatus(value)
  }));
}}

// ✅ 방법 4: Zod 스키마 활용 (런타임 검증)
import { z } from 'zod';

const CommissionStatusSchema = z.enum(['calculated', 'adjusted', 'paid', 'cancelled']);
type CommissionStatus = z.infer<typeof CommissionStatusSchema>;

onValueChange={(value) => {
  try {
    const status = value === 'all' ? undefined : CommissionStatusSchema.parse(value);
    setFilters(prev => ({ ...prev, status }));
  } catch (error) {
    console.error('Invalid status value:', error);
  }
}}
```

#### 추가 고려사항

- **const assertions**: `as const`로 리터럴 타입 보존
- **discriminated unions**: 타입 안전한 상태 관리
- **exhaustive checks**: switch문에서 모든 케이스 처리 보장

### 3. Undefined 안전성 처리

#### 문제 상황

JavaScript의 동적 특성상 객체 속성이나 배열 요소가 undefined일 수 있습니다. TypeScript는 이를 감지하여 안전하지 않은 접근을 방지합니다.

#### 실제 오류 예시

```typescript
// components/clinical/PhotoRoundCarousel.tsx
photos.forEach(photo => {
  // ❌ Object is possibly 'undefined'
  const slotIndex = rounds[photo.roundDay].findIndex(slot => slot.angle === photo.angle);
  rounds[photo.roundDay][slotIndex] = photo;
});
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: 명시적 undefined 체크
photos.forEach(photo => {
  const roundSlots = rounds[photo.roundDay];
  if (roundSlots) {
    const slotIndex = roundSlots.findIndex(slot => slot.angle === photo.angle);
    if (slotIndex !== -1) {
      roundSlots[slotIndex] = photo;
    }
  }
});

// ✅ 방법 2: 옵셔널 체이닝과 nullish coalescing
photos.forEach(photo => {
  const roundSlots = rounds[photo.roundDay] ?? [];
  const slotIndex = roundSlots.findIndex(slot => slot.angle === photo.angle);
  if (slotIndex !== -1 && rounds[photo.roundDay]) {
    rounds[photo.roundDay]![slotIndex] = photo; // Non-null assertion
  }
});

// ✅ 방법 3: 유틸리티 함수로 안전한 접근
function safeArrayAccess<T>(array: T[] | undefined, index: number, defaultValue: T): T {
  return array?.[index] ?? defaultValue;
}

function safeObjectAccess<T, K extends keyof T>(
  obj: T | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  return obj?.[key] ?? defaultValue;
}

// 사용 예시
const roundSlots = safeObjectAccess(rounds, photo.roundDay, []);

// ✅ 방법 4: Type Predicate와 Early Return
function hasRoundSlots(
  rounds: Record<number, PhotoSlot[]>,
  roundDay: number
): rounds is Record<number, PhotoSlot[]> & { [K in typeof roundDay]: PhotoSlot[] } {
  return roundDay in rounds && Array.isArray(rounds[roundDay]);
}

photos.forEach(photo => {
  if (!hasRoundSlots(rounds, photo.roundDay)) {
    console.warn(`No slots found for round ${photo.roundDay}`);
    return;
  }

  const slotIndex = rounds[photo.roundDay].findIndex(slot => slot.angle === photo.angle);
  if (slotIndex !== -1) {
    rounds[photo.roundDay][slotIndex] = photo;
  }
});

// ✅ 방법 5: Map 대신 Record 사용 시 초기화
function initializeRounds(maxRound: number): Record<number, PhotoSlot[]> {
  const rounds: Record<number, PhotoSlot[]> = {};

  for (let i = 1; i <= maxRound; i++) {
    rounds[i] = [
      { id: `${i}-front`, roundDay: i, angle: 'front', uploaded: false },
      { id: `${i}-left`, roundDay: i, angle: 'left', uploaded: false },
      { id: `${i}-right`, roundDay: i, angle: 'right', uploaded: false },
    ];
  }

  return rounds;
}
```

#### 추가 고려사항

- **Defensive Programming**: 항상 최악의 경우 가정
- **Fail Fast**: 문제 발견 시 즉시 처리
- **Logging**: undefined 케이스 발생 시 로깅으로 추적

### 4. Convex ID 타입 처리

#### 문제 상황

Convex는 문서 ID에 대해 브랜드 타입(branded type)을 사용합니다. 일반 string을 Id<TableName> 타입에 할당할 수 없습니다.

#### 실제 오류 예시

```typescript
// hooks/useClinicalCases.ts
const profile = await ctx.db
  .query('profiles')
  .withIndex('by_user', q =>
    // ❌ Type 'string' is not assignable to type 'Id<"users">'
    q.eq('userId', user.subject)
  )
  .first();

// components/sales-chart.tsx
const shops = await ctx.db
  .query('profiles')
  .withIndex('by_kol', q =>
    // ❌ Argument of type 'string' is not assignable to parameter of type 'Id<"profiles">'
    q.eq('shop_id', kolId)
  )
  .collect();
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: 타입 임포트와 캐스팅
import { Id } from '@/convex/_generated/dataModel';

// 기본 캐스팅
const userId = user.subject as Id<'users'>;
const profileId = kolId as Id<'profiles'>;

// 조건부 캐스팅
const profile = await ctx.db
  .query('profiles')
  .withIndex('by_user', q => q.eq('userId', user.subject as Id<'users'>))
  .first();

// ✅ 방법 2: 타입 가드 함수
function isConvexId<T extends string>(value: string): value is Id<T> {
  // Convex ID 형식 검증 (예: "j57...")
  return /^[a-zA-Z0-9]{15,}$/.test(value);
}

function assertConvexId<T extends string>(value: string, tableName: T): asserts value is Id<T> {
  if (!isConvexId<T>(value)) {
    throw new Error(`Invalid Convex ID for table ${tableName}: ${value}`);
  }
}

// 사용 예시
if (isConvexId<'users'>(user.subject)) {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', q => q.eq('userId', user.subject))
    .first();
}

// ✅ 방법 3: 헬퍼 함수로 안전한 변환
function toConvexId<TableName extends string>(
  value: string | undefined,
  tableName: TableName
): Id<TableName> | undefined {
  if (!value) return undefined;

  // 개발 환경에서는 검증, 프로덕션에서는 바로 캐스팅
  if (process.env.NODE_ENV === 'development') {
    if (!isConvexId<TableName>(value)) {
      console.warn(`Invalid ID format for ${tableName}: ${value}`);
    }
  }

  return value as Id<TableName>;
}

// 사용 예시
const shops = await ctx.db
  .query('profiles')
  .withIndex('by_kol', q => {
    const kolConvexId = toConvexId(kolId, 'profiles');
    return kolConvexId ? q.eq('shop_id', kolConvexId) : q;
  })
  .collect();

// ✅ 방법 4: 제네릭 쿼리 빌더
class ConvexQueryBuilder<T extends string> {
  constructor(
    private db: any,
    private tableName: T
  ) {}

  async findById(id: string): Promise<any> {
    return await this.db.get(id as Id<T>);
  }

  async findByIndex<K extends string>(indexName: K, field: string, value: string): Promise<any[]> {
    return await this.db
      .query(this.tableName)
      .withIndex(indexName, (q: any) => q.eq(field, value as Id<T>))
      .collect();
  }
}

// ✅ 방법 5: 타입 안전한 관계 처리
interface ProfileWithRelations {
  _id: Id<'profiles'>;
  userId: Id<'users'>;
  parent_id?: Id<'profiles'>;
  // ... other fields
}

async function getProfileWithParent(
  ctx: any,
  profileId: string
): Promise<{ profile: ProfileWithRelations; parent?: ProfileWithRelations }> {
  const profile = await ctx.db.get(profileId as Id<'profiles'>);
  if (!profile) throw new Error('Profile not found');

  const parent = profile.parent_id ? await ctx.db.get(profile.parent_id) : undefined;

  return { profile, parent };
}
```

#### 추가 고려사항

- **Brand Types**: TypeScript의 nominal typing 이해
- **Runtime Validation**: 외부 입력은 항상 검증
- **Type Safety vs Practicality**: 적절한 균형 찾기

### 5. 조건부 속성 접근

#### 문제 상황

중첩된 객체 구조에서 중간 속성이 선택적(optional)일 때, 안전하지 않은 접근은 런타임 오류를 발생시킬 수 있습니다.

#### 실제 오류 예시

```typescript
// components/biofox-admin/clinical/ClinicalPhotoModal.tsx
<div className="text-sm text-gray-600">
  {/* ❌ Object is possibly 'undefined' */}
  업로드: {photo.uploaded_by_profile.name}
</div>

// lib/clinical-photos-mapper.ts
return {
  // ❌ Cannot read properties of undefined
  parentName: user.current_relationship.parent_name,
  parentRole: user.current_relationship.parent_role,
};
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: 옵셔널 체이닝과 기본값
<div className="text-sm text-gray-600">
  업로드: {photo.uploaded_by_profile?.name || '알 수 없음'}
</div>

// ✅ 방법 2: 조건부 렌더링
{photo.uploaded_by_profile && (
  <div className="text-sm text-gray-600">
    업로드: {photo.uploaded_by_profile.name}
  </div>
)}

// ✅ 방법 3: 타입 가드로 안전성 보장
interface UserWithRelationship {
  current_relationship: {
    parent_name: string;
    parent_role: string;
  };
}

function hasRelationship(user: any): user is UserWithRelationship {
  return user?.current_relationship?.parent_name !== undefined;
}

if (hasRelationship(user)) {
  return {
    parentName: user.current_relationship.parent_name,
    parentRole: user.current_relationship.parent_role,
  };
}

// ✅ 방법 4: 구조 분해 할당과 기본값
const {
  uploaded_by_profile: { name = '알 수 없음' } = {}
} = photo;

const {
  current_relationship: {
    parent_name: parentName = '',
    parent_role: parentRole = ''
  } = {}
} = user;

// ✅ 방법 5: 헬퍼 함수로 깊은 접근
function getNestedProperty<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T,
  key1: K1,
  key2: K2,
  defaultValue: T[K1][K2]
): T[K1][K2] {
  return obj?.[key1]?.[key2] ?? defaultValue;
}

// 사용 예시
const uploaderName = getNestedProperty(
  photo,
  'uploaded_by_profile',
  'name',
  '알 수 없음'
);

// ✅ 방법 6: Proxy를 사용한 안전한 접근 (고급)
function createSafeProxy<T extends object>(obj: T, defaultValue: any = ''): T {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop as keyof T];
      if (value === undefined || value === null) {
        return defaultValue;
      }
      if (typeof value === 'object') {
        return createSafeProxy(value, defaultValue);
      }
      return value;
    }
  });
}

// 사용 예시
const safePhoto = createSafeProxy(photo);
const uploaderName = safePhoto.uploaded_by_profile.name; // 안전!
```

#### 추가 고려사항

- **Performance**: 깊은 중첩 구조는 피하기
- **Readability**: 과도한 옵셔널 체이닝은 가독성 저하
- **Null vs Undefined**: 명확한 구분과 처리

### 6. 배열 필터링 후 타입 보장

#### 문제 상황

배열을 필터링해도 TypeScript는 결과 배열의 타입을 자동으로 좁히지 않습니다. 특히 undefined를 제거해도 타입은 여전히 T | undefined로 유지됩니다.

#### 실제 오류 예시

```typescript
// convex/migration.ts
const profileIds = profiles.map(p => p._id);
// profileIds 타입: (Id<'profiles'> | undefined)[]

const validProfileIds = profileIds.filter(id => id !== undefined);
// ❌ validProfileIds 타입이 여전히 (Id<'profiles'> | undefined)[]

for (const kolId of validProfileIds) {
  // ❌ Argument of type 'Id<"profiles"> | undefined' is not assignable
  await ctx.db.insert('shop_relationships', {
    parent_id: kolId,
  });
}
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: Type Predicate (권장)
const validProfileIds = profileIds.filter((id): id is Id<'profiles'> => id !== undefined);
// validProfileIds 타입: Id<'profiles'>[]

// ✅ 방법 2: 커스텀 필터 함수
function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

const validProfileIds = profileIds.filter(isDefined);

// ✅ 방법 3: flatMap 활용
const validProfileIds = profiles.flatMap(p => (p._id ? [p._id] : []));

// ✅ 방법 4: reduce로 타입 안전하게 필터링
const validProfileIds = profileIds.reduce<Id<'profiles'>[]>((acc, id) => {
  if (id !== undefined) {
    acc.push(id);
  }
  return acc;
}, []);

// ✅ 방법 5: 제네릭 유틸리티 함수
function filterNullish<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item !== null && item !== undefined);
}

const validProfileIds = filterNullish(profileIds);

// ✅ 방법 6: 여러 조건으로 필터링
interface ValidProfile {
  _id: Id<'profiles'>;
  status: 'active';
  role: 'shop_owner';
}

function isValidShopProfile(profile: any): profile is ValidProfile {
  return (
    profile?._id !== undefined && profile?.status === 'active' && profile?.role === 'shop_owner'
  );
}

const validShopProfiles = profiles.filter(isValidShopProfile);
// validShopProfiles 타입: ValidProfile[]

// ✅ 방법 7: 체이닝 가능한 유틸리티 클래스
class TypeSafeArray<T> {
  constructor(private items: T[]) {}

  filterDefined(): TypeSafeArray<NonNullable<T>> {
    return new TypeSafeArray(this.items.filter((item): item is NonNullable<T> => item != null));
  }

  filterBy<K extends T>(predicate: (item: T) => item is K): TypeSafeArray<K> {
    return new TypeSafeArray(this.items.filter(predicate));
  }

  toArray(): T[] {
    return this.items;
  }
}

// 사용 예시
const validIds = new TypeSafeArray(profileIds).filterDefined().toArray();
```

#### 추가 고려사항

- **Performance**: filter + map 대신 reduce 고려
- **Immutability**: 원본 배열 변경 금지
- **Error Handling**: 빈 배열 케이스 처리

### 7. Date 문자열 처리

#### 문제 상황

날짜를 문자열로 변환하거나 파싱할 때, 메서드 체이닝 중 undefined가 반환될 수 있습니다.

#### 실제 오류 예시

```typescript
// hooks/usePersonalCaseHandlers.ts
const newCase = {
  // ❌ Type 'string | undefined' is not assignable to type 'string'
  createdAt: new Date().toISOString().split('T')[0],
};

// lib/utils/date-utils.ts
export function formatDate(date: Date | string): string {
  // ❌ Object is possibly 'undefined'
  return new Date(date).toLocaleDateString().split('/').join('-');
}
```

#### 상세 해결 방법

```typescript
// ✅ 방법 1: 기본값 제공
const newCase = {
  createdAt: new Date().toISOString().split('T')[0] || '',
};

// ✅ 방법 2: 안전한 날짜 포맷팅 함수
function formatDateSafe(date: Date | string | undefined): string {
  if (!date) return '';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Invalid Date 체크
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }

    // ISO 형식 (YYYY-MM-DD)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}

// ✅ 방법 3: 날짜 유틸리티 클래스
class DateFormatter {
  private date: Date;

  constructor(date: Date | string | undefined) {
    this.date = this.parseDate(date);
  }

  private parseDate(date: Date | string | undefined): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;

    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  toISODate(): string {
    return this.date.toISOString().split('T')[0] || '';
  }

  toLocalDate(locale = 'ko-KR'): string {
    return this.date.toLocaleDateString(locale);
  }

  format(pattern: string): string {
    const year = this.date.getFullYear();
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const day = String(this.date.getDate()).padStart(2, '0');
    const hours = String(this.date.getHours()).padStart(2, '0');
    const minutes = String(this.date.getMinutes()).padStart(2, '0');
    const seconds = String(this.date.getSeconds()).padStart(2, '0');

    return pattern
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static now(): DateFormatter {
    return new DateFormatter(new Date());
  }
}

// 사용 예시
const createdAt = DateFormatter.now().toISODate();
const formattedDate = new DateFormatter(userDate).format('YYYY-MM-DD HH:mm:ss');

// ✅ 방법 4: 날짜 관련 상수와 헬퍼
const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'YYYY년 MM월 DD일',
  DISPLAY_DATETIME: 'YYYY년 MM월 DD일 HH시 mm분',
} as const;

function getDateParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    hours: String(date.getHours()).padStart(2, '0'),
    minutes: String(date.getMinutes()).padStart(2, '0'),
    seconds: String(date.getSeconds()).padStart(2, '0'),
  };
}

// ✅ 방법 5: Day.js 또는 date-fns 라이브러리 활용
import dayjs from 'dayjs';

const createdAt = dayjs().format('YYYY-MM-DD');
const isValid = dayjs(userInput).isValid();
const formatted = dayjs(date).format('YYYY년 MM월 DD일');

// ✅ 방법 6: Zod를 활용한 날짜 검증
import { z } from 'zod';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DateTimeSchema = z.string().datetime();

function parseAndFormatDate(input: unknown): string {
  try {
    const validated = DateSchema.parse(input);
    return validated;
  } catch {
    return new Date().toISOString().split('T')[0] || '';
  }
}
```

#### 추가 고려사항

- **Timezone**: 서버/클라이언트 시간대 차이
- **Locale**: 지역별 날짜 형식 차이
- **Validation**: 유효한 날짜 범위 검증

## 프로젝트별 체크리스트

### 컴포넌트 개발 시

#### 기본 체크리스트

- [ ] **Props 인터페이스 정의**

  ```typescript
  interface ComponentProps {
    // 필수 props
    id: string;
    title: string;

    // 선택적 props
    description?: string;

    // 함수 props - 명확한 타입
    onChange: (value: string) => void;
    onSubmit: (data: FormData) => Promise<void>;

    // 자식 컴포넌트
    children?: React.ReactNode;
  }
  ```

- [ ] **State 타입 명시**

  ```typescript
  // ❌ 나쁜 예
  const [data, setData] = useState(null);

  // ✅ 좋은 예
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  ```

- [ ] **이벤트 핸들러 타입**

  ```typescript
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    // ...
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    // ...
  };
  ```

- [ ] **Ref 타입 정의**
  ```typescript
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  ```

#### 고급 체크리스트

- [ ] **제네릭 컴포넌트**

  ```typescript
  interface ListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor: (item: T) => string;
  }

  function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
    return (
      <>
        {items.map((item, index) => (
          <div key={keyExtractor(item)}>
            {renderItem(item, index)}
          </div>
        ))}
      </>
    );
  }
  ```

- [ ] **Compound Components 패턴**

  ```typescript
  interface DialogContextType {
    open: boolean;
    onClose: () => void;
  }

  const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

  function useDialogContext() {
    const context = useContext(DialogContext);
    if (!context) {
      throw new Error('Dialog compound components must be used within Dialog');
    }
    return context;
  }
  ```

### Convex 통합 시

#### 기본 체크리스트

- [ ] **ID 타입 임포트**

  ```typescript
  import { Id } from '@/convex/_generated/dataModel';
  ```

- [ ] **쿼리/뮤테이션 타입**

  ```typescript
  import { api } from '@/convex/_generated/api';
  import { useQuery, useMutation } from 'convex/react';

  // 타입 안전한 쿼리
  const users = useQuery(api.users.list, {
    role: 'admin' as const,
  });

  // 타입 안전한 뮤테이션
  const createUser = useMutation(api.users.create);
  ```

- [ ] **스키마 정의**

  ```typescript
  import { defineSchema, defineTable } from 'convex/server';
  import { v } from 'convex/values';

  export default defineSchema({
    users: defineTable({
      email: v.string(),
      name: v.string(),
      role: v.union(v.literal('admin'), v.literal('user'), v.literal('guest')),
      profileId: v.optional(v.id('profiles')),
    })
      .index('by_email', ['email'])
      .index('by_role', ['role']),
  });
  ```

#### 고급 체크리스트

- [ ] **Convex 함수 타입**

  ```typescript
  import { query, mutation } from './_generated/server';
  import { Doc, Id } from './_generated/dataModel';

  export const getUser = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args): Promise<Doc<'users'> | null> => {
      return await ctx.db.get(args.userId);
    },
  });
  ```

- [ ] **관계 처리**

  ```typescript
  interface UserWithProfile {
    user: Doc<'users'>;
    profile: Doc<'profiles'> | null;
  }

  async function getUserWithProfile(
    ctx: QueryCtx,
    userId: Id<'users'>
  ): Promise<UserWithProfile | null> {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = user.profileId ? await ctx.db.get(user.profileId) : null;

    return { user, profile };
  }
  ```

### Hook 개발 시

#### 기본 체크리스트

- [ ] **반환 타입 명시**

  ```typescript
  interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
  }

  export function useAuth(): UseAuthReturn {
    // ...
  }
  ```

- [ ] **제네릭 Hook**
  ```typescript
  function useAsync<T, E = Error>(
    asyncFunction: () => Promise<T>
  ): {
    loading: boolean;
    error: E | null;
    data: T | null;
    execute: () => Promise<void>;
  } {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<E | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFunction();
        setData(result);
      } catch (err) {
        setError(err as E);
      } finally {
        setLoading(false);
      }
    }, [asyncFunction]);

    return { loading, error, data, execute };
  }
  ```

#### 고급 체크리스트

- [ ] **Custom Hook 조합**

  ```typescript
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
  }

  function useSearch<T>(searchFn: (query: string) => Promise<T[]>, delay = 300) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<T[]>([]);
    const [searching, setSearching] = useState(false);

    const debouncedQuery = useDebounce(query, delay);

    useEffect(() => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      const search = async () => {
        setSearching(true);
        try {
          const data = await searchFn(debouncedQuery);
          setResults(data);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setSearching(false);
        }
      };

      search();
    }, [debouncedQuery, searchFn]);

    return {
      query,
      setQuery,
      results,
      searching,
    };
  }
  ```

## 도구 및 설정

### TypeScript 설정 (tsconfig.json)

#### 기본 설정

```json
{
  "compilerOptions": {
    // 타입 체크 엄격도
    "strict": true, // 모든 strict 옵션 활성화
    "noImplicitAny": true, // any 타입 암시적 사용 금지
    "strictNullChecks": true, // null/undefined 엄격 체크
    "strictFunctionTypes": true, // 함수 타입 엄격 체크
    "strictBindCallApply": true, // bind/call/apply 엄격 체크
    "strictPropertyInitialization": true, // 클래스 속성 초기화 체크
    "noImplicitThis": true, // this 타입 암시적 any 금지
    "alwaysStrict": true, // strict mode 코드 생성

    // 추가 체크
    "noUnusedLocals": true, // 사용하지 않는 지역 변수 오류
    "noUnusedParameters": true, // 사용하지 않는 매개변수 오류
    "noImplicitReturns": true, // 모든 경로에서 반환 필요
    "noFallthroughCasesInSwitch": true, // switch문 fallthrough 금지
    "noUncheckedIndexedAccess": true, // 인덱스 접근 시 undefined 포함

    // 모듈 해석
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,

    // 경로 매핑
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/convex/*": ["./convex/*"]
    }
  },
  "include": ["src/**/*", "convex/**/*", "next-env.d.ts"],
  "exclude": ["node_modules", "dist", ".next", "coverage"]
}
```

#### 프로젝트별 오버라이드

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    // 테스트 파일용 설정
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### ESLint 설정 (.eslintrc.json)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    // TypeScript 관련 규칙
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",

    // React 관련
    "react/prop-types": "off", // TypeScript가 처리
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### 유용한 스크립트 (package.json)

```json
{
  "scripts": {
    // 타입 체크
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",

    // 특정 파일 체크
    "type-check:file": "tsc --noEmit --listFiles | grep",

    // 타입 커버리지
    "type-coverage": "type-coverage --detail",
    "type-coverage:report": "type-coverage --detail > type-coverage-report.txt",

    // 린트와 타입 체크 병행
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "check": "npm run type-check && npm run lint",

    // 사용하지 않는 exports 찾기
    "find-unused": "ts-prune",

    // 타입 생성
    "generate:types": "npm run convex:generate",

    // Pre-commit 체크
    "pre-commit": "lint-staged",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc-files --noEmit"]
  }
}
```

### VS Code 설정 (.vscode/settings.json)

```json
{
  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.includeInlayParameterNameHints": "all",
  "typescript.preferences.includeInlayPropertyDeclarationTypeHints": true,
  "typescript.preferences.includeInlayVariableTypeHints": true,
  "typescript.preferences.includeInlayFunctionLikeReturnTypeHints": true,
  "typescript.updateImportsOnFileMove.enabled": "always",

  // 에디터
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },

  // 파일 감시
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/*/**": true,
    "**/.next/**": true
  },

  // 추천 확장
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## 베스트 프랙티스

### 1. Early Return Pattern

#### 개념

조건을 만족하지 않으면 즉시 반환하여 중첩을 줄이고 가독성을 향상시킵니다.

#### 구현 예시

```typescript
// ❌ 나쁜 예 - 깊은 중첩
function processUser(user: User | null): UserProfile | null {
  if (user) {
    if (user.isActive) {
      if (user.profile) {
        if (user.profile.isComplete) {
          return {
            ...user.profile,
            displayName: user.profile.name || user.email,
          };
        }
      }
    }
  }
  return null;
}

// ✅ 좋은 예 - Early Return
function processUser(user: User | null): UserProfile | null {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.profile) return null;
  if (!user.profile.isComplete) return null;

  return {
    ...user.profile,
    displayName: user.profile.name || user.email,
  };
}

// ✅ Guard 함수와 함께 사용
function isValidUser(user: User | null): user is User & {
  isActive: true;
  profile: CompleteProfile;
} {
  return !!(user?.isActive && user.profile?.isComplete);
}

function processUser(user: User | null): UserProfile | null {
  if (!isValidUser(user)) return null;

  return {
    ...user.profile,
    displayName: user.profile.name || user.email,
  };
}
```

### 2. Type Guards

#### 개념

런타임에 타입을 체크하고 TypeScript에게 타입 정보를 제공합니다.

#### 구현 예시

```typescript
// 기본 Type Guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// 객체 Type Guard
interface AdminUser {
  role: 'admin';
  permissions: string[];
}

function isAdminUser(user: User): user is User & AdminUser {
  return user.role === 'admin' && Array.isArray((user as any).permissions);
}

// 복잡한 Type Guard
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

// 사용 예시
async function fetchUser(id: string): Promise<User | null> {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);

  if (isSuccessResponse(response)) {
    return response.data;
  } else {
    console.error('API Error:', response.error);
    return null;
  }
}

// Type Guard 조합
function hasProfile<T extends { profile?: unknown }>(
  obj: T
): obj is T & { profile: NonNullable<T['profile']> } {
  return obj.profile !== null && obj.profile !== undefined;
}

function hasPermission(user: User, permission: string): user is User & { permissions: string[] } {
  return Array.isArray((user as any).permissions) && (user as any).permissions.includes(permission);
}

// 체이닝 가능한 Type Guard
class TypeGuardChain<T> {
  constructor(private value: T) {}

  check<K extends T>(guard: (value: T) => value is K): TypeGuardChain<K> | null {
    return guard(this.value) ? new TypeGuardChain(this.value) : null;
  }

  get(): T {
    return this.value;
  }
}
```

### 3. Exhaustive Checks

#### 개념

모든 가능한 케이스를 처리했는지 컴파일 타임에 확인합니다.

#### 구현 예시

```typescript
// 기본 Exhaustive Check
type Status = 'pending' | 'approved' | 'rejected';

function getStatusMessage(status: Status): string {
  switch (status) {
    case 'pending':
      return '검토 중';
    case 'approved':
      return '승인됨';
    case 'rejected':
      return '거절됨';
    default:
      // never 타입으로 모든 케이스 처리 확인
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}

// 헬퍼 함수 활용
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// Discriminated Union과 함께
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Profile> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'CLEAR_USER':
      return { ...state, user: null };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user
          ? { ...state.user, profile: { ...state.user.profile, ...action.payload } }
          : null,
      };

    default:
      return assertNever(action);
  }
}

// 복잡한 상태 머신
interface StateMap {
  idle: { type: 'idle' };
  loading: { type: 'loading'; startTime: number };
  success: { type: 'success'; data: any; loadTime: number };
  error: { type: 'error'; error: Error; retryCount: number };
}

type State = StateMap[keyof StateMap];

function handleState(state: State): void {
  switch (state.type) {
    case 'idle':
      console.log('Ready to start');
      break;

    case 'loading':
      console.log(`Loading for ${Date.now() - state.startTime}ms`);
      break;

    case 'success':
      console.log(`Loaded in ${state.loadTime}ms:`, state.data);
      break;

    case 'error':
      console.log(`Error (retry ${state.retryCount}):`, state.error);
      break;

    default:
      assertNever(state);
  }
}
```

### 4. Type Inference

#### 개념

TypeScript의 타입 추론을 최대한 활용하여 불필요한 타입 명시를 줄입니다.

#### 구현 예시

```typescript
// ❌ 과도한 타입 명시
const numbers: number[] = [1, 2, 3];
const doubled: number[] = numbers.map((n: number): number => n * 2);
const user: { name: string; age: number } = { name: 'John', age: 30 };

// ✅ 타입 추론 활용
const numbers = [1, 2, 3]; // number[]로 추론
const doubled = numbers.map(n => n * 2); // number[]로 추론
const user = { name: 'John', age: 30 }; // { name: string; age: number }로 추론

// const assertion 활용
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'

const STATUS_MAP = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
} as const;
type StatusKey = keyof typeof STATUS_MAP;
type StatusValue = (typeof STATUS_MAP)[StatusKey];

// 함수 반환 타입 추론
function createUser(name: string, age: number) {
  return {
    id: Math.random().toString(36),
    name,
    age,
    createdAt: new Date(),
  };
}
type User = ReturnType<typeof createUser>;

// 조건부 타입과 추론
type Awaited<T> = T extends Promise<infer U> ? U : T;

async function fetchData() {
  return { data: 'result' };
}
type FetchResult = Awaited<ReturnType<typeof fetchData>>;

// Template Literal 타입과 추론
type EventName = `on${Capitalize<string>}`;
type Handler<T extends EventName> = T extends `on${infer Event}` ? (event: Event) => void : never;

const onClick: Handler<'onClick'> = event => {
  // event는 'Click'으로 추론
};
```

### 5. Strict Mode Benefits

#### 개념

TypeScript strict 모드의 각 옵션이 제공하는 이점을 최대한 활용합니다.

#### 구현 예시

```typescript
// strictNullChecks의 이점
function getLength(str: string | null | undefined): number {
  // ❌ strict 모드 없이는 런타임 오류 가능
  // return str.length;

  // ✅ strict 모드에서는 컴파일 오류
  if (!str) return 0;
  return str.length;
}

// strictFunctionTypes의 이점
type Logger = (message: string) => void;

// ❌ strict 모드 없이는 허용되지만 위험
// const log: Logger = (message: string | number) => console.log(message);

// ✅ strict 모드에서는 정확한 타입 필요
const log: Logger = (message: string) => console.log(message);

// noImplicitThis의 이점
class Counter {
  count = 0;

  increment() {
    // ✅ this 타입이 명확
    this.count++;
  }

  delayedIncrement() {
    setTimeout(function () {
      // ❌ strict 모드에서는 오류: this가 any 타입
      // this.count++;
    }, 1000);

    // ✅ 화살표 함수로 해결
    setTimeout(() => {
      this.count++;
    }, 1000);
  }
}

// strictPropertyInitialization의 이점
class User {
  // ❌ strict 모드에서는 오류: 초기화되지 않음
  // name: string;

  // ✅ 해결 방법들
  email: string = '';
  phone?: string;
  address!: string; // 다른 곳에서 확실히 초기화됨을 명시

  constructor(public name: string) {
    // name은 생성자에서 초기화
  }
}

// noImplicitAny의 이점
// ❌ strict 모드 없이는 any로 추론
// function parse(data) { return JSON.parse(data); }

// ✅ strict 모드에서는 명시적 타입 필요
function parse(data: string): unknown {
  return JSON.parse(data);
}

// 조합된 이점
interface Config {
  apiUrl: string;
  timeout?: number;
  retries?: number;
}

function createClient(config: Config) {
  // strictNullChecks로 안전한 기본값 처리
  const timeout = config.timeout ?? 5000;
  const retries = config.retries ?? 3;

  return {
    async fetch(endpoint: string) {
      let lastError: Error | null = null;

      // noImplicitAny로 타입 안전한 루프
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(`${config.apiUrl}/${endpoint}`, { timeout });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        } catch (error) {
          // strictNullChecks로 에러 처리
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }

      throw lastError || new Error('Unknown error');
    },
  };
}
```

## 자주 발생하는 실수

### 1. any 타입 남용

#### 문제점

`any`는 TypeScript의 모든 타입 체크를 무효화시킵니다.

#### 나쁜 예시

```typescript
// ❌ 타입 안전성 상실
function processData(data: any) {
  return data.map((item: any) => item.value); // 런타임 오류 가능
}

// ❌ 임시 해결책으로 any 사용
const result = JSON.parse(response) as any;
console.log(result.data.users[0].name); // 체크 없음

// ❌ 이벤트 핸들러에서 any
const handleClick = (e: any) => {
  e.target.value; // 타입 체크 없음
};
```

#### 올바른 해결책

```typescript
// ✅ unknown 사용 후 타입 가드
function processData(data: unknown): number[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  return data.map(item => {
    if (typeof item?.value !== 'number') {
      throw new Error('Invalid item structure');
    }
    return item.value;
  });
}

// ✅ 타입 정의 또는 Zod 스키마
interface ApiResponse {
  data: {
    users: Array<{
      name: string;
      email: string;
    }>;
  };
}

const result = JSON.parse(response) as ApiResponse;
// 또는
const result = ApiResponseSchema.parse(JSON.parse(response));

// ✅ 구체적인 이벤트 타입
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  const button = e.currentTarget;
  console.log(button.value);
};

// ✅ 제네릭으로 유연성 확보
function safeJsonParse<T>(json: string, validator: (data: unknown) => data is T): T {
  const parsed = JSON.parse(json);
  if (!validator(parsed)) {
    throw new Error('Invalid JSON structure');
  }
  return parsed;
}
```

### 2. 타입 단언 과용

#### 문제점

`as`를 과도하게 사용하면 타입 안전성을 해칩니다.

#### 나쁜 예시

```typescript
// ❌ 위험한 타입 단언
const user = {} as User; // user.name은 실제로 undefined
const id = 'abc123' as Id<'users'>; // 유효하지 않은 ID일 수 있음

// ❌ 이중 단언
const value = input as any as number; // 매우 위험

// ❌ Non-null assertion 남용
function getUser(id: string) {
  const user = users.find(u => u.id === id);
  return user!.name; // user가 없으면 런타임 오류
}
```

#### 올바른 해결책

```typescript
// ✅ 타입 가드 사용
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'email' in obj;
}

const user = parseUserData(data);
if (!isUser(user)) {
  throw new Error('Invalid user data');
}

// ✅ 유효성 검증 후 타입 단언
function toConvexId(value: string): Id<'users'> {
  if (!isValidConvexId(value)) {
    throw new Error(`Invalid Convex ID: ${value}`);
  }
  return value as Id<'users'>;
}

// ✅ 안전한 접근
function getUser(id: string): string | undefined {
  const user = users.find(u => u.id === id);
  return user?.name;
}

// ✅ 필요한 경우에만 제한적으로 사용
interface Window {
  // 전역 객체 확장
  myApp?: {
    version: string;
  };
}

const version = (window as Window).myApp?.version ?? 'unknown';
```

### 3. 옵셔널 체이닝 누락

#### 문제점

중첩된 객체 접근 시 undefined 체크를 놓치면 런타임 오류가 발생합니다.

#### 나쁜 예시

```typescript
// ❌ 위험한 접근
const city = user.address.city; // address가 undefined면 오류
const firstTag = post.tags[0].name; // tags가 빈 배열이면 오류

// ❌ 불완전한 체크
if (user.profile) {
  console.log(user.profile.settings.theme); // settings가 undefined일 수 있음
}

// ❌ 배열 메서드 체이닝
const names = users
  .filter(u => u.active)
  .map(u => u.profile.name) // profile이 undefined일 수 있음
  .join(', ');
```

#### 올바른 해결책

```typescript
// ✅ 옵셔널 체이닝 사용
const city = user?.address?.city ?? 'Unknown';
const firstTag = post?.tags?.[0]?.name ?? 'No tags';

// ✅ 완전한 체크
if (user.profile?.settings) {
  console.log(user.profile.settings.theme);
}

// ✅ 안전한 배열 처리
const names = users
  .filter(u => u.active)
  .map(u => u.profile?.name ?? 'Anonymous')
  .filter(Boolean) // undefined 제거
  .join(', ');

// ✅ 유틸리티 함수 활용
function getNestedValue<T>(obj: T, path: string, defaultValue: any = undefined): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key as keyof typeof current] ?? defaultValue;
  }, obj);
}

const theme = getNestedValue(user, 'profile.settings.theme', 'light');

// ✅ 타입 안전한 깊은 접근
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function mergeSettings<T>(base: T, override: DeepPartial<T>): T {
  // 구현...
}
```

### 4. 배열 메서드 체이닝 타입 변화

#### 문제점

배열 메서드를 체이닝할 때 각 단계의 타입 변화를 인지하지 못합니다.

#### 나쁜 예시

```typescript
// ❌ 타입 변화 미인지
const result = users
  .map(u => u.age)
  .filter(age => age > 18)
  .map(age => age.toString())
  .find(ageStr => ageStr.length > 2)
  .toUpperCase(); // find는 undefined를 반환할 수 있음

// ❌ filter의 타입 좁히기 실패
const numbers = [1, 2, null, 3, undefined, 4];
const doubled = numbers.filter(n => n !== null && n !== undefined).map(n => n * 2); // 여전히 n이 number | null | undefined

// ❌ 중간 결과 타입 확인 누락
const processed = data
  .split(',')
  .map(s => parseInt(s))
  .filter(n => !isNaN(n))
  .reduce((sum, n) => sum + n); // 초기값 없으면 undefined 가능
```

#### 올바른 해결책

```typescript
// ✅ 각 단계의 타입 인지
const result = users
  .map(u => u.age) // number[]
  .filter(age => age > 18) // number[]
  .map(age => age.toString()) // string[]
  .find(ageStr => ageStr.length > 2); // string | undefined

// 안전한 처리
const upperResult = result?.toUpperCase() ?? 'NOT_FOUND';

// ✅ Type predicate로 filter 타입 좁히기
const numbers = [1, 2, null, 3, undefined, 4];
const doubled = numbers.filter((n): n is number => n !== null && n !== undefined).map(n => n * 2); // n은 number 타입

// ✅ reduce 초기값 제공
const processed = data
  .split(',')
  .map(s => parseInt(s))
  .filter(n => !isNaN(n))
  .reduce((sum, n) => sum + n, 0); // 초기값 0 제공

// ✅ 파이프라인 함수로 타입 안전성 확보
type Pipeline<T, R> = (input: T) => R;

function pipe<T, R1>(input: T, f1: Pipeline<T, R1>): R1;
function pipe<T, R1, R2>(input: T, f1: Pipeline<T, R1>, f2: Pipeline<R1, R2>): R2;
// ... 더 많은 오버로드

function pipe(input: any, ...fns: Function[]) {
  return fns.reduce((acc, fn) => fn(acc), input);
}

// 사용 예시
const result = pipe(
  users,
  users => users.map(u => u.age),
  ages => ages.filter(age => age > 18),
  adults => adults.map(age => age.toString()),
  ageStrs => ageStrs.find(s => s.length > 2) ?? 'NONE'
);
```

## 디버깅 팁

### 1. VS Code 활용

#### 타입 정보 확인

```typescript
// 마우스 호버로 타입 확인
const data = getUserData(); // 호버 시 타입 표시

// Ctrl+K Ctrl+I로 타입 정보 팝업
const complexType = // 커서 위치에서 단축키

// F12로 타입 정의로 이동
import { User } from './types'; // User에서 F12

// Alt+F12로 타입 정의 미리보기
const user: User = // User에서 Alt+F12

// Shift+F12로 모든 참조 찾기
interface Product { // Product에서 Shift+F12
  id: string;
  name: string;
}
```

#### TypeScript 서버 관리

```bash
# Command Palette (Ctrl+Shift+P)
> TypeScript: Restart TS Server  # 타입 정보 새로고침
> TypeScript: Go to Project Configuration  # tsconfig.json 열기
> TypeScript: Select TypeScript Version  # 버전 선택
```

#### 문제 해결 팁

```typescript
// @ts-expect-error - 다음 줄의 에러 예상됨을 명시
// @ts-expect-error: Intentionally testing error case
const invalid: string = 123;

// @ts-ignore - 다음 줄의 에러 무시 (권장하지 않음)
// @ts-ignore: Legacy code, will fix later
const legacy = someOldFunction();

// 타입 체크 임시 비활성화 (파일 전체)
// @ts-nocheck

// 특정 영역만 체크
// @ts-check
```

### 2. 점진적 해결

#### 우선순위 전략

```typescript
// 1단계: 유틸리티 함수
// lib/utils/*.ts 파일부터 시작
export function formatDate(date: Date | string): string {
  // 타입 안전한 구현
}

// 2단계: 커스텀 Hook
// hooks/*.ts 파일 수정
export function useAuth(): AuthReturn {
  // 명확한 반환 타입
}

// 3단계: 하위 컴포넌트
// components/ui/*.tsx 수정
interface ButtonProps {
  // props 타입 정의
}

// 4단계: 페이지 컴포넌트
// app/**/page.tsx 수정
export default function Page(): JSX.Element {
  // 페이지 타입 안전성
}
```

#### 마이그레이션 전략

```typescript
// 기존 JavaScript 파일을 TypeScript로 전환
// 1. .js → .ts 확장자 변경
// 2. any 타입으로 시작
// 3. 점진적으로 구체적 타입으로 변경

// Step 1: Initial conversion
export function calculate(data: any): any {
  return data.value * 2;
}

// Step 2: Input type
interface CalculateInput {
  value: number;
}
export function calculate(data: CalculateInput): any {
  return data.value * 2;
}

// Step 3: Complete typing
export function calculate(data: CalculateInput): number {
  return data.value * 2;
}
```

### 3. 타입 오류 우선순위

#### 심각도별 분류

```typescript
// 🔴 높음: 런타임 오류 가능성
// - undefined/null 접근
// - 잘못된 타입 캐스팅
// - 누락된 필수 속성

// 🟡 중간: 타입 안전성 저하
// - any 타입 사용
// - 타입 단언 과용
// - 불완전한 타입 정의

// 🟢 낮음: 코드 품질
// - 사용하지 않는 변수
// - 암시적 any
// - 누락된 반환 타입
```

#### 체계적 접근

```bash
# 1. 전체 오류 수 확인
npm run type-check | grep "error" | wc -l

# 2. 파일별 오류 그룹화
npm run type-check | grep "error" | sort | uniq -c

# 3. 특정 오류 타입 필터링
npm run type-check | grep "possibly 'undefined'"

# 4. 점진적 수정
# tsconfig.json에서 임시로 규칙 완화
{
  "compilerOptions": {
    "strict": false,  // 임시
    "strictNullChecks": true  // 하나씩 활성화
  }
}
```

### 4. 일반적인 TypeScript 오류 메시지 해석

```typescript
// "Object is possibly 'undefined'"
// 해결: 옵셔널 체이닝 또는 null 체크
user?.profile?.name;

// "Property 'X' does not exist on type 'Y'"
// 해결: 타입 정의 확인 또는 타입 가드
if ('x' in y) {
  y.x;
}

// "Type 'X' is not assignable to type 'Y'"
// 해결: 타입 호환성 확인
const value: Y = x as Y; // 주의: 안전한지 확인

// "Cannot find name 'X'"
// 해결: import 또는 선언 확인
import { X } from './types';

// "An argument for 'X' was not provided"
// 해결: 필수 매개변수 제공
function fn(x: string, y?: number) {}
fn('hello'); // y는 선택적
```

## 실전 케이스 스터디

### Case 1: 복잡한 폼 처리

#### 문제 상황

다양한 입력 타입과 검증 규칙을 가진 복잡한 폼

#### 해결 과정

```typescript
// 1. 폼 데이터 타입 정의
interface OrderFormData {
  shopId: Id<'profiles'>;
  orderDate: string;
  items: OrderItem[];
  notes?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// 2. 검증 스키마 (Zod)
const OrderItemSchema = z.object({
  id: z.string(),
  productName: z.string().min(1, '상품명 필수'),
  quantity: z.number().min(1, '최소 1개'),
  unitPrice: z.number().min(0, '가격은 0 이상'),
  subtotal: z.number(),
});

const OrderFormSchema = z.object({
  shopId: z.string().regex(/^[a-zA-Z0-9]+$/),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(OrderItemSchema).min(1, '최소 1개 상품'),
  notes: z.string().optional(),
});

// 3. 폼 상태 관리
function useOrderForm() {
  const [formData, setFormData] = useState<Partial<OrderFormData>>({
    orderDate: new Date().toISOString().split('T')[0],
    items: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});

  const updateField = <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 필드별 즉시 검증
    validateField(field, value);
  };

  const validateField = <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
    try {
      OrderFormSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0]?.message,
        }));
      }
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    };

    updateField('items', [...(formData.items || []), newItem]);
  };

  const updateItem = (index: number, updates: Partial<OrderItem>) => {
    const items = [...(formData.items || [])];
    const currentItem = items[index];

    if (!currentItem) return;

    const updatedItem: OrderItem = {
      ...currentItem,
      ...updates,
      subtotal:
        (updates.quantity ?? currentItem.quantity) * (updates.unitPrice ?? currentItem.unitPrice),
    };

    items[index] = updatedItem;
    updateField('items', items);
  };

  const submit = async (): Promise<OrderFormData | null> => {
    try {
      const validated = OrderFormSchema.parse(formData);
      return validated as OrderFormData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof OrderFormData, string>> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as keyof OrderFormData;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return null;
    }
  };

  return {
    formData,
    errors,
    updateField,
    addItem,
    updateItem,
    submit,
  };
}
```

### Case 2: 실시간 데이터 동기화

#### 문제 상황

Convex 실시간 업데이트와 로컬 상태 동기화

#### 해결 과정

```typescript
// 1. 타입 안전한 실시간 훅
interface ClinicalCase {
  _id: Id<'clinical_cases'>;
  shopId: Id<'profiles'>;
  customerName: string;
  status: 'active' | 'completed';
  photos: Photo[];
  consentReceived: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Photo {
  _id: Id<'clinical_photos'>;
  caseId: Id<'clinical_cases'>;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploadedAt?: number;
}

// 2. 실시간 쿼리 훅
function useClinicalCases(shopId: string | undefined) {
  // Convex 실시간 쿼리
  const cases = useQuery(
    api.clinical.listCases,
    shopId ? { shopId: shopId as Id<'profiles'> } : 'skip'
  );

  // 로컬 상태 (임시 변경사항)
  const [localUpdates, setLocalUpdates] = useState<
    Map<Id<'clinical_cases'>, Partial<ClinicalCase>>
  >(new Map());

  // 병합된 데이터
  const mergedCases = useMemo(() => {
    if (!cases) return [];

    return cases.map(serverCase => {
      const localUpdate = localUpdates.get(serverCase._id);
      return localUpdate ? { ...serverCase, ...localUpdate } : serverCase;
    });
  }, [cases, localUpdates]);

  // 낙관적 업데이트
  const updateCase = useMutation(api.clinical.updateCase);

  const optimisticUpdate = useCallback(
    async (caseId: Id<'clinical_cases'>, updates: Partial<ClinicalCase>) => {
      // 1. 로컬 상태 즉시 업데이트
      setLocalUpdates(prev =>
        new Map(prev).set(caseId, {
          ...prev.get(caseId),
          ...updates,
        })
      );

      try {
        // 2. 서버 업데이트
        await updateCase({ caseId, updates });

        // 3. 성공 시 로컬 업데이트 제거 (서버 데이터로 대체)
        setLocalUpdates(prev => {
          const next = new Map(prev);
          next.delete(caseId);
          return next;
        });
      } catch (error) {
        // 4. 실패 시 로컬 업데이트 롤백
        setLocalUpdates(prev => {
          const next = new Map(prev);
          next.delete(caseId);
          return next;
        });

        throw error;
      }
    },
    [updateCase]
  );

  return {
    cases: mergedCases,
    loading: cases === undefined,
    updateCase: optimisticUpdate,
  };
}

// 3. 타입 안전한 사진 업로드
function usePhotoUpload() {
  const uploadFile = useMutation(api.files.generateUploadUrl);
  const createPhoto = useMutation(api.clinical.createPhoto);

  const uploadPhoto = useCallback(
    async (
      caseId: Id<'clinical_cases'>,
      roundDay: number,
      angle: 'front' | 'left' | 'right',
      file: File
    ): Promise<Photo> => {
      // 1. 파일 검증
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('파일 크기는 10MB 이하여야 합니다');
      }

      // 2. 업로드 URL 생성
      const uploadUrl = await uploadFile();

      // 3. 파일 업로드
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('파일 업로드 실패');
      }

      const { storageId } = await response.json();

      // 4. 메타데이터 저장
      const photoId = await createPhoto({
        caseId,
        roundDay,
        angle,
        storageId,
      });

      return {
        _id: photoId,
        caseId,
        roundDay,
        angle,
        imageUrl: undefined, // 서버에서 생성
        uploadedAt: Date.now(),
      };
    },
    [uploadFile, createPhoto]
  );

  return { uploadPhoto };
}
```

### Case 3: 복잡한 권한 시스템

#### 문제 상황

다층 권한 구조와 역할 기반 접근 제어

#### 해결 과정

```typescript
// 1. 권한 타입 정의
type Role = 'admin' | 'kol' | 'ol' | 'shop_owner' | 'guest';

interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

interface User {
  _id: Id<'users'>;
  email: string;
  role: Role;
  profileId?: Id<'profiles'>;
}

interface Profile {
  _id: Id<'profiles'>;
  userId: Id<'users'>;
  name: string;
  role: Role;
  parentId?: Id<'profiles'>;
  metadata?: Record<string, unknown>;
}

// 2. 권한 체크 시스템
class PermissionSystem {
  private static rolePermissions: Record<Role, Permission[]> = {
    admin: [
      { resource: '*', action: '*' }, // 모든 권한
    ],
    kol: [
      { resource: 'shop', action: 'read', conditions: { relationship: 'parent' } },
      { resource: 'shop', action: 'create' },
      { resource: 'order', action: 'read', conditions: { relationship: 'parent' } },
      { resource: 'commission', action: 'read', conditions: { own: true } },
    ],
    ol: [
      { resource: 'shop', action: 'read', conditions: { relationship: 'parent' } },
      { resource: 'order', action: 'read', conditions: { relationship: 'parent' } },
    ],
    shop_owner: [
      { resource: 'order', action: '*', conditions: { own: true } },
      { resource: 'clinical', action: '*', conditions: { own: true } },
    ],
    guest: [
      { resource: 'public', action: 'read' },
    ],
  };

  static canAccess(
    user: User & { profile?: Profile },
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): boolean {
    const permissions = this.rolePermissions[user.role] || [];

    return permissions.some(permission => {
      // 리소스 매칭
      if (permission.resource !== '*' && permission.resource !== resource) {
        return false;
      }

      // 액션 매칭
      if (permission.action !== '*' && permission.action !== action) {
        return false;
      }

      // 조건 체크
      if (permission.conditions) {
        return this.checkConditions(
          permission.conditions,
          user,
          context
        );
      }

      return true;
    });
  }

  private static checkConditions(
    conditions: Record<string, unknown>,
    user: User & { profile?: Profile },
    context?: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'own':
          if (value && context?.ownerId !== user._id) {
            return false;
          }
          break;

        case 'relationship':
          if (value === 'parent' && context?.parentId !== user.profile?._id) {
            return false;
          }
          break;

        default:
          if (context?.[key] !== value) {
            return false;
          }
      }
    }

    return true;
  }
}

// 3. 타입 안전한 권한 훅
function usePermissions() {
  const user = useUser();
  const profile = useProfile();

  const can = useCallback(
    (resource: string, action: string, context?: Record<string, unknown>) => {
      if (!user || !profile) return false;

      return PermissionSystem.canAccess(
        { ...user, profile },
        resource,
        action,
        context
      );
    },
    [user, profile]
  );

  const canAny = useCallback(
    (checks: Array<[string, string, Record<string, unknown>?]>) => {
      return checks.some(([resource, action, context]) =>
        can(resource, action, context)
      );
    },
    [can]
  );

  const canAll = useCallback(
    (checks: Array<[string, string, Record<string, unknown>?]>) => {
      return checks.every(([resource, action, context]) =>
        can(resource, action, context)
      );
    },
    [can]
  );

  return { can, canAny, canAll };
}

// 4. 권한 기반 컴포넌트
interface ProtectedProps {
  resource: string;
  action: string;
  context?: Record<string, unknown>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function Protected({
  resource,
  action,
  context,
  fallback = null,
  children
}: ProtectedProps) {
  const { can } = usePermissions();

  if (!can(resource, action, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 5. 사용 예시
function OrderManagement() {
  const { can } = usePermissions();
  const orders = useOrders();

  return (
    <div>
      <Protected resource="order" action="create">
        <Button>새 주문</Button>
      </Protected>

      {orders.map(order => (
        <OrderCard
          key={order._id}
          order={order}
          canEdit={can('order', 'update', { ownerId: order.shopId })}
          canDelete={can('order', 'delete', { ownerId: order.shopId })}
        />
      ))}
    </div>
  );
}
```

## 결론

TypeScript의 엄격한 타입 시스템은 초기 학습 곡선이 있지만, 장기적으로 보면 다음과 같은 이점을 제공합니다:

1. **버그 예방**: 컴파일 시점에 잠재적 오류 발견
2. **개발 속도**: IDE 지원으로 빠른 개발
3. **유지보수성**: 명확한 인터페이스와 문서화
4. **리팩토링**: 안전한 코드 변경
5. **팀 협업**: 타입을 통한 의사소통

이 가이드의 패턴과 해결책들을 프로젝트에 적용하여 타입 안전한 코드베이스를 구축하시기 바랍니다. TypeScript는 단순한 도구가 아니라 더 나은 코드를 작성하도록 돕는 파트너입니다.

기억하세요: **타입 오류는 버그가 아니라 버그를 예방하는 친구입니다.** 🛡️
