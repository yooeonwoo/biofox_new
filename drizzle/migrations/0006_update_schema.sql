-- 테이블 구조 최신화를 위한 마이그레이션

-- KOL 테이블 업데이트
ALTER TABLE IF EXISTS "kols" 
  DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "profile_image",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "bank_name",
  DROP COLUMN IF EXISTS "account_number",
  DROP COLUMN IF EXISTS "account_holder",
  ADD COLUMN IF NOT EXISTS "region" varchar(100),
  ADD COLUMN IF NOT EXISTS "smart_place_link" varchar(500);

-- SHOPS 테이블 업데이트
ALTER TABLE IF EXISTS "shops"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "business_number",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "image",
  DROP COLUMN IF EXISTS "operating_hours",
  ADD COLUMN IF NOT EXISTS "shop_name" varchar(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS "region" varchar(100),
  ADD COLUMN IF NOT EXISTS "smart_place_link" varchar(500),
  ADD COLUMN IF NOT EXISTS "is_owner_kol" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "contract_date" timestamp,
  ADD COLUMN IF NOT EXISTS "email" varchar(255);

-- ORDERS, ORDER_ITEMS, COMMISSIONS 테이블 제거
DROP TABLE IF EXISTS "order_items";
DROP TABLE IF EXISTS "commissions";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "whitelisted_emails";

-- SALES_ACTIVITIES 테이블 생성
CREATE TABLE IF NOT EXISTS "sales_activities" (
  "id" serial PRIMARY KEY NOT NULL,
  "kol_id" integer NOT NULL,
  "shop_id" integer,
  "activity_date" date DEFAULT CURRENT_DATE NOT NULL,
  "content" text NOT NULL,
  "activity_type" varchar(50) DEFAULT 'general',
  "shop_name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  FOREIGN KEY ("kol_id") REFERENCES "kols"("id"),
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id")
);

-- KOL_DASHBOARD_METRICS 테이블 생성
CREATE TABLE IF NOT EXISTS "kol_dashboard_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "kol_id" integer NOT NULL,
  "year_month" varchar(7) NOT NULL,
  "monthly_sales" integer DEFAULT 0 NOT NULL,
  "monthly_commission" integer DEFAULT 0 NOT NULL,
  "active_shops_count" integer DEFAULT 0 NOT NULL,
  "total_shops_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  FOREIGN KEY ("kol_id") REFERENCES "kols"("id")
);

-- SHOP_SALES_METRICS 테이블 생성
CREATE TABLE IF NOT EXISTS "shop_sales_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "shop_id" integer NOT NULL,
  "year_month" varchar(7) NOT NULL,
  "total_sales" integer DEFAULT 0 NOT NULL,
  "product_sales" integer DEFAULT 0 NOT NULL,
  "device_sales" integer DEFAULT 0 NOT NULL,
  "commission" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id")
);

-- PRODUCT_SALES_METRICS 테이블 생성
CREATE TABLE IF NOT EXISTS "product_sales_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "kol_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "shop_id" integer,
  "year_month" varchar(7) NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "sales_amount" integer DEFAULT 0 NOT NULL,
  "sales_ratio" numeric DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  FOREIGN KEY ("kol_id") REFERENCES "kols"("id"),
  FOREIGN KEY ("product_id") REFERENCES "products"("id"),
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id")
);

-- KOL_TOTAL_MONTHLY_SALES 테이블 생성
CREATE TABLE IF NOT EXISTS "kol_total_monthly_sales" (
  "id" serial PRIMARY KEY NOT NULL,
  "kol_id" integer NOT NULL,
  "year_month" varchar(7) NOT NULL,
  "total_sales" integer DEFAULT 0 NOT NULL,
  "product_sales" integer DEFAULT 0 NOT NULL,
  "device_sales" integer DEFAULT 0 NOT NULL,
  "total_commission" integer DEFAULT 0 NOT NULL,
  "total_active_shops" integer DEFAULT 0 NOT NULL,
  "total_shops" integer DEFAULT 0 NOT NULL,
  "direct_sales_ratio" numeric DEFAULT 0 NOT NULL,
  "indirect_sales_ratio" numeric DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("kol_id") REFERENCES "kols"("id")
);

-- PRODUCT_TOTAL_SALES_STATS 테이블 생성
CREATE TABLE IF NOT EXISTS "product_total_sales_stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "year_month" varchar(7) NOT NULL,
  "product_id" integer NOT NULL,
  "total_sales_amount" integer DEFAULT 0 NOT NULL,
  "sales_ratio" numeric DEFAULT 0 NOT NULL,
  "sales_growth_rate" numeric DEFAULT 0 NOT NULL,
  "order_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
);

-- 사용자 테이블 업데이트
ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "name" varchar(255); 