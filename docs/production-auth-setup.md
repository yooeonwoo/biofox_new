# Production 환경 Convex Auth 설정 가이드

## 개요

이 문서는 Biofox KOL 프로젝트의 Production 환경에서 Convex Auth를 설정하는 방법을 설명합니다.

## 필수 환경변수

### 1. Convex 관련 환경변수

```bash
# Convex Production URL
CONVEX_URL=https://aware-rook-16.convex.cloud

# Convex Production Deployment Key
CONVEX_DEPLOYMENT_KEY=<your-production-deployment-key>

# Convex Production Deploy Key (GitHub Actions용)
CONVEX_PRODUCTION_DEPLOY_KEY=<your-production-deploy-key>
```

### 2. JWT 관련 환경변수

```bash
# JWT Private Key (RSA 형식)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDIs/dOj2dvi3Iq
... (실제 키 내용)
-----END PRIVATE KEY-----"

# JWKS (JSON Web Key Set)
JWKS='{"keys":[{"use":"sig","kty":"RSA","n":"...","e":"AQAB"}]}'
```

### 3. 사이트 URL 설정

```bash
# Production 사이트 URL
SITE_URL=https://biofox-kol.com
NEXT_PUBLIC_SITE_URL=https://biofox-kol.com
```

### 4. 환경 설정

```bash
# Node 환경
NODE_ENV=production

# 앱 환경
APP_ENV=production

# 로그 레벨
LOG_LEVEL=info
```

## Convex Dashboard 설정

### 1. Production 환경변수 설정

1. [Convex Dashboard](https://dashboard.convex.dev/d/aware-rook-16)에 접속
2. Settings → Environment Variables 이동
3. 다음 환경변수 추가:
   - `JWT_PRIVATE_KEY`
   - `JWKS`
   - `SITE_URL`
   - `NODE_ENV`
   - `APP_ENV`
   - `LOG_LEVEL`

### 2. JWT 키 생성 방법

#### RSA 키 쌍 생성

```bash
# Private Key 생성
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Public Key 추출
openssl rsa -pubout -in private_key.pem -out public_key.pem

# JWKS 형식으로 변환
node scripts/generate-jwks.js
```

#### `scripts/generate-jwks.js` 예제

```javascript
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');

async function generateJWKS() {
  const privateKey = fs.readFileSync('private_key.pem', 'utf8');
  const publicKey = crypto.createPublicKey(privateKey);

  const jwk = publicKey.export({ format: 'jwk' });
  jwk.use = 'sig';
  jwk.kid = crypto.randomUUID();

  const jwks = {
    keys: [jwk],
  };

  console.log('JWKS:', JSON.stringify(jwks));
  fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
}

generateJWKS();
```

## GitHub Actions Secrets 설정

### 필수 Secrets

1. `CONVEX_PRODUCTION_DEPLOY_KEY` - Convex production deployment key
2. `CONVEX_URL` - Production Convex URL
3. `CONVEX_STAGING_DEPLOY_KEY` - Staging deployment key
4. `CONVEX_STAGING_URL` - Staging Convex URL

### 설정 방법

1. GitHub 저장소의 Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 각 secret 추가

## Vercel 환경변수 설정 (Next.js 배포 시)

### Production 환경변수

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://aware-rook-16.convex.cloud

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://biofox-kol.com

# 기타 Public 환경변수
NEXT_PUBLIC_APP_ENV=production
```

## 보안 고려사항

### 1. JWT 키 관리

- Private key는 절대 클라이언트 코드에 노출되지 않도록 주의
- 키 로테이션 정책 수립 (최소 6개월마다)
- 키 백업 및 복구 절차 마련

### 2. CORS 설정

- Production 도메인만 허용
- 와일드카드(\*) 사용 금지

### 3. 쿠키 설정

- `secure: true` (HTTPS only)
- `httpOnly: true` (XSS 방지)
- `sameSite: 'strict'` (CSRF 방지)

## 배포 체크리스트

### 배포 전 확인사항

- [ ] 모든 환경변수가 Production 값으로 설정되었는가?
- [ ] JWT 키가 올바르게 생성되고 설정되었는가?
- [ ] CORS 설정이 Production 도메인만 허용하는가?
- [ ] 쿠키 보안 설정이 활성화되었는가?
- [ ] Convex Dashboard에 환경변수가 설정되었는가?
- [ ] GitHub Actions secrets가 설정되었는가?

### 배포 후 확인사항

- [ ] 로그인이 정상적으로 작동하는가?
- [ ] JWT 토큰이 올바르게 발급되는가?
- [ ] 세션이 유지되는가?
- [ ] HTTPS로만 접속 가능한가?
- [ ] 쿠키가 secure 플래그로 설정되었는가?

## 문제 해결

### JWT 검증 실패

1. Private key와 JWKS의 키가 일치하는지 확인
2. 환경변수가 올바르게 설정되었는지 확인
3. Convex Dashboard 로그 확인

### CORS 에러

1. `auth.config.ts`의 allowedOrigins 확인
2. Production URL이 올바른지 확인
3. 프로토콜(https://)이 포함되었는지 확인

### 세션 만료 문제

1. 세션 설정 시간 확인
2. 쿠키 만료 시간 확인
3. 서버 시간 동기화 확인

## 모니터링

### 로그 확인

- Convex Dashboard → Logs에서 실시간 로그 확인
- 인증 관련 에러 모니터링
- 성능 메트릭 확인

### 알림 설정

- 인증 실패율이 높을 때 알림
- JWT 키 만료 전 알림
- 비정상적인 로그인 패턴 감지
