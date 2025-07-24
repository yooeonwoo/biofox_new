# BIOFOX KOL 시스템 - 제한사항 및 개선 계획

## 📋 목차

1. [현재 시스템 제한사항](#현재-시스템-제한사항)
2. [기술적 제약사항](#기술적-제약사항)
3. [비즈니스 로직 제한사항](#비즈니스-로직-제한사항)
4. [성능 및 확장성 제한사항](#성능-및-확장성-제한사항)
5. [보안 및 컴플라이언스 제한사항](#보안-및-컴플라이언스-제한사항)
6. [사용자 경험 제한사항](#사용자-경험-제한사항)
7. [향후 개선 계획](#향후-개선-계획)
8. [알려진 버그 및 이슈](#알려진-버그-및-이슈)

---

## 🚨 현재 시스템 제한사항

### 1. 마이그레이션 관련 제한사항

#### A. 데이터 마이그레이션 제한사항

- **이중 시스템 운영**: Xano(기존) + Convex(신규) 동시 운영으로 인한 데이터 동기화 복잡성
- **기존 API 의존성**: 일부 기존 Next.js API 라우트들이 아직 Supabase/Xano에 의존
- **데이터 불일치 가능성**: 마이그레이션 과정에서 실시간 동기화 미보장

```typescript
// 현재 상황: 이중 데이터 소스
// 1. Convex (신규 기능)
const profiles = useQuery(api.profiles.getProfiles);

// 2. 기존 API (레거시 기능)
const legacyData = await fetch('/api/legacy/users');
```

#### B. 기능 일관성 제한사항

- **혼재된 인증 시스템**: Convex Auth와 기존 Supabase Auth 혼재
- **불완전한 실시간 기능**: 모든 기능이 아직 실시간 업데이트를 지원하지 않음
- **API 응답 형식 차이**: 기존 API와 Convex API 응답 형식 불일치

### 2. Convex 플랫폼 제한사항

#### A. 스키마 및 데이터베이스 제한사항

- **스키마 변경 제약**: 프로덕션 환경에서 스키마 변경 시 복잡한 마이그레이션 필요
- **복잡한 쿼리 제한**: SQL 대비 복잡한 조인 및 집계 쿼리 작성의 어려움
- **트랜잭션 제한**: 복잡한 멀티-테이블 트랜잭션 지원 제한

```typescript
// 제한사항 예시: 복잡한 조인 쿼리
// SQL에서는 간단하지만 Convex에서는 복잡함
// SELECT p.*, s.shop_name FROM profiles p
// JOIN shop_relationships sr ON p.id = sr.shop_owner_id
// JOIN profiles s ON sr.parent_id = s.id
// WHERE p.status = 'approved' AND s.region = 'Seoul'

// Convex에서는 여러 단계의 쿼리 필요
export const getProfilesWithShopInfo = query({
  handler: async ctx => {
    const profiles = await ctx.db
      .query('profiles')
      .filter(q => q.eq(q.field('status'), 'approved'))
      .collect();

    // 추가적인 관계 데이터 조회 필요
    const enrichedProfiles = await Promise.all(
      profiles.map(async profile => {
        const relationship = await ctx.db
          .query('shop_relationships')
          .filter(q => q.eq(q.field('shop_owner_id'), profile._id))
          .first();
        // ... 복잡한 로직
      })
    );
  },
});
```

#### B. 파일 업로드 및 저장 제한사항

- **파일 크기 제한**: 단일 파일 업로드 20MB 제한
- **파일 타입 제한**: 특정 파일 형식만 지원
- **저장소 용량**: Convex 저장소 용량 제한 (플랜에 따라)

#### C. 함수 실행 제한사항

- **실행 시간 제한**: 단일 함수 최대 실행 시간 제한 (10초)
- **메모리 제한**: 함수당 메모리 사용량 제한
- **동시 실행 제한**: 동시 함수 실행 수 제한

---

## 🔧 기술적 제약사항

### 1. 프론트엔드 제약사항

#### A. 실시간 업데이트 제한사항

```typescript
// 제한사항: 모든 컴포넌트가 실시간 업데이트를 지원하지 않음
// 일부는 여전히 polling 방식 사용
const [data, setData] = useState();

useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/legacy/data').then(setData); // 비효율적
  }, 5000);
  return () => clearInterval(interval);
}, []);

// 목표: 모든 데이터를 실시간으로 전환
const data = useQuery(api.example.getData); // 실시간 업데이트
```

#### B. 상태 관리 복잡성

- **혼재된 상태 관리**: Zustand, React Query, Convex useQuery 혼재 사용
- **캐시 일관성**: 다양한 데이터 소스 간 캐시 동기화 문제
- **상태 동기화**: 클라이언트-서버 간 상태 불일치 가능성

#### C. 모바일 반응형 제한사항

- **완벽하지 않은 모바일 UX**: 일부 복잡한 화면의 모바일 최적화 미완료
- **터치 인터페이스**: 터치 제스처 지원 제한적
- **오프라인 지원**: 오프라인 상황에서의 기능 지원 없음

### 2. 백엔드 제약사항

#### A. 데이터 검증 제한사항

```typescript
// 현재: 기본적인 Convex 검증만 사용
export const createProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(), // 단순한 문자열 검증
    age: v.number(),
  },
  handler: async (ctx, args) => {
    // 비즈니스 로직 검증 부족
  },
});

// 개선 필요: 복잡한 비즈니스 규칙 검증
// - 이메일 형식 검증
// - 중복 이메일 체크
// - 나이 범위 검증
// - 권한 기반 접근 제어
```

#### B. 에러 핸들링 제한사항

- **일관성 없는 에러 형식**: 다양한 에러 응답 형식 혼재
- **에러 코드 체계 부족**: 표준화된 에러 코드 시스템 없음
- **로깅 및 모니터링**: 포괄적인 에러 추적 시스템 부족

#### C. 권한 관리 제한사항

- **세밀한 권한 제어 제한**: 복잡한 역할 기반 접근 제어(RBAC) 구현 복잡성
- **동적 권한 할당**: 실시간 권한 변경 및 적용의 어려움
- **감사 로그**: 권한 변경 및 접근 기록의 제한적 추적

---

## 🏢 비즈니스 로직 제한사항

### 1. KOL-매장 관계 관리 제한사항

#### A. 계층 구조 제한사항

```typescript
// 현재 제한사항: 단순한 2단계 계층만 지원
// KOL -> Shop Owner (더 복잡한 계층 구조 미지원)

// 향후 필요: 다단계 계층 구조
// KOL -> Regional Manager -> Shop Manager -> Shop Owner
interface ShopRelationship {
  shop_owner_id: string;
  parent_id?: string; // 현재: 단일 부모만 지원
  // level: number; // 필요: 계층 레벨 추가
  // hierarchy_path: string[]; // 필요: 전체 계층 경로
}
```

#### B. 수수료 계산 제한사항

- **단순한 수수료 구조**: 복잡한 다단계 수수료 계산 로직 미구현
- **실시간 수수료 업데이트**: 수수료 변경 시 기존 주문에 대한 영향 처리 복잡성
- **수수료 정산 자동화**: 월말 정산 프로세스의 수동 개입 필요

### 2. 주문 관리 제한사항

#### A. 주문 상태 관리

- **복잡한 워크플로우 미지원**: 단순한 주문 상태만 지원 (pending, approved, completed 등)
- **부분 배송**: 부분 배송 및 분할 주문 처리 미구현
- **반품/교환**: 복잡한 반품 및 교환 프로세스 미완성

#### B. 재고 관리 연동

- **실시간 재고 동기화**: 외부 재고 시스템과의 실시간 연동 부족
- **재고 예약**: 주문 시 재고 예약 시스템 미구현
- **재고 알림**: 재고 부족 시 자동 알림 시스템 제한적

### 3. CRM 시스템 제한사항

#### A. 10단계 CRM 프로세스

```typescript
// 현재: 기본적인 CRM 카드 관리만 구현
interface CrmCard {
  id: string;
  profile_id: string;
  step: number; // 1-10 단계
  status: 'pending' | 'completed';
  // 제한사항: 복잡한 단계별 워크플로우 로직 부족
}

// 개선 필요:
// - 단계별 자동 진행 조건
// - 단계별 알림 시스템
// - 단계별 성과 측정
// - 개인화된 CRM 프로세스
```

#### B. 고객 분석 및 인사이트

- **고급 분석 부족**: 고객 행동 패턴 분석 기능 미구현
- **예측 모델링**: 고객 생애 가치(LTV) 예측 시스템 없음
- **개인화**: 개인화된 추천 시스템 부족

---

## ⚡ 성능 및 확장성 제한사항

### 1. 데이터베이스 성능 제한사항

#### A. 쿼리 최적화

```typescript
// 현재 제한사항: 비효율적인 쿼리 패턴
export const getProfilesWithStats = query({
  handler: async ctx => {
    const profiles = await ctx.db.query('profiles').collect();

    // N+1 쿼리 문제
    const profilesWithStats = await Promise.all(
      profiles.map(async profile => {
        const orders = await ctx.db
          .query('orders')
          .filter(q => q.eq(q.field('profile_id'), profile._id))
          .collect(); // 각 프로필마다 별도 쿼리

        return {
          ...profile,
          orderCount: orders.length,
        };
      })
    );

    return profilesWithStats;
  },
});

// 개선 필요: 배치 처리 및 쿼리 최적화
```

#### B. 실시간 업데이트 성능

- **과도한 리렌더링**: 불필요한 컴포넌트 리렌더링 발생
- **메모리 사용량**: 실시간 구독이 많을 때 메모리 사용량 증가
- **네트워크 트래픽**: 실시간 업데이트로 인한 네트워크 부하

### 2. 클라이언트 성능 제한사항

#### A. 번들 크기

- **큰 번들 크기**: 여러 라이브러리 사용으로 인한 JavaScript 번들 크기 증가
- **코드 분할 미완성**: 라우트별 코드 분할 최적화 미완료
- **이미지 최적화**: 이미지 압축 및 최적화 시스템 부족

#### B. 사용자 인터페이스 성능

- **큰 테이블 렌더링**: 많은 데이터를 포함한 테이블의 느린 렌더링
- **가상화 부족**: 긴 목록에 대한 가상화 미구현
- **레이아웃 이동**: 컨텐츠 로딩 시 레이아웃 이동(CLS) 발생

---

## 🔒 보안 및 컴플라이언스 제한사항

### 1. 인증 및 권한 관리

#### A. 세션 관리 제한사항

```typescript
// 현재 제한사항: 기본적인 Convex Auth만 사용
// 고급 세션 관리 기능 부족:
// - 세션 타임아웃 커스터마이징
// - 동시 로그인 제한
// - 디바이스별 세션 관리
// - 강제 로그아웃 기능

export const getCurrentUser = query({
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // 제한사항: 세션 유효성 체크 로직 단순
    return await getUserByEmail(ctx, identity.email);
  },
});
```

#### B. 데이터 암호화

- **민감 데이터 암호화**: 개인정보 필드 암호화 미구현
- **전송 중 암호화**: HTTPS 외 추가 암호화 레이어 없음
- **저장 시 암호화**: 데이터베이스 레벨 암호화 제한적

### 2. 개인정보 보호

#### A. GDPR/CCPA 컴플라이언스

- **데이터 삭제 권리**: 사용자 데이터 완전 삭제 프로세스 미완성
- **데이터 이동성**: 사용자 데이터 내보내기 기능 부족
- **동의 관리**: 세밀한 개인정보 처리 동의 관리 시스템 부족

#### B. 감사 및 로깅

- **포괄적 감사 로그**: 모든 데이터 접근 및 변경 기록 미완성
- **로그 보관**: 장기 로그 보관 정책 및 시스템 부족
- **규정 준수 리포팅**: 자동화된 컴플라이언스 리포트 생성 없음

---

## 👥 사용자 경험 제한사항

### 1. 사용자 인터페이스

#### A. 접근성 (Accessibility)

- **스크린 리더 지원**: 시각 장애인을 위한 스크린 리더 최적화 부족
- **키보드 내비게이션**: 완전한 키보드 내비게이션 지원 미완성
- **색상 대비**: WCAG 색상 접근성 가이드라인 부분적 준수
- **다국어 지원**: 영어/한국어 외 추가 언어 지원 없음

#### B. 사용성

```typescript
// 현재 제한사항: 기본적인 shadcn/ui 컴포넌트만 사용
// 개선 필요 영역:
// - 복잡한 폼의 사용자 경험
// - 에러 메시지의 명확성
// - 로딩 상태 표시
// - 성공/실패 피드백

// 예시: 개선이 필요한 폼 검증
<form onSubmit={handleSubmit}>
  <Input name="email" type="email" />
  {/* 제한사항: 실시간 검증 피드백 부족 */}
  {/* 제한사항: 사용자 친화적 에러 메시지 부족 */}
</form>
```

### 2. 성능 체감

#### A. 로딩 경험

- **초기 로딩 시간**: 첫 페이지 로드 시간 최적화 부족
- **스켈레톤 UI**: 로딩 중 스켈레톤 UI 부분적 구현
- **프로그레시브 로딩**: 점진적 콘텐츠 로딩 미구현

#### B. 오프라인 지원

- **오프라인 기능**: 네트워크 연결 끊김 시 기능 제한
- **캐시 전략**: 오프라인 데이터 캐싱 전략 부족
- **동기화**: 온라인 복귀 시 데이터 동기화 로직 미완성

---

## 🚀 향후 개선 계획

### Phase 1: 즉시 개선 (1-2개월)

#### A. 마이그레이션 완료

- [ ] **기존 API 완전 제거**: 모든 기능을 Convex로 이전
- [ ] **데이터 동기화 해결**: 실시간 데이터 일관성 보장
- [ ] **인증 시스템 통합**: Convex Auth로 완전 통합

#### B. 핵심 기능 안정화

- [ ] **에러 처리 표준화**: 일관된 에러 응답 형식 구현
- [ ] **권한 관리 강화**: 세밀한 RBAC 시스템 구현
- [ ] **기본 성능 최적화**: 쿼리 최적화 및 N+1 문제 해결

### Phase 2: 기능 확장 (3-6개월)

#### A. 고급 비즈니스 로직

```typescript
// 계획: 다단계 계층 구조 지원
interface EnhancedShopRelationship {
  shop_owner_id: string;
  parent_id?: string;
  level: number; // 계층 레벨
  hierarchy_path: string[]; // 전체 계층 경로
  commission_structure: CommissionTier[]; // 단계별 수수료
}

// 계획: 고급 CRM 워크플로우
interface CrmWorkflow {
  id: string;
  profile_id: string;
  current_step: number;
  steps: CrmStep[];
  auto_progression_rules: ProgressionRule[];
  performance_metrics: MetricData[];
}
```

#### B. 사용자 경험 개선

- [ ] **완전한 모바일 최적화**: 모든 화면의 모바일 UX 완성
- [ ] **오프라인 지원**: 기본적인 오프라인 기능 구현
- [ ] **접근성 완성**: WCAG 2.1 AA 레벨 완전 준수

### Phase 3: 고도화 (6-12개월)

#### A. 데이터 분석 및 AI

- [ ] **고객 분석 대시보드**: 고급 비즈니스 인텔리전스 구현
- [ ] **예측 모델링**: ML 기반 고객 행동 예측
- [ ] **개인화 엔진**: AI 기반 개인화된 추천 시스템

#### B. 확장성 및 성능

- [ ] **마이크로서비스 아키텍처**: 대규모 트래픽 처리를 위한 아키텍처 개선
- [ ] **CDN 및 캐싱**: 글로벌 콘텐츠 전송 네트워크 구축
- [ ] **실시간 분석**: 실시간 비즈니스 메트릭 모니터링

### Phase 4: 혁신 (12개월+)

#### A. 차세대 기능

- [ ] **블록체인 통합**: 투명한 수수료 정산 시스템
- [ ] **IoT 통합**: 매장 내 스마트 디바이스 연동
- [ ] **AR/VR 지원**: 가상현실 기반 제품 체험

---

## 🐛 알려진 버그 및 이슈

### Critical Issues (즉시 수정 필요)

#### 1. 데이터 일관성 문제

```typescript
// 이슈: 동시 업데이트 시 데이터 불일치
// 재현: 여러 사용자가 동시에 같은 프로필 수정 시
// 영향: 데이터 손실 또는 잘못된 정보 저장
// 상태: 🔴 Critical - 수정 중

// 임시 해결책: 낙관적 업데이트 비활성화
const updateProfile = useMutation(api.profiles.updateProfile);
// TODO: 충돌 해결 로직 구현
```

#### 2. 메모리 누수

```typescript
// 이슈: 실시간 구독 해제 시 메모리 누수
// 재현: 페이지 이동 시 useQuery 구독이 완전히 해제되지 않음
// 영향: 장시간 사용 시 브라우저 성능 저하
// 상태: 🔴 Critical - 조사 중

// 임시 해결책: 수동 구독 해제
useEffect(() => {
  return () => {
    // 수동 정리 로직
  };
}, []);
```

### High Priority Issues (빠른 수정 필요)

#### 3. 권한 체크 우회

- **이슈**: 특정 조건에서 권한 체크가 우회될 수 있음
- **재현**: 캐시된 토큰 사용 시 권한 재검증 누락
- **영향**: 보안 취약점
- **상태**: 🟡 High Priority - 수정 예정

#### 4. 대용량 파일 업로드 실패

- **이슈**: 10MB 이상 파일 업로드 시 간헐적 실패
- **재현**: 네트워크 불안정 상황에서 발생
- **영향**: 사용자 불편
- **상태**: 🟡 High Priority - 해결책 검토 중

### Medium Priority Issues (일반적 수정)

#### 5. UI 깜빡임 현상

- **이슈**: 실시간 데이터 업데이트 시 UI 깜빡임
- **재현**: 빠른 데이터 변경 시 발생
- **영향**: 사용자 경험 저하
- **상태**: 🟠 Medium Priority

#### 6. 검색 성능 저하

- **이슈**: 많은 데이터에서 검색 시 성능 저하
- **재현**: 1000+ 레코드에서 텍스트 검색 시
- **영향**: 검색 응답 시간 3초+
- **상태**: 🟠 Medium Priority

### Low Priority Issues (향후 수정)

#### 7. 브라우저 호환성

- **이슈**: Safari 브라우저에서 일부 CSS 스타일 문제
- **재현**: Safari 15 이하 버전
- **영향**: 시각적 불일치
- **상태**: 🟢 Low Priority

#### 8. 다크 모드 불완전

- **이슈**: 일부 컴포넌트에서 다크 모드 지원 부족
- **재현**: 다크 모드 전환 시 일부 요소 테마 미적용
- **영향**: 일관성 없는 UI
- **상태**: 🟢 Low Priority

---

## 📊 성능 벤치마크

### 현재 성능 지표

#### 웹 성능

- **First Content Paint (FCP)**: 2.1초 (목표: 1.8초)
- **Largest Contentful Paint (LCP)**: 3.4초 (목표: 2.5초)
- **Cumulative Layout Shift (CLS)**: 0.15 (목표: 0.1)
- **First Input Delay (FID)**: 180ms (목표: 100ms)

#### API 성능

- **평균 쿼리 응답 시간**: 245ms
- **평균 뮤테이션 응답 시간**: 380ms
- **실시간 업데이트 지연**: 50-150ms
- **동시 사용자 지원**: 500명 (테스트 기준)

#### 데이터베이스 성능

- **평균 읽기 지연시간**: 15ms
- **평균 쓰기 지연시간**: 35ms
- **인덱스 효율성**: 85% (목표: 95%)

---

## 🎯 성공 지표 및 모니터링

### 기술적 KPI

- **시스템 가용성**: 99.5% (목표: 99.9%)
- **평균 응답 시간**: <500ms (목표: <300ms)
- **에러율**: 0.8% (목표: <0.5%)
- **코드 커버리지**: 78% (목표: 85%)

### 비즈니스 KPI

- **사용자 만족도**: 7.2/10 (목표: 8.0/10)
- **기능 사용률**: 68% (목표: 80%)
- **페이지 이탈률**: 15% (목표: <10%)
- **작업 완료율**: 82% (목표: 90%)

---

## 📞 문제 신고 및 지원

### 버그 리포트 프로세스

1. **GitHub Issues** 에서 새 이슈 생성
2. **라벨 분류**: bug, enhancement, question 등
3. **우선순위 설정**: critical, high, medium, low
4. **담당자 배정**: 자동 또는 수동 배정

### 긴급 문제 대응

- **Critical/High Priority**: 24시간 내 응답
- **Medium Priority**: 72시간 내 응답
- **Low Priority**: 1주일 내 응답

### 연락처

- **기술 지원**: tech-support@biofox.com
- **개발팀 슬랙**: #dev-biofox-kol
- **긴급 상황**: 개발팀 리드 직접 연락

---

**⚠️ 면책 조항**: 이 문서의 제한사항들은 지속적으로 개선되고 있으며, 실제 시스템 동작과 다를 수 있습니다. 최신 정보는 개발팀에 문의하시기 바랍니다.

**📅 마지막 업데이트**: 2025년 1월  
**다음 리뷰 예정**: 2025년 4월
