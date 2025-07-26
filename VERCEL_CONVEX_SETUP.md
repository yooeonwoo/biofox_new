# Vercel + Convex 배포 설정 가이드

## 1. Convex Deploy Key 생성

1. Convex 대시보드 접속: https://dashboard.convex.dev
2. 프로젝트 선택 (aware-rook-16)
3. Settings → Deploy Keys 메뉴로 이동
4. "Generate a deploy key" 클릭
5. 생성된 키 복사 (예: prod:aware-rook-16|...)

## 2. Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 추가:

### 필수 환경변수

```
# Convex (필수)
CONVEX_DEPLOY_KEY=prod:aware-rook-16|...여기에_복사한_키_붙여넣기
NEXT_PUBLIC_CONVEX_URL=https://aware-rook-16.convex.cloud

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://cezxkgmzlkbjqataogtd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 설정 방법

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables
3. 각 변수 추가:
   - Key: 변수명 입력
   - Value: 값 입력
   - Environment: Production, Preview, Development 모두 체크
4. "Save" 클릭

## 3. 빌드 스크립트 대안 (이미 수정됨)

package.json의 build 스크립트가 이미 수정되어 있습니다:

```json
"build": "convex dev --once && next build"
```

만약 여전히 문제가 있다면 다음 대안을 사용할 수 있습니다:

### 대안 1: 환경변수 체크 추가

```json
"build": "[ -z \"$CONVEX_DEPLOY_KEY\" ] && echo 'Skipping Convex in CI' || convex dev --once; next build"
```

### 대안 2: CI 환경 감지

```json
"build": "[ \"$CI\" = \"true\" ] && echo 'Skipping Convex generation in CI' || convex dev --once; next build"
```

### 대안 3: 사전 생성된 타입 사용

1. 로컬에서 `convex dev --once` 실행
2. `convex/_generated` 폴더를 git에 커밋
3. build 스크립트를 원래대로 되돌리기: `"build": "next build"`

## 4. 문제 해결

### CONVEX_DEPLOY_KEY 오류

- Vercel 환경변수에 CONVEX_DEPLOY_KEY가 제대로 설정되었는지 확인
- 키 값에 공백이나 줄바꿈이 없는지 확인
- Production, Preview, Development 모든 환경에 설정되었는지 확인

### 빌드 캐시 문제

- Vercel 대시보드 → Settings → Functions → Clear Cache
- 또는 환경변수 변경 후 자동으로 캐시가 클리어됨

### 타입 생성 오류

- 로컬에서 `npx convex dev` 실행하여 정상 작동 확인
- .env.local 파일의 CONVEX_DEPLOYMENT 값 확인

## 5. 권장 설정

### 프로덕션 환경

```
CONVEX_DEPLOY_KEY=prod:aware-rook-16|...
NODE_ENV=production
```

### 스테이징 환경

별도의 Convex 프로젝트를 만들어 스테이징 환경 구성 권장

## 6. 보안 주의사항

- CONVEX_DEPLOY_KEY는 절대 클라이언트 코드에 노출하지 마세요
- SUPABASE_SERVICE_ROLE_KEY도 서버 사이드에서만 사용하세요
- 환경변수는 Vercel 대시보드에서만 관리하세요
