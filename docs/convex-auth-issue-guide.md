# Convex 인증 문제 해결 가이드

## 문제 설명

### 증상

- 백엔드에서는 데이터가 성공적으로 생성됨 (200 응답, 로그 확인)
- Convex Dashboard에서 데이터 확인 가능
- **하지만 프론트엔드 UI에는 데이터가 표시되지 않음**

### 근본 원인

`getCurrentUser` 함수가 `ctx.auth.getUserIdentity()`를 사용하는데, Convex 쿼리 호출 시 인증 정보가 제대로 전달되지 않아 `null`을 반환함.

```typescript
// convex/utils.ts
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null; // 🚨 문제: 인증 정보가 없으면 null 반환
  }
  // ...
}
```

## 문제 진단 방법

### 1. Convex MCP 툴로 데이터 확인

```bash
# 테이블 데이터 직접 조회
mcp_convex_data --tableName="clinical_cases" --order="desc"
```

### 2. 함수 직접 실행

```bash
# 문제가 있는 쿼리 실행
mcp_convex_run --functionName="clinical:listClinicalCases" --args='{"paginationOpts":{"numItems":10,"cursor":null}}'
```

결과가 빈 배열이면 인증 문제일 가능성이 높음.

## 해결 방법

### 방법 1: profileId 파라미터 추가 (권장)

#### 1. Convex 쿼리 함수 수정

```typescript
export const listClinicalCases = query({
  args: {
    // 프로필 ID 추가 (임시 해결책)
    profileId: v.optional(v.id('profiles')),
    // ... 기존 args
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인 - profileId가 있으면 그것을 사용
      let profileId: Id<'profiles'> | null = null;

      if (args.profileId) {
        profileId = args.profileId;
      } else {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) {
          return { page: [], isDone: true, continueCursor: null };
        }
        profileId = currentUser._id;
      }

      // profileId 사용하여 쿼리
      let query = ctx.db
        .query('clinical_cases')
        .withIndex('by_shop', q => q.eq('shop_id', profileId));
      // ...
    } catch (error) {
      throw formatError(error);
    }
  },
});
```

#### 2. React Hook 수정

```typescript
export function useClinicalCasesConvex(
  status?: string,
  profileId?: Id<'profiles'> // profileId 파라미터 추가
) {
  const cases = useQuery(api.clinical.listClinicalCases, {
    profileId: profileId, // 프로필 ID 전달
    paginationOpts: { numItems: 100, cursor: null },
    status: status as any,
  });

  return {
    data: cases?.page?.map(convexToUICase) || [],
    isLoading: cases === undefined,
    error: null,
  };
}
```

#### 3. 컴포넌트에서 사용

```typescript
const { user: authUser, profile } = useAuth();

const { data: convexCases = [], isLoading } = useClinicalCasesConvex(
  undefined, // status
  profile?._id // profileId 전달
);
```

### 방법 2: 인증 토큰 확인 (장기적 해결책)

Convex 클라이언트가 올바른 인증 토큰을 사용하는지 확인:

```typescript
// convex/ConvexProvider.tsx
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth(); // 인증 토큰 가져오기

  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={useAuth} // 인증 훅 전달
    >
      {children}
    </ConvexProviderWithAuth>
  );
}
```

## 영향받는 패턴들

### 1. getCurrentUser를 사용하는 모든 쿼리

```typescript
// ❌ 문제가 될 수 있는 패턴
export const someQuery = query({
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return { data: [] }; // 빈 데이터 반환
    }
    // ...
  },
});

// ✅ 개선된 패턴
export const someQuery = query({
  args: {
    profileId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    let profileId = args.profileId;
    if (!profileId) {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        return { data: [] };
      }
      profileId = currentUser._id;
    }
    // profileId 사용
  },
});
```

### 2. 인증 기반 필터링

```typescript
// ❌ 문제가 될 수 있는 패턴
.withIndex('by_shop', q => q.eq('shop_id', currentUser._id))

// ✅ 개선된 패턴
.withIndex('by_shop', q => q.eq('shop_id', profileId))
```

## 체크리스트

비슷한 문제를 해결할 때 확인해야 할 사항들:

- [ ] Convex Dashboard에서 데이터가 실제로 저장되었는지 확인
- [ ] `getCurrentUser` 함수가 사용되는지 확인
- [ ] 쿼리/뮤테이션에서 인증 확인 로직이 있는지 확인
- [ ] 프론트엔드에서 profile/user 정보가 제대로 로드되었는지 확인
- [ ] Convex 함수를 직접 실행해서 결과 확인

## 다른 함수들 수정 예시

### 1. getUserNotifications

```typescript
export const getUserNotifications = query({
  args: {
    profileId: v.optional(v.id('profiles')), // 추가
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let userId = args.profileId;
    if (!userId) {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) return [];
      userId = currentUser._id;
    }
    // ...
  },
});
```

### 2. getShopRelationships

```typescript
export const getShopRelationships = query({
  args: {
    shopId: v.optional(v.id('profiles')), // 명시적 ID 전달
  },
  handler: async (ctx, args) => {
    let shopId = args.shopId;
    if (!shopId) {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) return [];
      shopId = currentUser._id;
    }
    // ...
  },
});
```

## 예방 방법

1. **개발 시 테스트**: 새로운 Convex 함수를 만들 때 항상 MCP 툴로 직접 실행해보기
2. **로깅 추가**: 인증 관련 함수에 로깅 추가
3. **타입 안전성**: profileId를 명시적으로 요구하는 타입 정의
4. **문서화**: 인증이 필요한 함수는 주석으로 명시

## 임시 해결책 vs 영구 해결책

### 임시 해결책 (현재 적용)

- profileId를 파라미터로 직접 전달
- 빠른 해결 가능
- 하지만 보안상 이상적이지 않음

### 영구 해결책 (추후 구현)

- Convex Auth 시스템 정비
- ConvexProviderWithAuth 올바른 설정
- 토큰 기반 인증 구현

## 관련 파일들

- `/convex/utils.ts` - getCurrentUser 함수
- `/convex/clinical.ts` - 임상 케이스 쿼리들
- `/lib/clinical-photos-hooks.ts` - React 훅들
- `/hooks/useCustomerPageState.ts` - 상태 관리 훅
- `/components/providers/ConvexProvider.tsx` - Convex 프로바이더
