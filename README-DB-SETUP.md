# Supabase 데이터베이스 설정 가이드

이 문서는 바이오폭스 KOL 프로젝트를 위한 Supabase 데이터베이스 설정 방법을 안내합니다.

## 테이블 생성 및 목업 데이터 삽입

1. Supabase 대시보드에 로그인합니다.
2. 왼쪽 메뉴에서 `SQL 편집기`를 클릭합니다.
3. `supabase-setup.sql` 파일의 내용을 복사하여 SQL 편집기에 붙여넣습니다.
4. `Run` 버튼을 클릭하여 SQL 스크립트를 실행합니다.

## 테이블 생성 순서

테이블들은 종속성을 고려하여 다음 순서로 생성됩니다:

1. users - 사용자 정보
2. kols - KOL(Key Opinion Leader) 정보
3. shops - 전문점 정보
4. products - 제품 정보
5. orders - 주문 정보
6. orderItems - 주문 상세 항목
7. commissions - 수당 정보
8. notifications - 알림 정보

## 목업 데이터

각 테이블에는 3개의 샘플 레코드가 삽입됩니다. 이 데이터는 개발 및 테스트를 위한 것으로, 실제 운영 환경에서는 사용하지 않는 것이 좋습니다.

### 계정 정보
- 관리자: admin@biofox.kr
- KOL: kol1@biofox.kr, kol2@biofox.kr

## 수동 실행 방법

만약 전체 스크립트 실행에 문제가 있다면, 각 테이블 생성 및 데이터 삽입 명령을 개별적으로 실행할 수 있습니다. `supabase-setup.sql` 파일에서 테이블별로 구분된 명령을 복사하여 순서대로 실행하세요.

## 데이터베이스 구조 확인

모든 테이블이 성공적으로 생성되었는지 확인하려면, Supabase 대시보드의 `테이블 에디터`에서 다음 테이블들이 존재하는지 확인하세요:

- users
- kols
- shops
- products
- orders
- order_items
- commissions
- notifications

## 테이블 관계

테이블 간 관계는 외래 키(Foreign Key)를 통해 정의됩니다. 주요 관계는 다음과 같습니다:

- kols → users (kols.user_id → users.id)
- shops → kols (shops.kol_id → kols.id)
- orders → shops (orders.shop_id → shops.id)
- orderItems → orders (orderItems.order_id → orders.id)
- orderItems → products (orderItems.product_id → products.id)
- commissions → kols (commissions.kol_id → kols.id)
- commissions → orders (commissions.order_id → orders.id)
- notifications → users (notifications.user_id → users.id)

이 관계를 이해하는 것은 데이터 모델링 및 쿼리 작성에 중요합니다. 