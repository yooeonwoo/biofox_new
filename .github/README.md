# GitHub Actions CI/CD Pipeline

이 프로젝트는 다음과 같은 GitHub Actions 워크플로우를 사용합니다:

## 워크플로우 개요

### 1. CI Pipeline (`ci.yml`)

- **트리거**: PR 및 main/master/develop/xono 브랜치 푸시
- **작업**:
  - ESLint 코드 스타일 검사
  - TypeScript 타입 체크
  - Vitest 단위 테스트 실행
  - Playwright E2E 테스트 실행
  - Next.js 애플리케이션 빌드

### 2. Production Deployment (`deploy.yml`)

- **트리거**: main 브랜치 푸시 또는 릴리즈 발행
- **작업**:
  - 프로덕션 빌드 생성
  - Vercel/Docker 배포 (설정에 따라)
  - 배포 결과 알림

### 3. Code Quality & Security (`code-quality.yml`)

- **트리거**: PR, 브랜치 푸시, 주간 정기 스캔
- **작업**:
  - SonarCloud 코드 품질 분석
  - Snyk 보안 취약점 스캔
  - npm audit 의존성 검사
  - Lighthouse 성능 감사 (PR 시)

## 필수 설정

### GitHub Secrets 설정

다음 secrets을 GitHub 리포지토리에 설정해야 합니다:

#### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Authentication

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

#### 배포 (Vercel 사용 시)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### 코드 품질 도구 (선택사항)

- `SONAR_TOKEN`
- `SONAR_PROJECT_KEY`
- `SONAR_ORGANIZATION`
- `SNYK_TOKEN`
- `LHCI_GITHUB_APP_TOKEN`

### 브랜치 보호 규칙 설정

`main` 브랜치에 대해 다음 보호 규칙을 설정하는 것을 권장합니다:

1. **Settings** > **Branches** > **Add rule**
2. 브랜치 이름 패턴: `main`
3. 설정 옵션:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (최소 1명)
     - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - 필수 status checks:
       - `Lint, Type Check & Test`
       - `Build Application`
       - `Code Quality Analysis` (설정 시)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Restrict pushes that create files**

## 성능 기준

Lighthouse CI를 통해 다음 성능 기준을 유지합니다:

- **Performance**: 최소 80점
- **Accessibility**: 최소 90점
- **Best Practices**: 최소 90점
- **SEO**: 최소 80점

성능 메트릭:

- First Contentful Paint: 2초 이하
- Largest Contentful Paint: 2.5초 이하
- Interactive: 3초 이하
- Cumulative Layout Shift: 0.1 이하

## 로컬 테스트

CI 파이프라인과 동일한 검사를 로컬에서 실행하려면:

```bash
# 린팅 및 타입 체크
npm run lint
npx tsc --noEmit

# 테스트 실행
npm run test
npm run test:e2e

# 프로덕션 빌드
npm run build
```

## 문제 해결

### 일반적인 문제들

1. **TypeScript 에러**: `npx tsc --noEmit`로 로컬에서 확인
2. **테스트 실패**: `npm run test`로 로컬 테스트 실행
3. **빌드 실패**: 환경 변수 설정 확인
4. **E2E 테스트 실패**: Playwright 브라우저 설치 확인

### 환경 변수 확인

로컬 개발 시 `.env.local` 파일에 필요한 환경 변수가 모두 설정되어 있는지 확인하세요.
