### 제품 요구사항 문서 (PRD): `kol-new` 기능 개선 및 안정화

**문서 번호**: `KOL-PRD-20240718-01`
**작성일**: 2024년 07월 18일
**관련 문제 보고서**: `KOL-REPORT-20240718-01`

---

### 1. 배경 및 목표

`kol-new` 관련 페이지 전반에 걸쳐 데이터 불일치 및 기능 오류가 다수 발견되었다. (참고: `kol-new-issues-report.md`). 본 PRD의 목표는 발견된 문제들을 해결하여 서비스 안정성과 데이터 무결성을 확보하고, 사용자 경험을 개선하는 것이다.

---

### 2. 사용자 스토리

- **As a KOL**, 나는 '본인 임상' 케이스를 생성했을 때, 시스템이 이를 '고객 임상'과 명확히 구분하여 관리하기를 원한다.
- **As a KOL**, 나는 새로운 고객을 등록할 때, 전화번호와 같은 필수 정보들을 빠짐없이 입력하여 체계적으로 관리하고 싶다.
- **As a KOL**, 나는 '전문점 현황' 페이지에서 내가 관리하는 모든 전문점의 목록과 매출 순위를 한눈에 파악하고 싶다.

---

### 3. 기능 요구사항

| ID         | 기능          | 요구사항 상세                                                                                                                  | 우선순위      |
| :--------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------- | :------------ |
| **REQ-01** | **임상 사진** | '본인' 케이스 생성 시, 데이터베이스의 `subject_type` 필드가 `self`로 정확히 저장되어야 한다.                                   | **매우 높음** |
| **REQ-02** | **고객 관리** | 신규 고객 추가 시, 필수 정보(이름, 전화번호, 지역)를 입력받는 UI(모달)를 제공하고, 해당 정보가 저장되도록 한다.                | **높음**      |
| **REQ-03** | **매장 관리** | 매장 관리 페이지가 Convex 데이터를 직접 호출하여 KOL의 하위 전문점 목록과 관련 통계를 정상적으로 표시하도록 전면 리팩토링한다. | **매우 높음** |
| **REQ-04** | **코드 정리** | 매장 관리 페이지 리팩토링 후, 더 이상 사용되지 않는 API 라우트 파일들을 프로젝트에서 삭제하여 코드베이스를 정리한다.           | **중간**      |

---

### 4. 세부 구현 계획

#### REQ-01: 임상 사진 `subject_type` 오류 수정

1.  **파일 수정**: `lib/clinical-photos-mapper.ts`
2.  **함수**: `uiToConvexCreateArgs`
3.  **수정 내용**:
    - `uiData.customerName`이 '본인'인지 확인하는 조건을 추가한다.
    - '본인'일 경우, 반환 객체의 `subject_type`을 `'self'`로 설정한다.
    - '본인'이 아닐 경우, 기존 로직대로 `'customer'`로 설정한다.

```typescript
// 수정 예시
export const uiToConvexCreateArgs = (uiData: Partial<UIClinicalCase>) => {
  // ... 기존 로직 ...

  const subjectType = (uiData.customerName || '').trim() === '본인' ? 'self' : 'customer';

  return {
    subject_type: subjectType,
    name: uiData.customerName || '',
    // ... 나머지 필드 ...
  };
};
```

#### REQ-02: 신규 고객 생성 플로우 개선

1.  **파일 수정**: `app/kol-new/customer-manager/components/CustomerList.tsx`
2.  **UI 변경**:
    - '고객 추가' 버튼 클릭 시, 바로 고객을 생성하는 대신 `shadcn/ui`의 `Dialog` 컴포넌트를 사용한 모달 창을 표시한다.
    - 모달 창에는 이름, 전화번호, 지역을 입력할 수 있는 폼 필드를 포함한다.
3.  **로직 변경**:
    - `handleAddCustomer` 함수를 수정하여 모달을 여는 역할만 하도록 변경한다.
    - 모달의 '저장' 버튼 클릭 시, 폼 데이터를 유효성 검사한 후 `createCustomer` mutation을 호출한다.
    - `createCustomer` 호출 시, `name`, `phone`, `region` 등 필수 필드에 실제 입력값을 전달한다. (나머지 선택적 필드는 빈 문자열로 전달)

#### REQ-03: 매장 관리 페이지 리팩토링

1.  **신규 파일 생성**: `hooks/useKolStoresData.ts` (가칭)
    - Convex의 `useQuery`를 사용하여 `api.relationships.getSubordinateShops`를 호출, KOL의 하위 매장 목록을 가져온다.
    - 가져온 매장 목록을 기반으로, 각 매장의 월간 매출 데이터를 조회하는 로직을 추가한다. (예: `api.orders.getMonthlySales` 활용)
    - 두 데이터를 조합하여 `app/kol-new/stores/page.tsx`에서 사용하기 용이한 형태로 가공하여 반환하는 커스텀 훅을 구현한다.
2.  **파일 수정**: `app/kol-new/stores/page.tsx`
    - 기존의 `useEffect`와 `fetch`를 사용한 데이터 로딩 로직을 모두 제거한다.
    - 새로 만든 `useKolStoresData` 훅을 호출하여 데이터를 가져온다.
    - 훅이 반환하는 `isLoading`, `error`, `data` 상태를 사용하여 UI를 렌더링하도록 수정한다.

#### REQ-04: 레거시 API 라우트 삭제

1.  `REQ-03` 완료 후, 다음 파일 및 관련 디렉토리를 프로젝트에서 완전히 삭제한다.
    - `app/api/kol-new/shops/route.ts`
    - `app/api/kol-new/dashboard/route.ts`

---

### 5. 성공 지표 (Acceptance Criteria)

- **AC-01**: 임상 사진에서 '본인' 케이스를 생성하고 DB를 확인했을 때, `subject_type` 필드가 `self`로 저장되어 있다.
- **AC-02**: 고객 관리 페이지에서 '고객 추가' 버튼을 누르면 이름, 전화번호, 지역을 입력하는 팝업이 나타난다.
- **AC-03**: 위 팝업에서 정보를 입력하고 저장하면, 해당 정보가 포함된 새로운 고객이 목록에 나타난다.
- **AC-04**: KOL 계정으로 로그인하여 '전문점 현황' 페이지에 접속하면, 로딩 후 자신의 하위 전문점 목록과 매출 순위가 정상적으로 표시된다.
- **AC-05**: 프로젝트 파일 트리에서 `app/api/kol-new/shops/` 와 `app/api/kol-new/dashboard/` 경로가 존재하지 않는다.

---
