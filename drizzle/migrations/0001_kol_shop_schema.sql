-- KOL 테이블 수정
ALTER TABLE IF EXISTS "kols"
ADD COLUMN IF NOT EXISTS "address" varchar(500),
ADD COLUMN IF NOT EXISTS "profile_image" varchar(500),
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "bank_name" varchar(100),
ADD COLUMN IF NOT EXISTS "account_number" varchar(100),
ADD COLUMN IF NOT EXISTS "account_holder" varchar(100),
ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'active';

-- 전문점 테이블 수정
ALTER TABLE IF EXISTS "shops"
ADD COLUMN IF NOT EXISTS "address" varchar(500) NOT NULL,
ADD COLUMN IF NOT EXISTS "phone" varchar(100),
ADD COLUMN IF NOT EXISTS "business_number" varchar(100),
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "image" varchar(500),
ADD COLUMN IF NOT EXISTS "operating_hours" varchar(255),
ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'active';

-- 제품 테이블 수정
ALTER TABLE IF EXISTS "products"
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "image" varchar(500),
ADD COLUMN IF NOT EXISTS "category" varchar(100),
ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'active';

-- 주문 테이블 수정
ALTER TABLE IF EXISTS "orders"
ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "payment_method" varchar(100),
ADD COLUMN IF NOT EXISTS "payment_status" varchar(50) NOT NULL DEFAULT 'pending'; 