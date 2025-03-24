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

## 문제 해결 가이드

### 발생했던 오류들과 해결 방법

1. **제품별 매출 비율 차트 오류**
   - 문제: SQL 함수 반환 타입 불일치 문제 (character varying(7)이 text 타입과 일치하지 않음)
   - 해결: RPC 함수 대신 직접 SQL 쿼리로 테이블 조회 방식으로 변경
   - 파일: `app/api/admin/dashboard/products/route.ts`

2. **전문점 목록 API 오류**
   - 문제: getUserByClerkId 함수에서 "JSON object requested, multiple (or no) rows returned" 오류
   - 해결: `getUserByClerkId` 대신 직접 supabase 쿼리로 사용자 조회하도록 변경하고 결과 검증 추가
   - 파일: `app/api/shops/route.ts`

3. **제품 목록 API 오류**
   - 문제: getDB 함수가 정의되지 않음
   - 해결: 
     - `db/index.ts`에 getDB 함수 추가 및 필요한 패키지 설치
     - `app/api/products/route.ts`를 supabase 직접 쿼리 방식으로 변경

### 테스트 데이터 생성

테스트 데이터를 생성하기 위해 `db/sql/mock-data.sql` 파일을 추가했습니다. 
이 SQL 스크립트를 실행하면 다음 테스트 데이터가 추가됩니다:

- 제품 데이터
- 제품별 매출 비율 데이터
- 전문점 데이터
- 월별 매출 데이터
- KOL 총 월별 매출 데이터
- 관리자 대시보드 통계 데이터
- 제품 총 매출 통계 데이터

#### 테스트 데이터 실행 방법

Supabase 대시보드의 SQL 편집기나 다음 명령으로 테스트 데이터를 추가할 수 있습니다:

```bash
# .env 파일에 DATABASE_URL이 설정되어 있어야 합니다
psql $DATABASE_URL -f db/sql/mock-data.sql
```

또는 Supabase 프로젝트 대시보드에서 SQL 에디터를 열고 `db/sql/mock-data.sql` 파일의 내용을 복사하여 실행할 수 있습니다.
