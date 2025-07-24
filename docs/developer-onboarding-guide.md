# BIOFOX KOL 시스템 - 개발자 온보딩 가이드

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [개발 환경 설정](#개발-환경-설정)
4. [프로젝트 구조](#프로젝트-구조)
5. [개발 워크플로우](#개발-워크플로우)
6. [코딩 표준](#코딧-표준)
7. [테스팅 가이드](#테스팅-가이드)
8. [배포 프로세스](#배포-프로세스)
9. [문제 해결](#문제-해결)
10. [유용한 리소스](#유용한-리소스)

---

## 🎯 프로젝트 개요

### 비즈니스 컨텍스트

BIOFOX KOL 시스템은 **Key Opinion Leader (KOL)와 매장 간의 계층적 관계를 관리**하는 B2B 플랫폼입니다.

- **KOL (Key Opinion Leader)**: 인플루언서, 전문가
- **매장 (Shop)**: KOL 하위의 판매점들
- **주요 기능**: 주문 관리, 수수료 계산, CRM, 시술 관리, 실시간 알림

### 마이그레이션 배경

- **기존 시스템**: Xano 백엔드 + PostgreSQL
- **신규 시스템**: Convex 백엔드 (실시간 서버리스)
- **마이그레이션 이유**: 더 나은 개발자 경험, 실시간 기능, 확장성

---

## 🔧 기술 스택

### Frontend

- **Next.js 15** - React 기반 풀스택 프레임워크 (App Router)
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 정적 타입 검사
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **shadcn/ui** - 고품질 재사용 가능한 컴포넌트

### Backend

- **Convex** - 실시간 백엔드-as-a-서비스
  - 실시간 쿼리/뮤테이션
  - 서버리스 함수
  - 자동 타입 생성
- **Convex Auth** - 사용자 인증 및 권한 관리

### State Management & Data Fetching

- **Zustand** - 경량 상태 관리
- **React Query (@tanstack/react-query)** - 서버 상태 관리
- **React Hook Form** - 폼 관리

### Testing

- **Vitest** - 단위 테스트 (Jest 대체)
- **Playwright** - E2E 테스트
- **Convex-test** - Convex 함수 테스트
- **Testing Library** - React 컴포넌트 테스트

### Development Tools

- **ESLint** + **Prettier** - 코드 품질 및 포매팅
- **Husky** - Git hooks
- **TypeScript Strict Mode** - 엄격한 타입 검사

---

## 🚀 개발 환경 설정

### 1. 시스템 요구사항

```bash
# Node.js 18.0.0 이상 확인
node --version

# 패키지 매니저 (npm, yarn, pnpm 중 하나)
npm --version
```

### 2. 프로젝트 클론 및 설치

```bash
# 저장소 클론
git clone [repository-url]
cd biofox-kol

# 의존성 설치
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 3. 환경 변수 설정

#### 로컬 개발 환경 (.env.local)

```env
# Convex Development Configuration
CONVEX_DEPLOYMENT=dev:quiet-dog-358
NEXT_PUBLIC_CONVEX_URL=https://quiet-dog-358.convex.cloud

# Legacy Supabase (마이그레이션 중)
NEXT_PUBLIC_SUPABASE_URL=https://cezxkgmzlkbjqataogtd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Convex 서버 환경 변수 관리

```bash
# 개발 환경 변수 확인
npx convex env list

# 프로덕션 환경 변수 확인
npx convex env list --prod

# 환경 변수 추가
npx convex env set VARIABLE_NAME "variable_value"

# 프로덕션 환경 변수 추가
npx convex env set VARIABLE_NAME "variable_value" --prod
```

### 4. 개발 서버 시작

```bash
# Next.js 개발 서버 시작 (모든 네트워크에서 접근 가능)
npm run dev

# 로컬에서만 접근 가능
npm run dev:local

# 개발 서버가 http://localhost:3000에서 실행됩니다
```

### 5. Convex 개발 환경 확인

```bash
# Convex 함수들이 정상적으로 배포되었는지 확인
npx convex dev

# Convex 대시보드에서 실시간 로그 및 데이터 확인
# https://dashboard.convex.dev
```

---

## 📁 프로젝트 구조

### 루트 디렉토리 개요

```
biofox-kol/
├── 📱 app/                    # Next.js App Router (페이지 및 API)
├── 🧩 components/            # 재사용 가능한 React 컴포넌트
├── ⚡ convex/               # Convex 백엔드 함수들
├── 🔧 lib/                  # 유틸리티 및 설정
├── 🪝 hooks/                # 커스텀 React 훅
├── 📝 types/                # TypeScript 타입 정의
├── 🛠️ utils/                # 헬퍼 함수들
├── 📖 docs/                 # 프로젝트 문서
├── 🧪 __tests__/            # 테스트 파일들
└── 📋 scripts/              # 유틸리티 스크립트들
```

### 상세 구조 설명

#### `app/` - Next.js App Router

```
app/
├── page.tsx                 # 홈페이지
├── layout.tsx              # 루트 레이아웃
├── globals.css             # 전역 스타일
├── admin-dashboard/        # 관리자 대시보드
├── kol-new/               # KOL 사용자 인터페이스
├── shop/                  # 매장 관리 페이지
├── api/                   # API 라우트 (기존 시스템 호환)
└── auth/                  # 인증 관련 페이지
```

#### `components/` - 컴포넌트 시스템

```
components/
├── ui/                    # shadcn/ui 기본 컴포넌트
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── admin/                 # 관리자 전용 컴포넌트
├── clinical/              # 시술 관리 컴포넌트
├── auth/                  # 인증 관련 컴포넌트
└── layout/                # 레이아웃 컴포넌트
```

#### `convex/` - 백엔드 함수들

```
convex/
├── schema.ts              # 데이터베이스 스키마 정의
├── auth.ts                # 인증 함수
├── profiles.ts            # 사용자 프로필 관리
├── orders.ts              # 주문 관리
├── relationships.ts       # KOL-매장 관계 관리
├── notifications.ts       # 알림 시스템
├── migration.ts           # 데이터 마이그레이션
└── _generated/            # Convex 자동 생성 파일들
```

### 핵심 데이터 모델 (17개 테이블)

1. **사용자 관리**: `users`, `profiles`
2. **관계 관리**: `shop_relationships`
3. **주문 관리**: `orders`, `order_items`
4. **디바이스 판매**: `device_sales`, `kol_device_accumulator`, `device_commission_tiers`
5. **CRM 시스템**: `crm_cards`, `self_growth_cards`
6. **시술 관리**: `clinical_cases`, `clinical_photos`, `consent_files`
7. **수수료 시스템**: `commission_calculations`
8. **알림 시스템**: `notifications`
9. **감사 및 로깅**: `audit_logs`, `file_metadata`

---

## ⚡ 개발 워크플로우

### 1. 새로운 기능 개발

#### A. 브랜치 생성 및 작업

```bash
# 새 브랜치 생성
git checkout -b feature/새기능명

# 작업 후 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 푸시 및 PR 생성
git push origin feature/새기능명
```

#### B. Convex 함수 개발

```typescript
// convex/example.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// 쿼리 함수 (데이터 조회)
export const getExample = query({
  args: { id: v.id('tableName') },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    // 데이터 조회
    const result = await ctx.db.get(args.id);
    return result;
  },
});

// 뮤테이션 함수 (데이터 변경)
export const createExample = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const id = await ctx.db.insert('tableName', {
      name: args.name,
      description: args.description,
      created_at: Date.now(),
    });

    return id;
  },
});
```

#### C. React 컴포넌트에서 Convex 함수 사용

```typescript
// components/ExampleComponent.tsx
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export function ExampleComponent() {
  // 쿼리 사용 (실시간 업데이트)
  const examples = useQuery(api.example.getExample, { id: 'someId' });

  // 뮤테이션 사용
  const createExample = useMutation(api.example.createExample);

  const handleCreate = () => {
    createExample({
      name: 'New Example',
      description: 'Description'
    });
  };

  return (
    <div>
      <button onClick={handleCreate}>
        Create Example
      </button>
      {examples && <div>{examples.name}</div>}
    </div>
  );
}
```

### 2. 개발 중 자주 사용하는 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 린트 확인
npm run lint

# 테스트 실행
npm run test
npm run test:watch
npm run test:coverage

# E2E 테스트
npm run test:e2e
npm run test:e2e:ui

# 빌드
npm run build

# Convex 함수 배포
npx convex dev
```

---

## 📏 코딩 표준

### 1. TypeScript 사용 규칙

```typescript
// ✅ DO: 명시적 타입 정의
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kol' | 'ol' | 'shop_owner';
}

// ✅ DO: 함수 시그니처 명시
const updateProfile = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  // 구현
};

// ❌ DON'T: any 타입 사용 금지
const badFunction = (data: any) => {
  // 피하기
};
```

### 2. 컴포넌트 작성 규칙

```typescript
// ✅ DO: 명명된 함수 컴포넌트
interface ProfileCardProps {
  profile: UserProfile;
  onEdit?: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{profile.name}</h3>
      <p>{profile.email}</p>
      {onEdit && (
        <button onClick={onEdit}>
          편집
        </button>
      )}
    </div>
  );
}

// ❌ DON'T: 화살표 함수 컴포넌트 피하기
const BadComponent = ({ data }: any) => {
  // 피하기
};
```

### 3. Convex 함수 작성 규칙

```typescript
// ✅ DO: 적절한 인증 및 검증
export const secureQuery = query({
  args: { userId: v.id('profiles') },
  handler: async (ctx, args) => {
    // 1. 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증이 필요합니다');
    }

    // 2. 권한 확인
    const currentUser = await getCurrentUser(ctx);
    if (!canAccessUser(currentUser, args.userId)) {
      throw new Error('접근 권한이 없습니다');
    }

    // 3. 데이터 조회
    return await ctx.db.get(args.userId);
  },
});
```

### 4. 파일 및 폴더 명명 규칙

```
📁 camelCase 폴더명
├── 📁 adminDashboard/
├── 📁 userProfiles/
└── 📁 clinicalManagement/

📄 PascalCase 컴포넌트 파일
├── 📄 ProfileCard.tsx
├── 📄 AdminDashboard.tsx
└── 📄 ClinicalForm.tsx

📄 camelCase 유틸리티 파일
├── 📄 dateUtils.ts
├── 📄 apiHelpers.ts
└── 📄 validationSchemas.ts
```

### 5. CSS 및 스타일링 규칙

```tsx
// ✅ DO: Tailwind CSS 클래스 순서
<div className="// Layout // Size // Spacing // Typography // Colors // Borders // Visual effects // Interactions // Focus states flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2">
  Content
</div>;

// ✅ DO: 조건부 스타일링
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
```

---

## 🧪 테스팅 가이드

### 1. 단위 테스트 (Vitest)

```typescript
// __tests__/components/ProfileCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProfileCard } from '@/components/ProfileCard';

describe('ProfileCard', () => {
  const mockProfile = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'kol' as const
  };

  it('사용자 정보를 올바르게 표시한다', () => {
    render(<ProfileCard profile={mockProfile} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### 2. Convex 함수 테스트

```typescript
// convex/profiles.test.ts
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

test('프로필 생성 테스트', async () => {
  const t = convexTest(schema);

  // 테스트 사용자 생성
  const userId = await t.run(async ctx => {
    return await ctx.db.insert('users', { email: 'test@example.com' });
  });

  // 프로필 생성 테스트
  const profileId = await t.mutation(api.profiles.createProfile, {
    userId,
    name: 'Test User',
    email: 'test@example.com',
    role: 'kol',
  });

  expect(profileId).toBeDefined();
});
```

### 3. 통합 테스트

```typescript
// __tests__/integration/user-flow.test.ts
import { test, expect } from '@playwright/test';

test('사용자 온보딩 플로우', async ({ page }) => {
  // 1. 회원가입 페이지 접속
  await page.goto('/signup');

  // 2. 폼 작성
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.fill('input[name="name"]', '새 사용자');
  await page.selectOption('select[name="role"]', 'kol');

  // 3. 제출
  await page.click('button[type="submit"]');

  // 4. 성공 메시지 확인
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### 4. 테스트 실행 명령어

```bash
# 단위 테스트
npm run test              # 한 번 실행
npm run test:watch        # 변경 감지 모드
npm run test:coverage     # 커버리지 포함

# Convex 함수 테스트
npm run test:convex       # Convex 함수 테스트
npm run test:convex:watch # 변경 감지 모드

# E2E 테스트
npm run test:e2e          # 헤드리스 모드
npm run test:e2e:ui       # UI 모드
npm run test:e2e:headed   # 브라우저 표시

# 전체 테스트
npm run test:all          # 모든 테스트 실행
```

---

## 🚀 배포 프로세스

### 1. 환경별 배포

```bash
# 개발 환경 배포
npm run deploy:dev

# 스테이징 환경 배포
npm run deploy:staging

# 프로덕션 환경 배포
npm run deploy

# 드라이런 (실제 배포 없이 검증)
npm run deploy:dry-run
```

### 2. 배포 전 체크리스트

- [ ] 모든 테스트 통과 (`npm run test:all`)
- [ ] 타입 에러 없음 (`npm run type-check`)
- [ ] 린트 에러 없음 (`npm run lint`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 환경 변수 설정 확인
- [ ] Convex 스키마 마이그레이션 완료

### 3. 배포 후 검증

```bash
# 배포 상태 확인
npm run verify-deployment

# 고급 배포 검증
npm run verify-deployment:enhanced

# 문제 발생 시 롤백
npm run rollback
```

---

## 🔧 문제 해결

### 1. 자주 발생하는 문제

#### A. Convex 관련 문제

```bash
# 문제: Convex 함수가 업데이트되지 않음
# 해결책: 개발 서버 재시작
npx convex dev

# 문제: 인증 에러
# 해결책: 환경 변수 확인
npx convex env list
```

#### B. 타입 에러

```typescript
// 문제: Convex 생성 타입이 오래됨
// 해결책: 타입 재생성
npx convex dev

// 문제: shadcn/ui 컴포넌트 타입 에러
// 해결책: 컴포넌트 재설치
npx shadcn-ui@latest add button
```

#### C. 개발 서버 문제

```bash
# 포트 충돌 해결
lsof -ti:3000 | xargs kill -9

# 캐시 클리어
rm -rf .next
npm run dev
```

### 2. 디버깅 도구

#### A. Convex 대시보드

- **URL**: https://dashboard.convex.dev
- **기능**: 실시간 로그, 데이터베이스 브라우저, 함수 실행 추적

#### B. React DevTools

- **Chrome Extension**: React Developer Tools
- **기능**: 컴포넌트 상태, props 검사

#### C. 로그 확인

```bash
# Next.js 로그
npm run dev

# Convex 로그
npx convex logs

# 브라우저 개발자 도구
# F12 -> Console 탭
```

### 3. 성능 문제 해결

#### A. 번들 크기 분석

```bash
# 번들 분석
npm run build
npm run analyze
```

#### B. 실시간 쿼리 최적화

```typescript
// ✅ DO: 필요한 필드만 선택
export const getOptimizedProfiles = query({
  args: {},
  handler: async ctx => {
    return await ctx.db
      .query('profiles')
      .filter(q => q.eq(q.field('status'), 'approved'))
      .collect();
  },
});

// ❌ DON'T: 모든 데이터 로드
export const getAllProfiles = query({
  args: {},
  handler: async ctx => {
    return await ctx.db.query('profiles').collect(); // 비효율적
  },
});
```

---

## 📚 유용한 리소스

### 1. 공식 문서

- **Convex**: https://docs.convex.dev/
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **React Query**: https://tanstack.com/query/latest

### 2. 프로젝트 내부 문서

- **API 문서**: [`docs/api-documentation.md`](./api-documentation.md)
- **API 예제**: [`docs/api-examples.md`](./api-examples.md)
- **통합 테스트 가이드**: [`docs/integration-testing-guide.md`](./integration-testing-guide.md)
- **배포 설정**: [`docs/deployment-setup.md`](./deployment-setup.md)

### 3. 개발 도구

- **Convex 대시보드**: https://dashboard.convex.dev
- **Vercel 대시보드**: https://vercel.com/dashboard
- **GitHub Actions**: 자동화된 테스트 및 배포

### 4. 커뮤니티 및 지원

- **Convex Discord**: https://discord.gg/convex
- **Next.js GitHub**: https://github.com/vercel/next.js
- **팀 슬랙 채널**: #dev-biofox-kol

---

## 🎯 다음 단계

### 새로운 개발자를 위한 첫 주 계획

1. **1일차**: 환경 설정 및 프로젝트 실행
2. **2일차**: 코드베이스 탐색 및 주요 컴포넌트 이해
3. **3일차**: 첫 번째 작은 기능 구현 (버그 수정 등)
4. **4일차**: 테스트 작성 및 실행
5. **5일차**: 코드 리뷰 참여 및 배포 과정 학습

### 지속적인 학습

- 주간 기술 공유 세션 참여
- 코드 리뷰 활발히 참여
- 새로운 Convex 기능 및 베스트 프랙티스 학습
- 성능 최적화 및 사용자 경험 개선에 기여

---

**📞 도움이 필요하신가요?**

- 팀 리드에게 문의: @team-lead
- 기술적 질문: #dev-biofox-kol 슬랙 채널
- 긴급한 문제: 직접 연락

환영합니다! 🎉
