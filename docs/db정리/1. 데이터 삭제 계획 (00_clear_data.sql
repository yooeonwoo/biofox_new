-- 외래키 제약조건 일시 해제
SET session_replication_role = 'replica';

-- 데이터 삭제 (참조 무결성을 고려한 순서)
TRUNCATE public.product_total_sales_stats CASCADE;
TRUNCATE public.product_sales_ratios CASCADE;
TRUNCATE public.admin_dashboard_stats CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.commissions CASCADE;
TRUNCATE public.order_items CASCADE;
TRUNCATE public.orders CASCADE;
TRUNCATE public.kol_total_monthly_sales CASCADE;
TRUNCATE public.monthly_sales CASCADE;
TRUNCATE public.kol_monthly_summary CASCADE;
TRUNCATE public.kol_hierarchy CASCADE;
TRUNCATE public.admin_kol_access CASCADE;
TRUNCATE public.shops CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.kols CASCADE;
TRUNCATE public.users CASCADE;

-- 외래키 제약조건 복원
SET session_replication_role = 'origin';