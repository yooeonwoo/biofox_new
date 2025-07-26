# Supabase + Convex 연동 설정 가이드

## 개요

이 프로젝트는 Supabase Auth를 인증 시스템으로, Convex를 실시간 데이터베이스로 사용합니다.

## 아키텍처

- **인증**: Supabase Auth (JWT 기반)
- **데이터베이스**: Convex (실시간 동기화)
- **연동 방식**: Supabase userId를 Convex profiles 테이블의 supabaseUserId 필드로 매핑

## 설정 단계

### 1. Convex 프로젝트 초기화

```bash
# Convex 개발 서버 시작
npx convex dev

# 다음 메시지가 나오면:
# "What would you like to configure?"
# → "a new project" 선택

# 프로젝트 이름 입력
# → "biofox-kol" 또는 원하는 이름

# 환경 변수가 자동으로 .env.local에 추가됩니다
```

### 2. 환경변수 확인

`.env.local` 파일에 다음 변수들이 설정되어야 합니다:

```env
# Supabase (이미 설정됨)
NEXT_PUBLIC_SUPABASE_URL=https://cezxkgmzlkbjqataogtd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Convex (자동 생성됨)
CONVEX_DEPLOYMENT=your-deployment-id
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. 스키마 적용 확인

Convex 대시보드(https://dashboard.convex.dev)에서:

- `profiles` 테이블에 `supabaseUserId` 필드가 추가되었는지 확인
- 인덱스가 올바르게 생성되었는지 확인

### 4. 첫 로그인 테스트

1. 개발 서버 시작: `npm run dev`
2. `/signin` 페이지에서 새 계정 생성
3. Supabase 대시보드에서 사용자 확인
4. Convex 대시보드에서 프로필 생성 확인

## 주요 파일

### 인증 관련

- `/lib/supabase/client.ts` - 클라이언트 사이드 Supabase
- `/lib/supabase/server.ts` - 서버 사이드 Supabase (SSR)
- `/providers/supabase-auth-provider.tsx` - Auth Provider

### Convex 함수

- `/convex/supabaseAuth.ts` - Supabase 연동 함수들
- `/convex/authHelpers.ts` - 캐싱 및 성능 최적화

### 컴포넌트

- `/components/auth/AuthForm.tsx` - 로그인/회원가입 폼
- `/components/auth/SignOutButton.tsx` - 로그아웃 버튼

## 성능 최적화

### 캐싱 전략

- 프로필 정보는 5분간 메모리 캐시
- 프로필 업데이트시 자동 캐시 무효화
- 실시간 업데이트는 Convex 구독 사용

### JWT 검증

- 첫 요청시에만 Supabase JWT 검증
- 이후 요청은 Convex 세션 활용
- 서버 컴포넌트에서는 SSR 지원

## 문제 해결

### Convex가 시작되지 않는 경우

```bash
# Convex 상태 확인
npx convex status

# 강제 재시작
npx convex dev --once
```

### 프로필이 생성되지 않는 경우

1. Supabase에서 사용자 확인
2. Convex 로그 확인: `npx convex logs`
3. 네트워크 탭에서 API 호출 확인

### 인증 오류가 발생하는 경우

1. 환경변수 확인
2. Supabase 프로젝트 상태 확인
3. CORS 설정 확인 (middleware.ts)

## 개발 팁

### 로컬에서 테스트

```bash
# 모든 서비스 시작
npm run dev

# Convex 함수 테스트
npm run test:convex
```

### 프로덕션 배포

```bash
# Convex 프로덕션 배포
npm run deploy

# Vercel 배포 (자동)
git push origin main
```

## 보안 고려사항

- Supabase Service Role Key는 서버에서만 사용
- 클라이언트에서는 Anon Key만 사용
- RLS 정책은 Supabase에서 설정
- Convex 함수에서 추가 권한 검증
