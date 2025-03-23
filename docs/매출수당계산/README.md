# 매출수당계산 시스템 구현

이 문서는 KOL 매출 및 수당 계산 시스템의 구현 내용을 설명합니다.

## 1. 구현 개요

KOL(Key Opinion Leader)의 소속 전문점들의 주문 데이터를 기반으로 매출과 수당을 계산하고 관리하는 시스템을 구현했습니다. 주요 기능은 다음과 같습니다:

- KOL의 소속 전문점들의 주문 데이터를 기반으로 매출과 수당 계산
- 제품 매출(기기 제외)의 30%가 KOL 수당으로 계산
- 월별로 KOL별, 전문점별 매출과 수당 관리
- 제품별 매출 비율 관리
- 전문점별 순위 관리 (월평균매출, 당월매출, 누적매출 기준)
- 전문점별 당월매출, 수당, 월평균 매출, 누적 수당 관리
- KOL 계층 구조 관리 및 상위 KOL에게 하위 KOL 첫 달 매출의 10% 수당 지급
- 전월과 당월 매출/수당 비교 기능

## 2. 기술 스택

- 프레임워크: Next.js (App Router)
- 데이터베이스: Supabase (PostgreSQL)
- ORM: Drizzle
- UI 컴포넌트: ShadCN
- 데이터 시각화: Recharts

## 3. 디렉토리 구조

```
biofox-kol/
├── app/
│   ├── api/
│   │   ├── sales/
│   │   │   ├── monthly-summary/
│   │   │   ├── product-ratios/
│   │   │   ├── shop-ranking/
│   │   │   ├── shop-details/
│   │   │   └── register/
│   │   └── mock/
│   │       └── cafe24-webhook/
│   └── dashboard/
│       ├── sales/
│       ├── shops/
│       │   └── [shopId]/
│       └── commissions/
├── components/
│   └── dashboard/
│       ├── MonthSelector.tsx
│       ├── SummaryCard.tsx
│       ├── SalesSummary.tsx
│       ├── MonthlyTrendChart.tsx
│       ├── ProductRatioChart.tsx
│       ├── ShopStatusWidget.tsx
│       └── ShopRankingTable.tsx
├── db/
│   ├── schema.ts (확장)
│   └── migrations/
│       └── sales-commission.ts
└── lib/
    └── sales-utils.ts
```

## 4. 데이터베이스 스키마

새로 추가된 테이블:

1. `monthly_sales`: KOL별, 전문점별 월별 매출 및 수당 관리
2. `product_sales_ratios`: 전문점별 제품 매출 비율 관리
3. `kol_hierarchy`: KOL 계층 구조 관리
4. `kol_monthly_summary`: KOL 월별 매출/수당 요약 데이터

## 5. API 엔드포인트

### 5.1 매출 및 수당 요약 API

- `GET /api/sales/monthly-summary`: KOL의 월별 매출, 수당, 전월 대비 비교 데이터 조회
- `GET /api/sales/monthly-summary/list`: KOL의 여러 달에 걸친 매출, 수당 요약 데이터 조회

### 5.2 제품 매출 비율 API

- `GET /api/sales/product-ratios`: 전문점/KOL별 월간 제품 매출 비율 데이터 조회

### 5.3 전문점 순위 API

- `GET /api/sales/shop-ranking`: 전문점 순위 데이터 조회

### 5.4 전문점 상세 정보 API

- `GET /api/sales/shop-details/[shopId]`: 특정 전문점의 월별 제품 비율 및 매출/수당 상세 데이터 조회

### 5.5 매출 및 수당 계산/저장 API

- `POST /api/sales/register`: 주문 정보를 바탕으로 월별 매출, 수당 데이터를 계산 및 저장

### 5.6 Cafe24 목업 API

- `POST /api/mock/cafe24-webhook`: Cafe24 주문 데이터를 모방하여 테스트할 수 있는 웹훅 API

## 6. 프론트엔드 페이지

### 6.1 매출 및 수당 대시보드

- 경로: `/dashboard/sales`
- 기능: 월별 매출 및 수당 요약 정보 표시, 월별 추이 차트, 제품별 매출 비율 차트, 전문점 활성 현황 표시

### 6.2 전문점 순위 페이지

- 경로: `/dashboard/shops`
- 기능: 전문점 순위 테이블, 정렬 기준 선택 옵션 (당월매출, 월평균매출, 누적매출), 월 선택 필터

### 6.3 전문점 상세 정보 페이지

- 경로: `/dashboard/shops/[shopId]`
- 기능: 전문점 기본 정보, 월별 매출/수당 정보, 제품별 판매 비율, 월별 매출 추이 차트

## 7. 주요 컴포넌트

- `MonthSelector`: 연월 선택 UI
- `SummaryCard`: 주요 지표 카드 형태 표시
- `SalesSummary`: 매출/수당 요약 컴포넌트
- `MonthlyTrendChart`: 월별 매출/수당 추이 차트
- `ProductRatioChart`: 제품별 매출 비율 차트
- `ShopStatusWidget`: 전문점 활성 현황 위젯
- `ShopRankingTable`: 전문점 순위 테이블

## 8. 핵심 비즈니스 로직

### 8.1 매출 및 수당 계산

- 제품 매출의 30%를 KOL 수당으로 계산
- 기기 매출은 수당 계산에서 제외
- KOL 계층 구조에서 상위 KOL에게 하위 KOL 첫 달 매출의 10% 수당 지급

### 8.2 전문점 순위 계산

- 당월 매출, 월평균 매출, 누적 매출 기준으로 전문점 순위 계산
- 월평균 매출은 최근 3개월 평균으로 계산

## 9. 향후 개선 사항

- 수당 정산 관리 기능 추가
- 데이터 분석 기능 강화
- 모바일 최적화 UI 개선
- 실시간 데이터 업데이트 기능
- 엑셀 및 PDF 형식 보고서 다운로드 기능 