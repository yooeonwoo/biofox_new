# Convex Auth 설정 요약

## 완료된 작업

### 1. 파일 생성

- ✅ `convex/auth.config.ts` - 환경별 인증 설정 파일
- ✅ `scripts/generate-jwks.js` - JWKS 생성 스크립트
- ✅ `docs/production-auth-setup.md` - Production 설정 가이드

### 2. 기존 파일 수정

- ✅ `convex/auth.ts` - auth.config.ts import 추가
- ✅ `.gitignore` - private key 파일 제외 설정 추가

## 주요 설정

### Development 환경

```typescript
// convex/auth.config.ts
{
  jwt: {
    expiresIn: '30d',  // 30일
    issuer: 'http://localhost:3000'
  },
  session: {
    totalDurationMs: 30 * 24 * 60 * 60 * 1000,  // 30일
    inactiveDurationMs: 7 * 24 * 60 * 60 * 1000  // 7일
  },
  cookies: {
    secure: false,
    sameSite: 'lax',
    httpOnly: true
  }
}
```

### Production 환경

```typescript
// convex/auth.config.ts
{
  jwt: {
    expiresIn: '7d',  // 7일
    issuer: 'https://biofox-kol.com'
  },
  session: {
    totalDurationMs: 7 * 24 * 60 * 60 * 1000,  // 7일
    inactiveDurationMs: 1 * 24 * 60 * 60 * 1000  // 1일
  },
  cookies: {
    secure: true,  // HTTPS only
    sameSite: 'strict',
    httpOnly: true,
    domain: '.biofox-kol.com'
  }
}
```

## Production 배포 준비사항

### 1. JWT 키 생성

```bash
# Private Key 생성
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# JWKS 생성
node scripts/generate-jwks.js
```

### 2. Convex Dashboard 환경변수 설정

Production 환경 (https://dashboard.convex.dev/d/aware-rook-16):

- `JWT_PRIVATE_KEY` - 생성된 private key
- `JWKS` - 생성된 JWKS JSON
- `SITE_URL` - https://biofox-kol.com
- `NODE_ENV` - production
- `APP_ENV` - production
- `LOG_LEVEL` - info

### 3. GitHub Actions Secrets 설정

필수 secrets:

- `CONVEX_PRODUCTION_DEPLOY_KEY`
- `CONVEX_URL`
- `CONVEX_STAGING_DEPLOY_KEY`
- `CONVEX_STAGING_URL`

### 4. Vercel 환경변수 설정 (Next.js용)

- `NEXT_PUBLIC_CONVEX_URL` - https://aware-rook-16.convex.cloud
- `NEXT_PUBLIC_SITE_URL` - https://biofox-kol.com
- `NEXT_PUBLIC_APP_ENV` - production

## 배포 명령어

```bash
# Production 배포
npm run deploy

# Staging 배포
npm run deploy:staging

# Preview 배포
npm run deploy:preview

# Dry run (테스트)
npm run deploy:dry-run
```

## 보안 체크리스트

- [ ] Private key는 안전하게 보관
- [ ] Production URL 확인 (https://biofox-kol.com)
- [ ] CORS 설정에서 production 도메인만 허용
- [ ] 쿠키 secure 플래그 활성화
- [ ] JWT 만료 시간 적절히 설정
- [ ] 환경변수 모두 설정 완료

## 다음 단계

1. Production 도메인 확정 후 `auth.config.ts` 수정
2. JWT 키 생성 및 Convex Dashboard 설정
3. GitHub Actions secrets 설정
4. Vercel 환경변수 설정
5. Production 배포 테스트
