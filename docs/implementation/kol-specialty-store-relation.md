# KOL-전문점 관계 구현 문서

## 개요

이 문서는 BIOFOX KOL 프로젝트에서 KOL(Key Opinion Leader)과 전문점 간의 관계를 구현하는 방법에 대해 설명합니다. 이 기능을 통해 각 전문점이 어떤 KOL에 소속되어 있는지를 명확하게 관리할 수 있습니다.

## 기능 요구사항

1. 각 전문점은 하나의 KOL에 소속될 수 있어야 함
2. 관리자가 전문점 등록/수정 시 소속 KOL을 지정할 수 있어야 함
3. KOL별로 전문점을 필터링하고 그룹화하여 볼 수 있어야 함
4. 특정 KOL에 바로 전문점을 추가할 수 있는 기능 제공

## 구현 상세

### 데이터 모델 변경

전문점(`ISpecialtyStore`) 인터페이스에 KOL 관련 필드 추가:

```typescript
export interface ISpecialtyStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerName: string;
  status: "active" | "inactive";
  businessNumber?: string;
  description?: string;
  kolId: string;      // KOL ID 추가
  kolName: string;    // KOL 이름 추가 (화면 표시용)
}
```

KOL 타입 정의:

```typescript
export interface IKOL {
  id: string;
  name: string;
}
```

### UI 변경사항

1. **KOL 필터링 기능**:
   - 전문점 목록 상단에 KOL 드롭다운 필터 추가
   - 선택된 KOL에 따라 전문점 목록 필터링

2. **KOL별 그룹화 뷰**:
   - 필터 적용 전에는 KOL별로 그룹화된 전문점 목록 표시
   - 각 KOL 그룹에는 해당 KOL에 바로 전문점을 추가할 수 있는 버튼 제공

3. **전문점 등록/수정 폼**:
   - KOL 선택 필드 추가
   - KOL 선택 시 자동으로 kolName 필드 업데이트

4. **테이블 구조 변경**:
   - 소속 KOL 컬럼 추가
   - 미지정 KOL 전문점 처리 로직 추가

## API 엔드포인트 (향후 구현)

전문점 API 엔드포인트에 KOL 관련 필드를 추가해야 합니다:

- `POST /api/stores`: 전문점 생성 시 KOL ID 포함
- `PUT /api/stores/:id`: 전문점 수정 시 KOL 정보 업데이트 가능
- `GET /api/stores`: KOL별 필터링 파라미터 지원
- `GET /api/kols`: KOL 목록 조회 API 필요

## 데이터베이스 변경 (향후 구현)

Drizzle ORM 스키마에 다음과 같은 변경 필요:

```typescript
// 기존 stores 테이블에 kolId 컬럼 추가
export const stores = pgTable('stores', {
  // 기존 필드들...
  kolId: text('kol_id').references(() => kols.id),
});

// KOL 테이블 정의
export const kols = pgTable('kols', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // 기타 KOL 관련 필드들...
});
```

## 테스트 (향후 구현)

- KOL 선택 및 필터링 기능 테스트
- 그룹화 뷰 정상 작동 테스트
- KOL 지정 없는 전문점 처리 테스트
- API 엔드포인트 단위 테스트

## 참고사항

- 현재는 클라이언트 사이드에서 데모 데이터를 사용하여 구현
- 향후 실제 API 연동 시 서버 컴포넌트에서 데이터 fetching 구현 필요
- KOL 관리 페이지도 별도로 구현 필요 