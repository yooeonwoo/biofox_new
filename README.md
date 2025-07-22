# BIOFOX KOL 시스템 - Convex 마이그레이션 프로젝트

## 🎯 프로젝트 개요

이 프로젝트는 기존 Xano 백엔드 기반의 BIOFOX KOL 시스템을 **Convex**로 마이그레이션하는 프로젝트입니다. Convex의 실시간 데이터베이스와 서버리스 아키텍처를 활용하여 더 나은 성능과 개발 경험을 제공합니다.

## 🔧 기술 스택

### Frontend

- **Next.js 14** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성을 위한 정적 타입 언어
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트 라이브러리

### Backend (Migration Target)

- **Convex** - 실시간 백엔드-as-a-서비스
- **Convex Auth** - 사용자 인증 및 권한 관리
- **Convex Functions** - 서버리스 쿼리 및 뮤테이션

### 기존 시스템 (Migration Source)

- **Xano** - 기존 백엔드 플랫폼
- **PostgreSQL** - 기존 데이터베이스

## 📁 프로젝트 구조

```
biofox-kol/
├── app/                    # Next.js App Router 페이지
│   ├── admin-dashboard/    # 관리자 대시보드
│   ├── kol-new/           # KOL 사용자 인터페이스
│   └── api/               # API 라우트 (기존)
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── admin/            # 관리자 컴포넌트
│   └── clinical/         # 시술 관리 컴포넌트
├── convex/               # Convex 백엔드 함수들 (생성 예정)
├── lib/                  # 유틸리티 및 설정
├── hooks/                # 커스텀 React 훅
├── types/                # TypeScript 타입 정의
└── utils/                # 헬퍼 함수들
```

## 🚀 시작하기

### 전제 조건

- Node.js 18.0.0 이상
- npm, yarn, 또는 pnpm

### 설치

1. **저장소 클론**

   ```bash
   git clone [repository-url]
   cd biofox-kol
   ```

2. **의존성 설치**

   ```bash
   npm install
   # 또는
   yarn install
   # 또는
   pnpm install
   ```

3. **환경 변수 설정**

   ```bash
   cp .env.example .env.local
   ```

   환경 변수 파일을 수정하여 필요한 API 키와 설정을 추가하세요.

4. **개발 서버 시작**

   ```bash
   npm run dev
   # 또는
   yarn dev
   # 또는
   pnpm dev
   ```

   [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📊 마이그레이션 범위

### 기존 시스템 데이터 모델

- **주문 관리**: orders, order_items
- **디바이스 판매**: device_sales, kol_device_accumulator
- **CRM 시스템**: crm_cards, self_growth_cards
- **시술 관리**: clinical_cases, clinical_sessions

### Convex 마이그레이션 계획

1. **스키마 설계** - Convex 스키마로 데이터 모델 재정의
2. **인증 시스템** - Convex Auth로 사용자 인증 구현
3. **실시간 기능** - 실시간 데이터 업데이트 및 알림
4. **API 마이그레이션** - 기존 API를 Convex 함수로 변환
5. **데이터 마이그레이션** - 기존 데이터를 Convex로 이전

## 🛠️ 개발 가이드

### 코드 스타일

- **ESLint** 및 **Prettier**를 사용한 코드 포매팅
- **Husky** 프리 커밋 훅으로 코드 품질 보장
- **TypeScript Strict Mode** 활성화

### 테스팅

```bash
# 단위 테스트 실행
npm run test

# E2E 테스트 실행
npm run test:e2e

# 테스트 커버리지 확인
npm run test:coverage
```

### 브랜치 전략

- `main` - 프로덕션 브랜치
- `convex` - Convex 마이그레이션 작업 브랜치 (현재)
- `feature/*` - 기능별 브랜치

## 📈 마이그레이션 진행 상황

- ✅ 프로젝트 저장소 설정
- 🔄 Convex 백엔드 설정 (진행 예정)
- 🔄 사용자 인증 구현 (진행 예정)
- 🔄 데이터베이스 스키마 마이그레이션 (진행 예정)
- 🔄 API 엔드포인트 구현 (진행 예정)
- 🔄 프론트엔드 통합 (진행 예정)
- 🔄 실시간 기능 구현 (진행 예정)
- 🔄 데이터 마이그레이션 스크립트 (진행 예정)
- 🔄 배포 파이프라인 설정 (진행 예정)
- 🔄 종합 테스트 및 문서화 (진행 예정)

## 🔗 유용한 링크

- [Convex Documentation](https://docs.convex.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

**마이그레이션 시작일**: 2024년 현재  
**예상 완료일**: TBD  
**현재 브랜치**: convex
