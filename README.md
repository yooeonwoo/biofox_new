# BIOFOX KOL

BIOFOX KOL 프로젝트는 인플루언서 및 Key Opinion Leader (KOL) 관리를 위한 시스템입니다.

## 프로젝트 구조

- `app/`: 주요 애플리케이션 코드
- `docs/`: 프로젝트 문서
- `components/`: 재사용 가능한 컴포넌트
- `lib/`: 유틸리티 및 라이브러리

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 결과를 확인할 수 있습니다.

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (인증)
- Supabase (데이터베이스)
- Drizzle ORM

## 기능

- KOL 사용자 관리
- 본사 관리자 기능
- 전문점 연동
- 실적 관리

## 개발 가이드라인

자세한 개발 가이드라인은 `docs/` 디렉토리를 참조하세요.

## 배포

이 프로젝트는 [Vercel](https://vercel.com)에 배포할 수 있습니다.

[Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)에서 더 자세한 정보를 확인하세요.
