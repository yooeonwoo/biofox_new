# CORS 및 인증 설정 가이드 (모든 사이트 허용)

⚠️ **주의**: 이 설정은 개발/테스트 목적으로만 사용하세요. 실제 프로덕션에서는 보안상 권장하지 않습니다.

## 완료된 설정

### 1. Convex Auth 설정 (`convex/auth.ts`)

- JWT 만료 시간: 30일 (모든 환경)
- 세션 지속 시간: 30일
- 비활성 만료 시간: 7일

### 2. Next.js 설정 (`next.config.mjs`)

```javascript
allowedDevOrigins: ['*']; // 모든 origin 허용
```

### 3. 미들웨어 설정 (`middleware.ts`)

- 모든 origin에서의 요청 허용
- 쿠키 전송 허용 (`credentials: true`)
- 모든 HTTP 메서드 허용
- iframe 내부 실행 허용 (X-Frame-Options 제거)

### 4. 개발 서버 설정 (`package.json`)

```json
"dev": "next dev --hostname 0.0.0.0 --port 3002"
```

## 환경변수 설정 (.env.local)

```bash
# Convex 설정
NEXT_PUBLIC_CONVEX_URL=https://quiet-dog-358.convex.cloud
CONVEX_DEPLOYMENT=quiet-dog-358

# 사이트 URL (모든 인터페이스에서 접근 가능)
SITE_URL=http://0.0.0.0:3002
NEXT_PUBLIC_SITE_URL=http://0.0.0.0:3002

# 환경 설정
NODE_ENV=development
APP_ENV=development
LOG_LEVEL=debug
```

## Convex Dashboard 환경변수

[Convex Dashboard](https://dashboard.convex.dev)에서 다음 환경변수 설정:

1. **JWT_PRIVATE_KEY**: RSA Private Key
2. **JWKS**: JSON Web Key Set
3. **SITE_URL**: http://0.0.0.0:3002 (또는 실제 도메인)
4. **NODE_ENV**: production (프로덕션 배포 시)
5. **APP_ENV**: production (프로덕션 배포 시)

## 접근 가능한 URL들

다음 URL들에서 모두 접근 가능:

- http://localhost:3002
- http://0.0.0.0:3002
- http://127.0.0.1:3002
- http://[your-local-ip]:3002 (예: http://192.168.1.100:3002)
- 모든 외부 도메인에서 API 호출 가능

## 테스트 방법

### 1. 로컬 테스트

```bash
# 서버 시작
npm run dev

# 다른 터미널에서 Convex 개발 서버 시작
npx convex dev
```

### 2. 다른 기기에서 테스트

- 같은 네트워크의 다른 기기에서 `http://[your-local-ip]:3002` 접속
- 모바일 기기에서도 접속 가능

### 3. CORS 테스트

```javascript
// 다른 도메인에서 실행
fetch('http://0.0.0.0:3002/api/auth/current-user', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## Production 배포 시 주의사항

실제 프로덕션에서는 다음과 같이 보안 설정을 강화해야 합니다:

### 1. CORS 설정 제한

```javascript
// middleware.ts
const allowedOrigins = ['https://yourdomain.com', 'https://www.yourdomain.com'];

if (allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin);
}
```

### 2. 쿠키 보안 강화

```javascript
// Convex auth 설정
cookies: {
  secure: true,  // HTTPS only
  sameSite: 'strict',
  httpOnly: true,
}
```

### 3. Next.js 설정 제한

```javascript
// next.config.mjs
allowedDevOrigins: ['yourdomain.com', 'www.yourdomain.com'];
```

## 문제 해결

### CORS 에러가 발생하는 경우

1. 미들웨어가 제대로 적용되었는지 확인
2. 브라우저 캐시 삭제
3. 서버 재시작

### 인증이 작동하지 않는 경우

1. Convex Dashboard에서 환경변수 확인
2. JWT_PRIVATE_KEY와 JWKS가 올바르게 설정되었는지 확인
3. Convex 개발 서버 재시작

### 쿠키가 저장되지 않는 경우

1. 브라우저의 쿠키 설정 확인
2. 서드파티 쿠키 차단 해제
3. 시크릿 모드에서 테스트
