# 🧪 통합 테스트 가이드

## 📋 개요

이 문서는 BioFox KOL 플랫폼의 통합 테스트 시스템에 대한 포괄적인 가이드입니다. 통합 테스트는 실제 비즈니스 시나리오를 시뮬레이션하여 시스템의 end-to-end 동작을 검증합니다.

## 🏗️ 테스트 아키텍처

### 테스트 프레임워크

- **Convex Test**: Convex 백엔드 함수의 통합 테스트
- **Vitest**: 모던 JavaScript 테스트 러너
- **Edge Runtime**: Convex 함수 실행 환경 시뮬레이션

### 테스트 구조

```
__tests__/integration/
├── user-onboarding-flow.test.ts     # 사용자 온보딩 플로우 (5 tests)
├── shop-relationship-flow.test.ts   # 매장 관계 관리 플로우 (6 tests)
├── order-processing-flow.test.ts    # 주문 처리 플로우 (7 tests)
├── product-management-flow.test.ts  # 상품 관리 플로우 (7 tests)
└── user-api.integration.test.ts     # 레거시 API 테스트 (기존)
```

## 🎯 핵심 테스트 플로우

### 1. 사용자 온보딩 플로우 (User Onboarding Flow)

**목적**: 새로운 사용자가 시스템에 가입하고 승인받기까지의 전체 워크플로우 검증

**테스트 시나리오**:

- ✅ **완전한 매장 오너 온보딩**: 가입 → 프로필 생성 → 관리자 승인 → 상태 검증
- ✅ **KOL 온보딩 워크플로우**: KOL 특화 가입 프로세스 및 수수료 설정
- ✅ **검증 오류 처리**: 잘못된 이메일, 빈 이름 등 유효성 검사
- ✅ **프로필 거절 워크플로우**: 관리자 거절 프로세스 및 상태 관리
- ✅ **동시 다중 사용자 온보딩**: 동시성 및 데이터 무결성 검증

**핵심 비즈니스 로직**:

- 프로필 자동 생성 및 pending 상태 설정
- 관리자 승인/거절 프로세스
- 프로필 완성도 계산
- 역할별 차별화된 온보딩

### 2. 매장 관계 관리 플로우 (Shop Relationship Management)

**목적**: KOL과 매장 오너 간의 계층적 관계 관리 시스템 검증

**테스트 시나리오**:

- ✅ **KOL-매장 관계 설정**: 직접 관계 생성 및 하위 매장 관리
- ✅ **KOL 간 관계 이전**: 매장의 상위 KOL 변경 프로세스
- ✅ **다단계 계층 구조**: 상위 KOL → 중간 KOL → 매장 오너 구조
- ✅ **관계 활성화/비활성화**: 관계 상태 관리 및 히스토리 추적
- ✅ **중복 관계 검증**: 여러 KOL이 동일 매장 관리 시나리오
- ✅ **관계 히스토리 및 감사**: 관계 변경 이력 추적

**핵심 비즈니스 로직**:

- 계층적 관계 구조 관리
- 관계 이전 및 변경 프로세스
- 활성/비활성 상태 관리
- 관계 히스토리 추적

### 3. 주문 처리 플로우 (Order Processing Flow)

**목적**: 주문 생성부터 수수료 계산, 상태 관리까지의 전체 주문 처리 워크플로우 검증

**테스트 시나리오**:

- ✅ **기본 주문 처리**: 주문 생성 → 수수료 계산 → 완료 → 지급
- ✅ **수수료 조정 처리**: 대량 주문 시 수수료율 동적 조정
- ✅ **주문 취소 및 환불**: 취소 프로세스 및 수수료 처리
- ✅ **일일 배치 처리**: 여러 주문의 집계 및 통계 계산
- ✅ **자체 매장 주문**: KOL 직영샵 주문 (수수료 없음) 처리
- ✅ **복잡한 메타데이터**: VIP 고객, 프로모션, 배송 정보 관리
- ✅ **수수료 상태 라이프사이클**: calculated → adjusted → paid → cancelled

**핵심 비즈니스 로직**:

- 동적 수수료 계산 및 조정
- 주문 상태 관리 (pending → completed → paid)
- 자체 매장 주문 특별 처리
- 메타데이터 및 고객 정보 관리

### 4. 상품 관리 플로우 (Product Management Flow)

**목적**: 상품 등록, 카테고리 관리, 활성화/비활성화 등의 전체 상품 관리 워크플로우 검증

**테스트 시나리오**:

- ✅ **완전한 상품 생성**: 기본 정보, 이미지, 수수료율 설정
- ✅ **카테고리별 관리**: 5개 카테고리별 상품 분류 및 필터링
- ✅ **상품 활성화/비활성화**: 상품 상태 관리 및 조회 필터링
- ✅ **수수료율 관리**: 기본/최소/최대 수수료율 설정 및 검증
- ✅ **검색 및 정렬**: 가격순, 정렬순, 추천 상품 필터링
- ✅ **복잡한 사양 관리**: 성분, 사용법, 인증, 보관법 등 상세 정보
- ✅ **재고 관리**: 재고 수량, 예약, 재주문 레벨 관리

**핵심 비즈니스 로직**:

- 다차원 상품 분류 및 검색
- 동적 수수료율 관리
- 복잡한 상품 사양 및 메타데이터
- 재고 및 가용성 관리

## 🛠️ 테스트 실행 방법

### 개별 테스트 파일 실행

```bash
# 사용자 온보딩 플로우
npm run test __tests__/integration/user-onboarding-flow.test.ts

# 매장 관계 관리 플로우
npm run test __tests__/integration/shop-relationship-flow.test.ts

# 주문 처리 플로우
npm run test __tests__/integration/order-processing-flow.test.ts

# 상품 관리 플로우
npm run test __tests__/integration/product-management-flow.test.ts
```

### 전체 통합 테스트 실행

```bash
# 모든 통합 테스트 실행
npm run test __tests__/integration/

# 상세 출력과 함께 실행
npx vitest run __tests__/integration/ --reporter=verbose

# 커버리지와 함께 실행
npx vitest run __tests__/integration/ --coverage
```

### NPM 스크립트 사용

```bash
# 단위 테스트 (Convex 함수 제외)
npm run test:unit

# Convex 함수 단위 테스트
npm run test:convex

# 전체 테스트 스위트
npm run test:all
```

## 📊 테스트 결과 해석

### 성공적인 테스트 실행 예시

```
✓ __tests__/integration/user-onboarding-flow.test.ts     (5 tests) 12ms
✓ __tests__/integration/shop-relationship-flow.test.ts  (6 tests) 38ms
✓ __tests__/integration/order-processing-flow.test.ts   (7 tests) 28ms
✓ __tests__/integration/product-management-flow.test.ts (7 tests) 30ms

Test Files  4 passed (4)
Tests      25 passed (25)
Duration   1.93s
```

### 테스트 메트릭스

- **총 통합 테스트**: 25개
- **테스트 파일**: 4개
- **평균 실행 시간**: < 2초
- **커버리지**: 핵심 비즈니스 플로우 100%

## 🔧 테스트 환경 설정

### 필수 의존성

```json
{
  "devDependencies": {
    "convex-test": "^0.2.1",
    "@edge-runtime/vm": "^3.0.3",
    "vitest": "^1.6.1",
    "@vitest/ui": "^1.6.1"
  }
}
```

### Vitest 설정 (vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [
      ['convex/**', 'edge-runtime'], // Convex 함수는 edge-runtime 환경
      ['**', 'jsdom'], // 나머지는 jsdom 환경
    ],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
  },
});
```

## 🚀 테스트 작성 가이드라인

### 1. 테스트 구조

```typescript
describe('Feature Flow Integration Tests', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  // 헬퍼 함수들
  async function createTestUser(name: string, email: string) {
    // 공통 테스트 데이터 생성 로직
  }

  test('Complete workflow test', async () => {
    // 1. 테스트 데이터 준비
    // 2. 비즈니스 로직 실행
    // 3. 결과 검증
    // 4. 상태 변경 확인
  });
});
```

### 2. 테스트 데이터 관리

- **격리된 테스트 환경**: 각 테스트는 독립적인 데이터베이스 상태
- **의미있는 테스트 데이터**: 실제 비즈니스 시나리오 반영
- **헬퍼 함수 활용**: 공통 테스트 데이터 생성 로직 재사용

### 3. 검증 패턴

```typescript
// 1. 객체 구조 검증
expect(result).toMatchObject({
  status: 'approved',
  commission_rate: 0.08,
});

// 2. 배열 길이 및 내용 검증
expect(orders).toHaveLength(3);
expect(orders.every(order => order.status === 'completed')).toBe(true);

// 3. 시간 기반 검증
expect(profile.created_at).toBeGreaterThanOrEqual(startTime);

// 4. 상태 변경 검증
const beforeState = await getState();
await performAction();
const afterState = await getState();
expect(afterState.count).toBe(beforeState.count + 1);
```

## 🔍 디버깅 및 트러블슈팅

### 일반적인 문제들

1. **타입 오류 (TypeScript)**

   ```typescript
   // 해결책: eslint-disable 주석 추가
   /* eslint-disable @typescript-eslint/no-explicit-any */
   ```

2. **Convex 스키마 불일치**

   ```bash
   # 해결책: 스키마 재생성
   npx convex dev --once
   ```

3. **테스트 타임아웃**
   ```typescript
   // 해결책: 테스트 타임아웃 증가
   test(
     'long running test',
     async () => {
       // 테스트 내용
     },
     { timeout: 10000 }
   );
   ```

### 디버깅 도구

```bash
# 상세 로그와 함께 테스트 실행
npx vitest run --reporter=verbose

# 단일 테스트 파일 디버깅
npx vitest run specific-test.test.ts --reporter=verbose

# 테스트 UI 사용
npx vitest --ui
```

## 📈 성능 최적화

### 테스트 실행 시간 최적화

- **병렬 실행**: Vitest의 기본 병렬 처리 활용
- **효율적인 테스트 데이터**: 최소한의 데이터로 최대 검증 효과
- **적절한 테스트 분리**: 독립적이면서도 의미있는 테스트 단위

### 메모리 사용량 최적화

- **beforeEach 활용**: 각 테스트마다 깨끗한 상태 보장
- **적절한 정리**: 대용량 테스트 데이터 정리
- **헬퍼 함수 재사용**: 코드 중복 최소화

## 🎯 앞으로의 계획

### 추가 예정 테스트

- [ ] **알림 시스템 플로우**: 푸시 알림, 이메일 알림 통합 테스트
- [ ] **결제 처리 플로우**: 결제 게이트웨이 연동 테스트
- [ ] **보고서 생성 플로우**: 수수료 보고서, 매출 통계 테스트
- [ ] **권한 관리 플로우**: 역할 기반 접근 제어 테스트

### 테스트 품질 향상

- [ ] **테스트 커버리지 향상**: 엣지 케이스 추가 커버
- [ ] **성능 테스트 추가**: 대용량 데이터 처리 성능 검증
- [ ] **보안 테스트 통합**: 인증/인가 보안 검증
- [ ] **API 계약 테스트**: 프론트엔드-백엔드 인터페이스 검증

---

이 통합 테스트 시스템은 BioFox KOL 플랫폼의 핵심 비즈니스 로직을 포괄적으로 검증하여 안정적이고 신뢰할 수 있는 서비스 제공을 보장합니다.
