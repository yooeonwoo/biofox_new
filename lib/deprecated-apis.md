# 🚨 Deprecated APIs 정리

이 문서는 Convex 마이그레이션으로 인해 더 이상 사용되지 않는 API들을 정리합니다.

## ⚠️ 완전 Deprecated (즉시 교체 권장)

### 📁 **Clinical Photos APIs**

- **파일**: `lib/clinical-photos-api.ts`
- **상태**: ⚠️ DEPRECATED
- **대체제**: `lib/clinical-photos-convex.ts`
- **마이그레이션**: 완료
- **설명**: 777줄의 거대한 Supabase 직접 호출 파일을 React Query + Convex 조합으로 대체

```typescript
// ❌ 구형 (Deprecated)
import { fetchCases, createCase, uploadPhoto } from '@/lib/clinical-photos-api';

// ✅ 신규 (Convex)
import {
  useClinicalCases,
  useCreateClinicalCase,
  useUploadClinicalPhoto,
} from '@/lib/clinical-photos-convex';
```

### 📁 **Customer Management APIs**

- **파일들**:
  - `lib/hooks/customer-crud.ts` ⚠️ DEPRECATED
  - `lib/hooks/customer-info.ts` ⚠️ DEPRECATED
  - `lib/hooks/customers.ts` ⚠️ DEPRECATED (리다이렉트 버전)
- **대체제**: `hooks/useCustomers.ts`
- **마이그레이션**: 완료

```typescript
// ❌ 구형 (Deprecated)
import { useCreateCustomer, useDeleteCustomer } from '@/lib/hooks/customer-crud';
import { useUpdateCustomerInfo } from '@/lib/hooks/customer-info';

// ✅ 신규 (Convex)
import { useCreateCustomer, useDeleteCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
```

### 📁 **Clinical Photos Service**

- **파일**: `lib/clinical-photos-service.ts`
- **상태**: ⚠️ DEPRECATED
- **대체제**: `lib/clinical-photos-convex.ts` 훅들
- **마이그레이션**: 완료

```typescript
// ❌ 구형 (Deprecated)
import { fetchPersonalCase, ensurePersonalCaseExists } from '@/lib/clinical-photos-service';

// ✅ 신규 (Convex)
import { useEnsurePersonalCase, useCustomerCases } from '@/lib/clinical-photos-convex';
```

## ⚠️ 부분 Deprecated (점진적 교체)

### 📁 **Admin Hooks**

- **파일들**:
  - `lib/hooks/adminNewKols.ts` ⚠️ DEPRECATED
  - `lib/hooks/shops.ts` ⚠️ DEPRECATED
  - `lib/hooks/adminShopDetail.ts` ⚠️ DEPRECATED
- **대체제들**: 각각 `-convex.ts` 버전
- **마이그레이션**: 훅은 완료, 컴포넌트 전환 부분 완료

```typescript
// ❌ 구형 (Deprecated)
import { useAdminNewKols } from '@/lib/hooks/adminNewKols';
import { useShops, useCreateShop } from '@/lib/hooks/shops';
import { useAdminShopDetail } from '@/lib/hooks/adminShopDetail';

// ✅ 신규 (Convex)
import { useAdminNewKols, useAdminKolStats } from '@/lib/hooks/adminNewKols-convex';
import { useShops, useCreateShop } from '@/lib/hooks/shops-convex';
import { useAdminShopDetail, useShopDeviceStats } from '@/lib/hooks/adminShopDetail-convex';
```

## 🔄 향후 Deprecated 예정

### 📁 **Legacy API Endpoints**

이 엔드포인트들은 Convex 대응이 존재하지만 아직 호환성을 위해 유지 중입니다:

- `/api/profiles` → `api.profiles.*` (Convex)
- `/api/admin-new/shops/*` → shops-convex.ts 훅들
- `/api/admin-new/kols/*` → adminNewKols-convex.ts 훅들

### 📁 **Auth Related APIs**

신중한 접근이 필요한 인증 관련 APIs:

- `/api/user` → 향후 Convex Auth 전환 시 deprecated 예정

## 🚀 마이그레이션 가이드

### **1단계: Import 경로 변경**

```typescript
// Before
import { useAdminNewKols } from '@/lib/hooks/adminNewKols';

// After
import { useAdminNewKols } from '@/lib/hooks/adminNewKols-convex';
```

### **2단계: 타입 변경 (ID number → string)**

```typescript
// Before
interface Props {
  kolId: number | null;
  onSelect: (id: number) => void;
}

// After
interface Props {
  kolId: string | null;
  onSelect: (id: string) => void;
}
```

### **3단계: 데이터 구조 변경 (snake_case → camelCase)**

```typescript
// Before
shop.shop_name;
shop.kol_name;
shop.latest_allocation;

// After
shop.shopName;
shop.kolName; // 또는 shop.parentKol?.name
shop.latestAllocation;
```

### **4단계: Hook 패턴 변경**

```typescript
// Before (React Query 패턴)
const { data, isLoading, isError, mutate } = useCreateShop();

// After (Convex 패턴)
const { data, isLoading, isError } = useShops(); // 조회
const { mutate } = useCreateShop(); // 생성 (React Query + ConvexHttpClient)
```

## 🎯 완전 제거 타임라인

### **Phase 1: 즉시 (완료)**

- [x] clinical-photos-api.ts 사용 중단
- [x] customer-crud.ts, customer-info.ts 사용 중단
- [x] clinical-photos-service.ts 사용 중단

### **Phase 2: 단기 (1-2주)**

- [ ] UI 컴포넌트들의 Convex 훅 전환 완료
- [ ] adminNewShops.ts 사용 중단
- [ ] 모든 lib/hooks/\*-convex.ts 파일들을 정식 파일명으로 변경

### **Phase 3: 중기 (1개월)**

- [ ] Legacy API 엔드포인트들 deprecated 마킹
- [ ] 관련 없는 API 엔드포인트들 정리
- [ ] 전체 시스템 안정성 검증

### **Phase 4: 장기 (분기별)**

- [ ] Auth 시스템 Convex 전환 검토
- [ ] 완전한 Convex 기반 아키텍처 구축
- [ ] Legacy 코드 완전 제거

---

**마지막 업데이트**: 2024년 12월 (Convex 마이그레이션 상태 정리)
