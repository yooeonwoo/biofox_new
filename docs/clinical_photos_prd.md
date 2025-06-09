# 임상사진 관리 시스템 PRD

## 📋 프로젝트 개요

### 목적
KOL(Key Opinion Leader)이 모바일에서 간편하게 임상사진을 업로드하고 관리할 수 있는 시스템 구축

### 핵심 컨셉
- **원페이지 구조**: 새 업로드 + 기존 데이터를 한 화면에서 관리
- **모바일 최우선**: 터치 친화적 UI, 카메라 직접 연동
- **미니멀 UX**: 복잡한 선택 과정 없이 바로 입력/업로드 가능

## 🏗️ 시스템 통합 정보

### Supabase 프로젝트
- **프로젝트 ID**: `lgzzqoaiukuywmenxzay`
- **프로젝트명**: BIOFOX KOL
- **리전**: ap-northeast-2
- **데이터베이스**: PostgreSQL 15.8.1.060

### 기존 시스템 연동점
- **인증**: Clerk (기존 `getClientRole()` 함수 활용)
- **권한**: KOL 역할만 접근 가능 (`role === "kol"`)
- **데이터 연결**: `kols` 테이블과 외래키 관계
- **UI 일관성**: 기존 `/kol-new` 페이지 패턴 준수

## 📱 UI/UX 설계

### 메인 대시보드 (/kol-new/clinical-photos)
```
┌─────────────────────────────────────┐
│ 📊 내 임상 현황                       │
│ ┌─ 본인 임상  (70% 완료) ─┐          │
│ │      │          │
│ │ ████████░░ 7/10회       │          │
│ │ [완료도보기 →]          │          │
│ └─────────────────────────┘          │
│                                     │
│ ┌─ 고객 임상 (60% 완료) ─┐          │
│ │      │          │  
│ │ ██████░░░░ 6명/10명       │          │
│ │ [완료도보기 →]          │          │
│ └─────────────────────────┘          │
│                                     │
│ 📋 최근 활동                         │
│ • 본인 - 모공 케어 3회차 (완료)       │
│ • 김민지님 - 리프팅 2회차 (진행중)    │  
│                                     │
│ [+ 업로드하기] 버튼                   │
└─────────────────────────────────────┘
```

### 업로드 페이지 (원페이지)
```
┌─────────────────────────────────────┐
│ [← 뒤로] 임상사진 업로드               │
│                                     │
│ ┌─── 새 업로드 (상단 고정) ───┐        │
│ │ 이름: [_____________]      │        │
│ │ 시술: [_____________]      │        │
│ │ □ 동의서 받음 날짜: [____]  │        │
│ │                           │        │
│ │  Before   7일차   14일차   │        │
│ │ ┌─────┐ ┌─────┐ ┌─────┐   │        │
│ │ │  +  │ │  +  │ │  +  │   │        │
│ │ └─────┘ └─────┘ └─────┘   │        │
│ │                           │        │
│ │ [사진 업로드] [저장]       │        │
│ └───────────────────────────┘        │
│                                     │
│ ┌─── 이전 케이스들 ───┐               │
│ │ 📷 김민지님 - 리프팅 (6/10)  │       │
│ │ 📷 박지영님 - 기미 (완료)     │       │  
│ │ 📷 본인 - 이마주름 (8/10)     │       │
│ │ [더보기...]                │       │
│ └─────────────────────────────┘       │
└─────────────────────────────────────┘
```

## 🗄️ 데이터베이스 설계

### 스키마 구조
```sql
-- 1. KOL 고객 테이블
CREATE TABLE clinical_customers (
    id SERIAL PRIMARY KEY,
    kol_id INTEGER NOT NULL REFERENCES kols(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    birth_date DATE,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 임상 케이스 테이블
CREATE TABLE clinical_cases (
    id SERIAL PRIMARY KEY,
    kol_id INTEGER NOT NULL REFERENCES kols(id),
    customer_id INTEGER REFERENCES clinical_customers(id),
    customer_name VARCHAR(100) NOT NULL, -- 직접 입력 (본인 케이스 고려)
    case_name VARCHAR(200) NOT NULL, -- 시술명
    concern_area VARCHAR(100),
    treatment_plan TEXT,
    consent_received BOOLEAN DEFAULT FALSE, -- KOL이 체크
    consent_date DATE, -- KOL이 입력
    status VARCHAR(20) DEFAULT 'active', -- active/completed/paused
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 임상사진 테이블
CREATE TABLE clinical_photos (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES clinical_cases(id),
    kol_id INTEGER NOT NULL REFERENCES kols(id), -- 빠른 조회용
    photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
    days_from_start INTEGER NOT NULL, -- 0, 7, 14, 21일차
    angle VARCHAR(10) CHECK (angle IN ('front', 'left', 'right')),
    file_url TEXT NOT NULL, -- Supabase Storage URL
    thumbnail_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(50),
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_clinical_customers_kol_id ON clinical_customers(kol_id);
CREATE INDEX idx_clinical_cases_kol_id ON clinical_cases(kol_id);
CREATE INDEX idx_clinical_photos_case_id ON clinical_photos(case_id);
CREATE INDEX idx_clinical_photos_kol_id ON clinical_photos(kol_id);
```

## 🔌 API 설계

### 엔드포인트 구조 (기존 패턴 준수)
```
/api/kol-new/clinical-photos/
├── dashboard/route.ts          # GET: 진행상황 + 최근활동
├── customers/route.ts          # GET/POST: 고객 CRUD
├── cases/route.ts             # GET/POST: 케이스 CRUD
├── cases/[id]/route.ts        # PUT/DELETE: 케이스 수정/삭제
├── photos/route.ts            # GET/POST: 사진 CRUD
├── photos/[id]/route.ts       # DELETE: 사진 삭제
└── upload/route.ts            # POST: Supabase Storage 업로드
```

### 데이터 보안
- 모든 API에서 현재 로그인한 KOL의 데이터만 조회/수정
- `WHERE kol_id = current_kol_id` 조건 필수
- Clerk userId → kols 테이블 매핑 활용

## 📁 파일 구조

### 컴포넌트 구조 (기존 패턴 활용)
```
/app/kol-new/clinical-photos/
├── page.tsx                   # 메인 대시보드
├── upload/
│   └── page.tsx              # 업로드 원페이지
└── components/
    ├── ClinicalDashboard.tsx  # 진행상황 카드
    ├── RecentActivity.tsx     # 최근 활동 리스트
    ├── UploadForm.tsx         # 새 업로드 폼
    ├── CaseList.tsx          # 기존 케이스 목록
    ├── PhotoGrid.tsx         # 사진 그리드
    └── PhotoUploader.tsx     # 사진 업로드 컴포넌트
```

### UI 컴포넌트 재사용
```typescript
// 기존 컴포넌트 최대 활용
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import KolHeader from "@/app/components/layout/KolHeader"
import KolSidebar from "@/app/components/layout/KolSidebar"
import KolFooter from "@/app/components/layout/KolFooter"
```

## 🚀 구현 단계

### Phase 1: 기반 구조 (2-3시간)
1. **DB 스키마 생성**
   - Supabase에서 테이블 생성
   - 외래키 관계 설정
   - 기본 데이터 삽입

2. **사이드바 메뉴 추가**
   - `KolSidebar.tsx`에 "임상사진" 링크 추가
   - Camera 아이콘 적용

3. **기본 페이지 구조**
   - `/clinical-photos/page.tsx` 생성
   - 기존 레이아웃 패턴 적용

### Phase 2: 메인 대시보드 (4-5시간)
4. **진행상황 카드**
   - 케이스별 완료율 계산
   - 카드 형태 UI 구현

5. **최근 활동 피드**
   - 시간순 활동 목록
   - 사진 업로드 로그

6. **업로드하기 버튼**
   - 메인 CTA 버튼
   - 업로드 페이지 이동

### Phase 3: 업로드 기능 (8-10시간)
7. **업로드 원페이지**
   - 상단 고정 입력 폼
   - 하단 기존 케이스 목록

8. **사진 업로드**
   - Supabase Storage 연동
   - 모바일 카메라/갤러리 접근
   - 썸네일 생성

9. **케이스 관리**
   - 새 케이스 생성
   - 기존 케이스 수정
   - 동의서 체크 기능

## ⚠️ 개발 주의사항

### 프로젝트 통합 원칙
1. **일관된 코딩 스타일**
   - 기존 프로젝트의 타입스크립트 패턴 준수
   - 컴포넌트 명명 규칙 일치
   - API 응답 형식 통일

2. **하드코딩 금지**
   - 환경변수 활용 (`NEXT_PUBLIC_SUPABASE_*`)
   - 설정값은 별도 config 파일 관리
   - 매직넘버/문자열 상수화

3. **기존 시스템 활용**
   - 인증: Clerk 시스템 그대로 활용
   - UI: 기존 shadcn/ui 컴포넌트 재사용
   - 스타일: Tailwind 클래스 기존 패턴 따름

### MCP 도구 활용
1. **Supabase MCP**
   - 스키마 변경 시 `mcp__supabase__apply_migration` 활용
   - 데이터 조회는 `mcp__supabase__execute_sql` 활용
   - 프로젝트 정보는 `mcp__supabase__get_project` 확인

2. **Context7 MCP**
   - Next.js, React 관련 최신 패턴 조회
   - Supabase Storage 구현 방법 검색
   - 모바일 파일 업로드 best practice 확인

3. **Brave Search MCP**
   - 특정 에러 해결 방법 검색
   - 라이브러리 최신 버전 확인
   - 모바일 UX 패턴 리서치

### 단계별 구현 원칙
1. **작은 단위로 구현**
   - 한 번에 하나의 기능만 구현
   - 각 단계마다 테스트 및 검증
   - 문제 발생 시 즉시 수정

2. **기존 패턴 우선**
   - 새로운 패턴 도입 전 기존 코드 분석
   - 비슷한 기능이 있다면 그 패턴 활용
   - 필요시 기존 컴포넝트 확장

3. **점진적 개선**
   - MVP 기능부터 구현
   - 사용자 피드백 반영
   - 성능 최적화는 기능 완성 후

## 📊 성공 지표

### 기술적 지표
- [ ] 모든 API 엔드포인트 정상 작동
- [ ] 모바일에서 사진 업로드 성공률 95% 이상
- [ ] 페이지 로딩 시간 3초 이내
- [ ] 기존 시스템과 인증 연동 100% 호환

### 사용자 경험 지표
- [ ] 새 케이스 생성부터 첫 사진 업로드까지 2분 이내
- [ ] 뒤로가기/네비게이션 직관성
- [ ] 모바일 터치 인터페이스 편의성
- [ ] 진행상황 추적 명확성

---

**📝 Note**: 이 문서는 개발 진행에 따라 지속적으로 업데이트되며, 각 Phase 완료 시 체크리스트를 통해 진행상황을 관리합니다.