# CSV 데이터 Supabase 삽입 구현

이 프로젝트는 CSV 데이터를 Supabase 테이블에 삽입하는 Node.js 스크립트입니다.

## 설치 방법

1. 저장소 클론:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. 종속성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env` 파일이 이미 생성되어 있습니다. 필요한 경우 Supabase URL과 API 키를 업데이트하세요.

## CSV 파일 준비

- CSV 파일은 `csv` 디렉토리에 위치해야 합니다.
- 파일 이름 형식: `migration - {table_name}.csv`
- 필요한 CSV 파일 목록:
  - `migration - roles.csv`
  - `migration - permissions.csv`
  - `migration - users.csv`
  - `migration - lead_sources.csv`
  - `migration - lead_statuses.csv`
  - `migration - product_categories.csv`
  - `migration - regions.csv`
  - `migration - leads.csv`
  - `migration - shops.csv`
  - `migration - products.csv`

## 실행 방법

1. Supabase RPC 함수 초기화 (필수):
```bash
npm run init-rpc
```
이 단계에서 오류가 발생하면 Supabase SQL 에디터에서 직접 RPC 함수를 생성해야 할 수 있습니다. 콘솔 출력에 제공된 SQL 문을 사용하세요.

2. 데이터 마이그레이션 실행:
```bash
npm run migrate
```

## 마이그레이션 실행 순서

스크립트는 다음 순서로 테이블에 데이터를 삽입합니다:

1. 기본 테이블 데이터
   - roles
   - permissions
   - role_permissions

2. 사용자 관련 데이터
   - users
   - user_roles

3. 업무 관련 기본 데이터
   - lead_sources
   - lead_statuses
   - product_categories
   - regions
   - settings

4. 핵심 비즈니스 데이터
   - leads
   - shops
   - products

5. 추가 데이터
   - kols
   - customers

6. 양방향 참조 관계
   - Shop-KOL 관계 업데이트

## 오류 처리

- 각 테이블 삽입 단계는 독립적으로 실행되며, 한 테이블에서 오류가 발생해도 나머지 테이블 처리는 계속됩니다.
- 오류 로그는 콘솔에 출력됩니다.
- 각 CSV 파일이 비어 있거나 찾을 수 없는 경우 해당 단계는 건너뜁니다.

## 구조

- `src/utils/`: 유틸리티 함수
- `src/tables/`: 각 테이블별 삽입 함수
- `src/init-rpc.js`: Supabase RPC 함수 초기화
- `src/migrate.js`: 통합 마이그레이션 스크립트 