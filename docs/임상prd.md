## PRD: 임상 사진 고객 관리 시스템 - Convex 실시간 저장 구현 (프론트엔드 보존)

### 1. 개요

#### 1.1 배경

현재 임상 사진 고객 관리 시스템은 새 고객 추가 시 로컬스토리지를 사용하려던 미완성 구현으로 인해 작동하지 않습니다. 이를 Convex 실시간 데이터베이스에 직접 저장하는 방식으로 수정하되, **기존 UI/UX와 애니메이션은 완전히 보존**합니다.

#### 1.2 핵심 원칙

- **프론트엔드 불변**: 모든 UI 컴포넌트, 애니메이션, 레이아웃 유지
- **데이터 레이어만 수정**: hooks와 Convex 통신 로직만 변경
- **완전한 CRUD**: Create, Read, Update, Delete 모두 작동
- **세로 스크롤 유지**: 케이스는 계속 아래로 추가되는 현재 구조 유지

### 2. 기능 요구사항

#### 2.1 Create (생성)

- "새 고객" 버튼 클릭 시 Convex에 즉시 케이스 생성
- 생성된 케이스는 목록 최상단에 추가 (기존 동작 유지)
- 임시 ID 대신 Convex가 생성한 실제 ID 사용
- 빈 폼 상태로 시작 (기존 UI 그대로)

#### 2.2 Read (조회)

- Convex에서 실시간으로 케이스 목록 조회
- 본인(KOL)이 생성한 케이스만 표시
- 기존 필터링 로직 유지 (고객명 '본인' 제외)
- 세로 스크롤 레이아웃 유지

#### 2.3 Update (수정)

- 모든 필드 변경 시 Convex에 실시간 저장
- 기존 디바운싱 로직 유지
- 저장 상태 표시 (saving/saved/error) 유지
- 체크박스, 텍스트 입력 등 모든 상호작용 보존

#### 2.4 Delete (삭제)

- 휴지통 아이콘 클릭 시 Convex에서 즉시 삭제
- 기존 삭제 확인 로직 유지
- 삭제 후 UI에서 즉시 제거 (애니메이션 유지)

### 3. 기술 구현 상세

#### 3.1 데이터 구조 변경 없음

```typescript
// 기존 ClinicalCase 인터페이스 유지
interface ClinicalCase {
  id: string; // Convex ID 사용
  customerName: string;
  status: 'active' | 'completed';
  // ... 모든 기존 필드 유지
}
```

#### 3.2 Convex 스키마 (기존 유지)

```typescript
clinical_cases: defineTable({
  // 기존 스키마 그대로 사용
  customerName: v.string(),
  status: v.union(v.literal('active'), v.literal('completed')),
  kolId: v.number(),
  userId: v.string(),
  // ... 기존 필드들
});
```

#### 3.3 hooks 수정 사항

##### useCustomerPageState.ts

```typescript
// 수정 사항:
1. setCases를 실제 동작하는 함수로 변경
2. localStorage 관련 코드 완전 제거
3. hasUnsavedNewCustomer 관련 로직 제거
4. allCases 로직 단순화 (cases만 반환)

// 유지 사항:
- 모든 상태 변수명
- refs
- 애니메이션 관련 로직
- 디바운싱 로직
```

##### useCustomerCaseHandlers.ts

```typescript
// handleAddCustomer 수정:
1. 'new-customer-*' ID 제거
2. Convex createCase mutation 즉시 호출
3. 생성된 실제 ID로 케이스 추가
4. setHasUnsavedNewCustomer 관련 제거

// 기타 핸들러 수정:
- isNewCustomer 체크 제거
- 모든 업데이트를 Convex mutation으로 직접 처리
- localStorage 관련 코드 제거
```

### 4. 구현 세부사항

#### 4.1 새 고객 추가 플로우

```typescript
const handleAddCustomer = useCallback(async () => {
  try {
    // 1. Convex에 빈 케이스 생성
    const newCase = await createCase.mutateAsync({
      customerName: '',
      status: 'active',
      kolId: user.kolId,
      userId: user.id,
      // 기본값들...
    });

    // 2. 로컬 상태에 추가 (기존 UI 동작 유지)
    setCases(prev => [
      {
        ...newCase,
        id: newCase._id, // Convex ID 사용
      },
      ...prev,
    ]);

    // 3. 현재 라운드 초기화
    setCurrentRounds(prev => ({ ...prev, [newCase._id]: 1 }));
  } catch (error) {
    toast.error('새 고객 추가 중 오류가 발생했습니다.');
  }
}, [createCase, user, setCases, setCurrentRounds]);
```

#### 4.2 데이터 업데이트 플로우

```typescript
// 기존 디바운싱 로직 유지하면서 Convex 저장
const handleBasicCustomerInfoUpdate = useCallback(
  (caseId: string, field: string, value: any) => {
    // 1. 낙관적 업데이트 (UI 즉시 반영)
    setCases(prev =>
      prev.map(c =>
        c.id === caseId ? { ...c, customerInfo: { ...c.customerInfo, [field]: value } } : c
      )
    );

    // 2. 디바운싱으로 Convex 저장
    debouncedUpdate(caseId, async () => {
      markSaving(caseId);
      try {
        await updateCaseFields({
          caseId,
          updates: { [`customerInfo.${field}`]: value },
        });
        markSaved(caseId);
      } catch (error) {
        markError(caseId);
        toast.error('저장 중 오류가 발생했습니다.');
      }
    });
  },
  [setCases, debouncedUpdate, updateCaseFields, markSaving, markSaved, markError]
);
```

#### 4.3 삭제 플로우

```typescript
const handleDeleteCase = useCallback(
  async (caseId: string) => {
    try {
      // 1. Convex에서 삭제
      await deleteCase.mutateAsync({ caseId });

      // 2. 로컬 상태에서 제거 (애니메이션 유지)
      setCases(prev => prev.filter(c => c.id !== caseId));

      // 3. 관련 상태 정리
      setCurrentRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[caseId];
        return newRounds;
      });

      toast.success('케이스가 삭제되었습니다.');
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  },
  [deleteCase, setCases, setCurrentRounds]
);
```

### 5. 제거할 코드

#### 5.1 완전 제거

- `isNewCustomer` 함수
- `hasUnsavedNewCustomer` 상태 및 관련 로직
- `getUnsavedNewCustomer` 함수
- localStorage 관련 모든 코드
- 'new-customer-\*' ID 패턴 체크

#### 5.2 수정할 코드

- `setCases: () => {}` → 실제 setState 함수로 변경
- `handleSaveNewCustomer` → 제거 (자동 저장이므로 불필요)
- 조건부 저장 로직 → 모든 변경사항 즉시 저장

### 6. 영향받지 않는 부분

#### 6.1 완전 보존

- 모든 UI 컴포넌트 (CaseCard, PageHeader 등)
- 애니메이션 로직 (AnimatePresence, motion)
- 레이아웃 및 스타일링
- 세로 스크롤 구조
- 디바운싱 유틸리티
- 저장 상태 표시 UI

#### 6.2 인터페이스 유지

- 컴포넌트 props
- 이벤트 핸들러 시그니처
- 상태 변수명

### 7. 테스트 시나리오

#### 7.1 CRUD 테스트

1. **Create**: 새 고객 버튼 → 빈 폼 생성 → DB 확인
2. **Read**: 페이지 로드 → 본인 케이스만 표시
3. **Update**: 각 필드 수정 → 실시간 저장 확인
4. **Delete**: 삭제 버튼 → 확인 → DB에서 제거 확인

#### 7.2 엣지 케이스

- 네트워크 오류 시 에러 처리
- 동시 수정 시 마지막 업데이트 우선
- 빈 필드 저장 허용

### 8. 구현 우선순위

1. **Phase 1**: Create 기능 (새 고객 추가)
2. **Phase 2**: Update 기능 (필드 수정)
3. **Phase 3**: Delete 기능 (케이스 삭제)
4. **Phase 4**: 에러 처리 및 최적화

### 9. 성공 지표

- 새 고객 추가 시 즉시 폼 표시
- 모든 수정사항 실시간 저장
- 삭제 기능 정상 작동
- 기존 UI/UX 100% 유지
- 페이지 새로고침 후에도 데이터 유지
