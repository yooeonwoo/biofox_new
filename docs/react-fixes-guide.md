# React 렌더링 및 접근성 문제 해결 가이드

이 문서는 현재 프로젝트에서 발생하고 있는 두 가지 주요 문제인 **React 렌더링 오류(Error #185)**와 **Dialog 접근성 경고**를 해결하기 위한 가이드입니다.

---

### 1. 문제: React 렌더링 오류 (Error #185) - 앱 충돌

#### 원인

이 오류는 React 컴포넌트의 `.map()` 콜백 함수가 특정 조건에서 아무것도 반환하지 않을 때(즉, `undefined`를 반환할 때) 발생합니다. React는 `undefined`를 렌더링할 수 없기 때문에 앱이 중단됩니다.

주로 다음과 같은 패턴에서 발생합니다.

```javascript
array.map(item => {
  if (!someCondition) {
    // someCondition이 false일 때 아무것도 반환하지 않음 (undefined 반환)
    return;
  }
  return <Component {...item} />;
});
```

#### 해결 방안

`.map()` 콜백 함수는 **모든 코드 경로에서 항상 유효한 값(JSX 또는 `null`)을 반환**하도록 수정해야 합니다. 렌더링할 것이 없다면 명시적으로 `null`을 반환해야 합니다.

#### 수정 대상 파일

##### 가. `app/kol-new/clinical-photos/components/CaseCard/sub/ProductSection.tsx`

- **파일 경로**: `app/kol-new/clinical-photos/components/CaseCard/sub/ProductSection.tsx`
- **수정 전 코드**:
  ```tsx
  // ...
  {
    SYSTEM_OPTIONS.products.map(opt => {
      const field = PRODUCT_FIELD_MAP[opt.value];
      if (!field) return; // 🚨 문제의 코드: undefined를 반환함
      const checked = caseItem[field] as boolean | undefined;
      return (
        <label key={opt.value} className="flex items-center space-x-2 text-sm">
          {/* ... */}
        </label>
      );
    });
  }
  // ...
  ```
- **수정 후 코드**:
  ```tsx
  // ...
  {
    SYSTEM_OPTIONS.products.map(opt => {
      const field = PRODUCT_FIELD_MAP[opt.value];
      if (!field) return null; // ✅ 수정된 코드: null을 명시적으로 반환
      const checked = caseItem[field] as boolean | undefined;
      return (
        <label key={opt.value} className="flex items-center space-x-2 text-sm">
          {/* ... */}
        </label>
      );
    });
  }
  // ...
  ```

##### 나. `app/kol-new/clinical-photos/components/CaseCard/sub/SkinTypeSection.tsx`

- **파일 경로**: `app/kol-new/clinical-photos/components/CaseCard/sub/SkinTypeSection.tsx`
- **수정 전 코드**:
  ```tsx
  // ...
  {
    SYSTEM_OPTIONS.skinTypes.map(opt => {
      const field = SKIN_FIELD_MAP[opt.value];
      if (!field) return; // 🚨 문제의 코드: undefined를 반환함
      const checked = caseItem[field] as boolean | undefined;
      return (
        <label key={opt.value} className="flex items-center space-x-2 text-sm">
          {/* ... */}
        </label>
      );
    });
  }
  // ...
  ```
- **수정 후 코드**:
  ```tsx
  // ...
  {
    SYSTEM_OPTIONS.skinTypes.map(opt => {
      const field = SKIN_FIELD_MAP[opt.value];
      if (!field) return null; // ✅ 수정된 코드: null을 명시적으로 반환
      const checked = caseItem[field] as boolean | undefined;
      return (
        <label key={opt.value} className="flex items-center space-x-2 text-sm">
          {/* ... */}
        </label>
      );
    });
  }
  // ...
  ```

---

### 2. 문제: Dialog 접근성 경고

#### 원인

`shadcn/ui`의 `DialogContent`, `AlertDialogContent`, `SheetContent`와 같은 모달 컴포넌트는 웹 접근성 표준을 준수하기 위해 스크린 리더가 인식할 수 있는 제목(`DialogTitle` 또는 `AlertDialogTitle`)을 필요로 합니다. 이 제목이 없으면 경고가 발생합니다.

#### 해결 방안

모든 모달 컴포넌트 내부에 `DialogTitle` 또는 `AlertDialogTitle`을 추가합니다. 만약 제목을 시각적으로 표시하고 싶지 않다면, `sr-only` (screen-reader only) CSS 클래스를 사용하여 숨기거나, `@radix-ui/react-visually-hidden` 컴포넌트로 감싸면 됩니다.

#### 수정 대상 파일

##### 가. `app/kol-new/clinical-photos/upload/page.tsx`

- **파일 경로**: `app/kol-new/clinical-photos/upload/page.tsx`
- **수정 전 코드**:
  ```tsx
  // ...
  <SheetContent side="left" className="w-[250px] sm:w-[300px]">
    <KolMobileMenu
      {/* ... */}
    />
  </SheetContent>
  // ...
  ```
- **수정 후 코드**:
  ```tsx
  // ...
  import { DialogTitle } from '@/components/ui/dialog'; // DialogTitle import
  // ...
  <SheetContent side="left" className="w-[250px] sm:w-[300px]">
    <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
    <KolMobileMenu
      {/* ... */}
    />
  </SheetContent>
  // ...
  ```
  _참고: `SheetTitle` 컴포넌트가 있다면 그것을 사용하고, 없다면 `DialogTitle`을 사용합니다. `sr-only` 클래스는 `globals.css`에 이미 정의되어 있습니다._

##### 나. `app/kol-new/clinical-photos/components/CaseCard/sub/CaseHeader.tsx`

- 이 파일은 이미 `AlertDialogTitle`을 올바르게 사용하고 있어 **수정이 필요 없습니다.**

```tsx
// app/kol-new/clinical-photos/components/CaseCard/sub/CaseHeader.tsx
<AlertDialogHeader>
  <AlertDialogTitle>케이스를 삭제하시겠습니까?</AlertDialogTitle> {/* ✅ 올바른 구현 */}
  <AlertDialogDescription>삭제 후에는 복구할 수 없습니다.</AlertDialogDescription>
</AlertDialogHeader>
```

이 가이드를 따라 위 파일들을 수정하시면 두 가지 문제가 모두 해결될 것입니다.
