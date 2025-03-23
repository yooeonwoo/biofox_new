# UI 구현 계획 및 세부 사항

본 문서는 BIOFOX KOL 프로젝트의 KOL 및 전문점 관리 UI 구현에 대한 세부 계획과 구현 상황을 기록합니다.

## 1. 구현 개요

KOL 및 전문점 관리 UI는 다음과 같은 주요 컴포넌트로 구성됩니다:

1. 공통 레이아웃 컴포넌트
2. KOL 관리 UI
3. 전문점 관리 UI

모든 컴포넌트는 ShadCN UI 라이브러리를 기반으로 구현하며, Magic MCP를 활용하여 효율적으로 개발합니다.

## 2. 폴더 구조

UI 구현을 위한 폴더 구조는 다음과 같습니다:

```
biofox-kol/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       ├── layout.tsx             # 관리자 대시보드 레이아웃
│   │       ├── page.tsx               # 관리자 대시보드 메인 페이지
│   │       ├── kols/                  # KOL 관리 페이지
│   │       │   ├── page.tsx           # KOL 목록 페이지
│   │       │   ├── [id]/              # KOL 상세 페이지
│   │       │   │   ├── page.tsx
│   │       │   │   └── edit/
│   │       │   │       └── page.tsx   # KOL 수정 페이지
│   │       │   └── create/
│   │       │       └── page.tsx       # KOL 생성 페이지
│   │       └── shops/                 # 전문점 관리 페이지 (유사한 구조)
│   └── kol/
│       └── dashboard/                 # KOL 사용자 대시보드
├── components/
│   ├── ui/                            # ShadCN 컴포넌트
│   ├── layout/                        # 레이아웃 컴포넌트
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── kols/                          # KOL 관련 컴포넌트
│   │   ├── kol-list.tsx
│   │   ├── kol-detail.tsx
│   │   └── kol-form.tsx
│   └── shops/                         # 전문점 관련 컴포넌트
```

## 3. ShadCN 컴포넌트

구현에 필요한 ShadCN 컴포넌트 목록:

- Button
- Input
- Textarea
- Card, CardHeader, CardTitle, CardContent, CardFooter
- Table, TableHeader, TableBody, TableRow, TableCell
- Label
- Switch
- Avatar, AvatarFallback, AvatarImage
- Badge
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- Tabs, TabsList, TabsTrigger, TabsContent

## 4. 세부 구현 계획

### 4.1 공통 레이아웃 컴포넌트

#### 4.1.1 헤더 컴포넌트 (components/layout/header.tsx)

- 로고 및 서비스 이름
- 프로필 메뉴 (현재 로그인한 사용자 정보 및 로그아웃 옵션)
- 알림 아이콘 (향후 알림 기능 추가 시)

#### 4.1.2 사이드바 컴포넌트 (components/layout/sidebar.tsx)

- 대시보드 메인 링크
- KOL 관리 링크
- 전문점 관리 링크
- 제품 관리 링크 (향후 구현)
- 주문 관리 링크 (향후 구현)
- 수당 정산 링크 (향후 구현)
- 사용자 권한에 따른 조건부 표시

#### 4.1.3 푸터 컴포넌트 (components/layout/footer.tsx)

- 저작권 정보
- 서비스 버전 정보
- 고객 지원 링크

### 4.2 KOL 관리 UI

#### 4.2.1 KOL 목록 컴포넌트 (components/kols/kol-list.tsx)

- 테이블 형태로 KOL 목록 표시
- 검색 기능
- KOL 상태별 필터링
- 페이지네이션
- 새 KOL 등록 버튼
- 각 KOL별 상세보기, 수정, 삭제 액션 버튼

#### 4.2.2 KOL 상세 컴포넌트 (components/kols/kol-detail.tsx)

- KOL 기본 정보 (이름, 상점명, 연락처, 주소 등)
- 계좌 정보 (은행명, 계좌번호, 예금주)
- 소속 전문점 목록 (카드 그리드 형태)
- 프로필 이미지
- 활성/비활성 상태 표시
- 수정 및 삭제 버튼

#### 4.2.3 KOL 폼 컴포넌트 (components/kols/kol-form.tsx)

- KOL 정보 입력 필드 (이름, 상점명, 연락처, 주소 등)
- 계좌 정보 입력 필드
- 프로필 이미지 업로드
- 상태 관리 스위치 (활성/비활성)
- 폼 유효성 검증
- 제출 및 취소 버튼

### 4.3 전문점 관리 UI

#### 4.3.1 전문점 목록 컴포넌트 (components/shops/shop-list.tsx)

- 테이블 형태로 전문점 목록 표시
- 검색 기능
- KOL별 필터링
- 페이지네이션
- 새 전문점 등록 버튼
- 각 전문점별 상세보기, 수정, 삭제 액션 버튼

#### 4.3.2 전문점 상세 컴포넌트 (components/shops/shop-detail.tsx)

- 전문점 기본 정보 (이름, 주소, 연락처, 사업자번호 등)
- 소속 KOL 정보
- 전문점 이미지
- 운영 시간 정보
- 활성/비활성 상태 표시
- 수정 및 삭제 버튼

#### 4.3.3 전문점 폼 컴포넌트 (components/shops/shop-form.tsx)

- 전문점 정보 입력 필드 (이름, 주소, 연락처 등)
- KOL 선택 드롭다운
- 전문점 이미지 업로드
- 운영 시간 입력
- 상태 관리 스위치 (활성/비활성)
- 폼 유효성 검증
- 제출 및 취소 버튼

## 5. API 연동

UI 컴포넌트는 다음 API 엔드포인트와 연동하여 데이터를 가져오고 관리합니다:

### 5.1 KOL 관리 API

- GET /api/kols - KOL 목록 조회
- POST /api/kols - KOL 등록
- GET /api/kols/:id - 특정 KOL 조회
- PUT /api/kols/:id - KOL 정보 수정
- DELETE /api/kols/:id - KOL 삭제

### 5.2 전문점 관리 API

- GET /api/shops - 전문점 목록 조회
- POST /api/shops - 전문점 등록
- GET /api/shops/:id - 특정 전문점 조회
- PUT /api/shops/:id - 전문점 정보 수정
- DELETE /api/shops/:id - 전문점 삭제
- GET /api/kols/:id/shops - 특정 KOL의 전문점 목록 조회

## 6. 구현 우선순위

1. ShadCN 컴포넌트 설치
2. 공통 레이아웃 컴포넌트 구현
3. KOL 목록 페이지 구현
4. KOL 상세 페이지 구현
5. KOL 등록/수정 페이지 구현
6. 전문점 목록 페이지 구현
7. 전문점 상세 페이지 구현
8. 전문점 등록/수정 페이지 구현

## 7. 진행 상황

| 컴포넌트 | 상태 | 완료일 |
|---------|------|--------|
| ShadCN 컴포넌트 설치 | ⬜ 예정 | |
| 헤더 컴포넌트 | ⬜ 예정 | |
| 사이드바 컴포넌트 | ⬜ 예정 | |
| 푸터 컴포넌트 | ⬜ 예정 | |
| KOL 목록 컴포넌트 | ⬜ 예정 | |
| KOL 상세 컴포넌트 | ⬜ 예정 | |
| KOL 폼 컴포넌트 | ⬜ 예정 | |
| 전문점 목록 컴포넌트 | ⬜ 예정 | |
| 전문점 상세 컴포넌트 | ⬜ 예정 | |
| 전문점 폼 컴포넌트 | ⬜ 예정 | | 