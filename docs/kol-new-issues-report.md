### `kol-new` 페이지 기능 문제 보고서

**문서 번호**: `KOL-REPORT-20240718-01`
**작성일**: 2024년 07월 18일
**작성자**: AI Assistant

---

### 1. 개요

본 문서는 `biofox-kol` 프로젝트의 `kol-new` 관련 페이지 전반에 걸쳐 발견된 데이터 불일치 및 기능 오류에 대한 분석 결과를 기술합니다. 점검 결과, 핵심 기능 3가지에서 데이터 무결성을 해치거나 기능 불능을 유발하는 심각한 문제점이 발견되었습니다.

---

### 2. 발견된 문제점

#### 2.1. 임상 사진: '본인' 케이스 생성 로직 오류

- **문제 현상**: '본인' 임상 케이스를 생성할 때, 데이터베이스(`clinical_cases` 테이블)에 `subject_type` 필드가 `'self'`가 아닌 `'customer'`로 잘못 저장됩니다.
- **영향 받는 파일**:
  - `lib/clinical-photos-hooks.ts`: `useEnsurePersonalCaseConvex` 훅에서 케이스 생성을 트리거
  - `lib/clinical-photos-mapper.ts`: `uiToConvexCreateArgs` 함수가 `subject_type`을 `'customer'`로 하드코딩
  - `convex/clinical.ts`: `createClinicalCase` mutation이 `subject_type`을 필수 인자로 받음
- **원인**: 데이터 매핑 함수(`uiToConvexCreateArgs`)가 '본인' 케이스와 '고객' 케이스를 구분하지 않고 `subject_type`을 일괄적으로 `'customer'`로 설정하여 발생합니다.
- **심각도**: **높음**. 데이터의 정합성이 깨져 '본인'과 '고객'을 구분하는 로직 전체에 오류를 유발합니다.

#### 2.2. 고객 관리: 신규 고객 생성 시 필수 정보 누락

- **문제 현상**: '새 고객' 추가 시, 고객의 전화번호, 지역, 담당자 등 필수 정보 없이 빈 값(`''`)으로 데이터가 생성됩니다.
- **영향 받는 파일**:
  - `app/kol-new/customer-manager/components/CustomerList.tsx`: `handleAddCustomer` 함수에서 빈 문자열로 `createCustomer` mutation을 호출
  - `convex/customers.ts`: `createCustomer` mutation은 `phone`, `region` 등을 필수(`v.string()`)로 정의하지만, 빈 문자열도 유효성 검사를 통과
- **원인**: 신규 고객 추가 시 필수 정보를 입력받는 UI/UX 플로우가 부재하여, 정보가 누락된 채로 생성 요청이 이루어집니다.
- **심각도**: **중간**. 기능은 동작하는 것처럼 보이지만, 실제로는 데이터 품질이 저하되어 향후 고객 관리, 검색, 통계 기능에 문제를 일으킬 수 있습니다.

#### 2.3. 매장 관리: 페이지 데이터 연동 완전 단절

- **문제 현상**: '전문점 현황' 페이지(`app/kol-new/stores/page.tsx`)에 아무런 데이터도 표시되지 않습니다. 페이지가 완전히 동작하지 않는 상태입니다.
- **영향 받는 파일**:
  - `app/kol-new/stores/page.tsx`: 존재하지 않는 데이터를 반환하는 레거시 API (`/api/kol-new/shops`, `/api/kol-new/dashboard`)를 호출
  - `app/api/kol-new/shops/route.ts`: 실제 로직 없이 빈 배열(`[]`)만 반환
  - `app/api/kol-new/dashboard/route.ts`: 실제 로직 없이 빈 배열(`[]`)만 반환
- **원인**: 페이지가 최신 Convex 직접 호출 방식이 아닌, 더 이상 사용되지 않고 비어있는 API 라우트를 참조하고 있어 데이터 로딩에 실패합니다.
- **심각도**: **매우 높음**. 사용자가 자신의 하위 전문점 목록을 볼 수 없어 핵심 기능이 완전히 마비된 상태입니다.

---

### 3. 종합 의견

현재 `kol-new` 모듈은 부분적으로 최신 아키텍처(Convex 직접 호출)가 적용되었으나, 일부 페이지는 레거시 방식이 남아있어 기능 오류 및 데이터 불일치 문제가 발생하고 있습니다. 안정적인 서비스 운영을 위해 발견된 문제들을 즉시 해결하고, 코드베이스 전반의 아키텍처 일관성을 확보하는 작업이 시급합니다.
