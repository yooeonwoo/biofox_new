
# 🌟 BIOFOX KOL 대시보드 데이터 관리 시스템 구축 체크리스트

## 🔍 체크리스트 사용 가이드
- `[ ]` 미완료 태스크
- `[x]` 완료된 태스크
- 각 섹션은 순서대로 구현하는 것을 권장합니다
- **중요**: 기존 API와 테이블은 수정하지 않고 새로운 API와 테이블을 추가합니다
- **주의**: Supabase MCP(프로젝트 ID: lgzzqoaiukuywmenxzay)를 적극 활용합니다
- **금지사항**: 기존 코드를 수정하거나 삭제하지 마세요

## 1. 🗃️ Supabase 테이블 구성

- [ ] KOL 대시보드 메인 데이터 테이블 생성
  - [ ] Supabase MCP로 `kol_dashboard_metrics` 테이블 생성
  - [ ] 필수 컬럼 구성: kol_id, year_month, monthly_sales, monthly_commission 등
  - [ ] kol_id + year_month 유니크 제약조건 추가
  - [ ] 외래 키 제약조건 설정 (kol_id → kols.id)

- [ ] 전문점 매출 테이블 생성
  - [ ] Supabase MCP로 `shop_sales_metrics` 테이블 생성
  - [ ] 필수 컬럼 구성: shop_id, year_month, total_sales, product_sales 등
  - [ ] shop_id + year_month 유니크 제약조건 추가
  - [ ] 외래 키 제약조건 설정 (shop_id → shops.id)

- [ ] 제품 매출 정보 테이블 생성
  - [ ] Supabase MCP로 `product_sales_metrics` 테이블 생성
  - [ ] 필수 컬럼 구성: kol_id, product_id, year_month, quantity, sales_amount 등
  - [ ] kol_id + product_id + year_month 유니크 제약조건 추가
  - [ ] 외래 키 제약조건 설정 (kol_id → kols.id, product_id → products.id)

## 2. 👨‍💼 새로운 관리자 UI 구현

- [ ] 새로운 관리자 경로 및 레이아웃 구성
  - [ ] `/admin-dashboard` 경로에 새 관리자 페이지 구성
  - [ ] 관리자 전용 레이아웃 컴포넌트 생성
  - [ ] 관리자 인증 및 권한 검증 로직 구현

- [ ] 관리자 대시보드 메인 페이지
  - [ ] `/admin-dashboard/main` 페이지 구현
  - [ ] 각 관리 섹션으로 이동하는 카드 UI 구성
  - [ ] 주요 통계 요약 대시보드 구현

- [ ] KOL 및 전문점 관리 페이지
  - [ ] `/admin-dashboard/entities` 페이지 구현
  - [ ] KOL 추가 모달 구현
  - [ ] 전문점 추가 모달 구현
  - [ ] 기존 데이터와 중복 확인 로직 구현

- [ ] KOL 월별 지표 관리 페이지
  - [ ] `/admin-dashboard/kol-metrics` 페이지 구현
  - [ ] Supabase 데이터 조회 및 입력 구현
  - [ ] 월 선택 캘린더 UI 구현
  - [ ] 과거 데이터 조회 및 수정 테이블 구현

- [ ] 전문점 매출 관리 페이지
  - [ ] `/admin-dashboard/shop-sales` 페이지 구현
  - [ ] 트리 구조로 KOL → 전문점 선택 UI 구현
  - [ ] 연월별 매출 데이터 입력 그리드 구현
  - [ ] 변경 사항 일괄 저장 기능 구현

- [ ] 제품 매출 비율 관리 페이지
  - [ ] `/admin-dashboard/product-sales` 페이지 구현
  - [ ] 제품 목록과 수량 입력 UI 구현
  - [ ] 실시간 비율 계산 및 시각화(차트) 구현
  - [ ] 수량 입력 시 자동 계산 로직 구현

## 3. 🚀 새로운 API 엔드포인트 구현

- [ ] KOL 및 전문점 관리 API
  - [ ] `/api/admin-dashboard/kols` - KOL 추가/조회 API
  - [ ] `/api/admin-dashboard/shops` - 전문점 추가/조회 API
  - [ ] Supabase Client를 사용한 데이터 처리 구현

- [ ] KOL 월별 지표 관리 API
  - [ ] `/api/admin-dashboard/kol-metrics` - 지표 CRUD API
  - [ ] 연도/월 필터링 기능 구현


- [ ] 전문점 매출 관리 API
  - [ ] `/api/admin-dashboard/shop-sales` - 매출 CRUD API
  - [ ] KOL ID 기준 전문점 필터링 기능 구현
  - [ ] 연도/월 필터링 기능 구현

- [ ] 제품 매출 비율 관리 API
  - [ ] `/api/admin-dashboard/product-sales` - 제품 매출 CRUD API
  - [ ] 제품 가격 조회 및 매출액 자동 계산 로직 구현
  - [ ] 비율 자동 계산 로직 구현 (KOL별 전체 매출 대비 제품별 비율)

## 4. 🔄 Supabase MCP 활용 및 데이터 연동


## 📋 개발 시 참고사항

- Supabase MCP 도구를 적극 활용하여 SQL 쿼리 및 마이그레이션을 실행하세요
- 프로젝트 ID `lgzzqoaiukuywmenxzay`를 사용하여 Supabase 리소스에 접근하세요
- 기존 API나 테이블을 수정하지 말고, 완전히 새로운 API와 테이블을 구현하세요
- 관리자 UI는 `/admin-dashboard/`로 시작하는 완전히 새로운 경로에 구현하세요
- 제품 매출 비율 계산 시, 제품 가격은 products 테이블에서 조회하여 자동 계산하세요
- 모든 데이터 입력 폼에서 연월 선택이 가능하도록 구현하여 과거 데이터도 관리할 수 있게 하세요
- 모든 API는 RESTful 원칙을 따르고, 표준 HTTP 상태 코드와 응답 형식을 사용하세요
- 권한 검증은 모든 관리자 API에 적용하고, 인증되지 않은 접근은 차단하세요

> 인수인계: 이 체크리스트는 KOL 대시보드 데이터 관리 시스템 구축을 위한 신규 개발 태스크를 정리한 것입니다. 기존 코드는 수정하지 않고 새로운 테이블과 API를 구축하여 별도의 관리자 UI에서 데이터를 관리합니다. Supabase MCP(프로젝트 ID: lgzzqoaiukuywmenxzay)를 적극 활용하여 테이블 생성 및 데이터 관리를 구현하세요. 모든 기능은 `/admin-dashboard/` 경로의 새로운 UI에서 제공되며, 기존 대시보드는 그대로 유지됩니다.
