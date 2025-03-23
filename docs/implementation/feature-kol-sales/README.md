# KOL 소속 전문점 등록 및 매출 등록 기능

## 기능 개요

KOL(Key Opinion Leader) 사용자가 소속 전문점을 등록하고 매출을 관리할 수 있는 기능을 구현합니다. 이 기능을 통해 KOL이 연결된 전문점의 매출을 실시간으로 확인하고 관리할 수 있습니다.

## 주요 기능

1. **전문점 관리**
   - 전문점 목록 조회
   - 새로운 전문점 등록
   - 기존 전문점 정보 수정
   - 전문점 삭제 기능

2. **매출 등록**
   - 전문점 선택
   - 제품 및 수량 선택
   - 총 매출액 계산
   - 매출 데이터 저장

3. **Supabase 연동**
   - 실시간 데이터 동기화
   - 데이터베이스 CRUD 작업

## 기술 스택

- **Frontend**
  - Next.js (App Router)
  - TypeScript
  - ShadCN UI 컴포넌트
  - Tailwind CSS

- **Backend**
  - Next.js API Routes
  - Drizzle ORM
  - Supabase (데이터베이스 및 실시간 기능)

## 구현 계획

1. **브랜치 전략**
   - 메인 브랜치: `main`
   - 기능 브랜치: `feature/kol-store-management`, `feature/sales-registration`

2. **구현 순서**
   - 전문점 관리 기능
   - 매출 등록 기능
   - Supabase 연동 및 실시간 데이터 처리

3. **테스트 전략**
   - 컴포넌트 테스트
   - 통합 테스트
   - 사용자 경험 테스트

## 관련 이슈

- 전문점 관리 기능 구현 (#XX)
- 매출 등록 기능 구현 (#XX)
- Supabase 실시간 데이터 연동 (#XX)

## UI 컴포넌트

- 전문점 관리 페이지 (`SpecialtyStoreManagement.tsx`)
- 매출 등록 컴포넌트 (`SalesRegistration.tsx`) 