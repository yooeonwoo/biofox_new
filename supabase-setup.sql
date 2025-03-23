-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "clerk_id" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "role" VARCHAR(50) NOT NULL DEFAULT 'kol',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- users 목업 데이터 삽입
INSERT INTO "users" ("clerk_id", "email", "role") VALUES
('user_2VLznGzxF1UPqFOqZZEL3uK1Vdi', 'admin@biofox.kr', 'admin'),
('user_2VRyzN9aMT2PTGrBm4L3wYsIFlj', 'kol1@biofox.kr', 'kol'),
('user_2VG3mQ5bnJu3XKqS8Z4cvYuPyT9', 'kol2@biofox.kr', 'kol');

-- 2. kols 테이블 생성
CREATE TABLE IF NOT EXISTS "kols" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "shop_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(100),
  "address" VARCHAR(500),
  "profile_image" VARCHAR(500),
  "description" TEXT,
  "bank_name" VARCHAR(100),
  "account_number" VARCHAR(100),
  "account_holder" VARCHAR(100),
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- kols 목업 데이터 삽입
INSERT INTO "kols" ("user_id", "name", "shop_name", "phone", "address", "profile_image", "description", "bank_name", "account_number", "account_holder", "status")
VALUES
(2, '김바이오', '바이오 뷰티살롱', '010-1234-5678', '서울시 강남구 역삼동 123-45', 'https://example.com/profiles/bio1.jpg', '10년차 뷰티 전문가입니다.', '국민은행', '123-45-6789', '김바이오', 'active'),
(3, '박케어', '케어 에스테틱', '010-9876-5432', '서울시 서초구 서초동 567-89', 'https://example.com/profiles/bio2.jpg', '피부 관리 전문가입니다.', '신한은행', '987-65-4321', '박케어', 'active'),
(2, '이포레스트', '포레스트 스킨케어', '010-5555-8888', '서울시 송파구 송파동 321-45', 'https://example.com/profiles/bio3.jpg', '자연주의 스킨케어 전문가입니다.', '우리은행', '555-88-8888', '이포레스트', 'active');

-- 3. shops 테이블 생성
CREATE TABLE IF NOT EXISTS "shops" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "owner_name" VARCHAR(255) NOT NULL,
  "kol_id" INTEGER REFERENCES "kols"("id") NOT NULL,
  "address" VARCHAR(500) NOT NULL,
  "phone" VARCHAR(100),
  "business_number" VARCHAR(100),
  "description" TEXT,
  "image" VARCHAR(500),
  "operating_hours" VARCHAR(255),
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- shops 목업 데이터 삽입
INSERT INTO "shops" ("name", "owner_name", "kol_id", "address", "phone", "business_number", "description", "image", "operating_hours", "status")
VALUES
('강남 바이오 뷰티살롱', '이강남', 1, '서울시 강남구 학동로 123', '02-555-1234', '123-45-67890', '강남 프리미엄 뷰티살롱입니다.', 'https://example.com/shops/shop1.jpg', '평일 10:00-20:00, 주말 11:00-18:00', 'active'),
('압구정 케어 에스테틱', '김압구정', 2, '서울시 강남구 압구정로 456', '02-555-5678', '456-78-90123', '압구정 프리미엄 에스테틱입니다.', 'https://example.com/shops/shop2.jpg', '평일 11:00-21:00, 주말 12:00-19:00', 'active'),
('청담 포레스트 스킨케어', '박청담', 3, '서울시 강남구 청담동 789', '02-555-9012', '789-01-23456', '청담 자연주의 스킨케어입니다.', 'https://example.com/shops/shop3.jpg', '평일 10:30-20:30, 주말 11:30-19:30', 'active');

-- 4. products 테이블 생성
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "price" INTEGER NOT NULL,
  "is_device" BOOLEAN DEFAULT FALSE NOT NULL,
  "description" TEXT,
  "image" VARCHAR(500),
  "category" VARCHAR(100),
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- products 목업 데이터 삽입
INSERT INTO "products" ("name", "price", "is_device", "description", "image", "category", "status")
VALUES
('바이오 페이셜 기기', 1200000, TRUE, '프리미엄 페이셜 케어 디바이스입니다.', 'https://example.com/products/device1.jpg', '기기', 'active'),
('포레스트 클렌징 폼', 35000, FALSE, '자연주의 클렌징 폼입니다.', 'https://example.com/products/cleanser1.jpg', '클렌저', 'active'),
('케어 앰플 세트', 150000, FALSE, '고농축 앰플 세트입니다.', 'https://example.com/products/ampoule1.jpg', '앰플', 'active');

-- 5. orders 테이블 생성
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "order_number" VARCHAR(255) NOT NULL UNIQUE,
  "shop_id" INTEGER REFERENCES "shops"("id") NOT NULL,
  "total_amount" INTEGER NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "order_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "payment_method" VARCHAR(100),
  "payment_status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- orders 목업 데이터 삽입
INSERT INTO "orders" ("order_number", "shop_id", "total_amount", "status", "payment_method", "payment_status")
VALUES
('ORD-2023-0001', 1, 1200000, 'completed', '카드', 'paid'),
('ORD-2023-0002', 2, 350000, 'completed', '계좌이체', 'paid'),
('ORD-2023-0003', 3, 1385000, 'pending', '카드', 'pending');

-- 6. orderItems 테이블 생성
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER REFERENCES "orders"("id") NOT NULL,
  "product_id" INTEGER REFERENCES "products"("id") NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- orderItems 목업 데이터 삽입
INSERT INTO "order_items" ("order_id", "product_id", "quantity", "price")
VALUES
(1, 1, 1, 1200000),
(2, 2, 10, 35000),
(3, 1, 1, 1200000),
(3, 3, 1, 150000),
(3, 2, 1, 35000);

-- 7. commissions 테이블 생성
CREATE TABLE IF NOT EXISTS "commissions" (
  "id" SERIAL PRIMARY KEY,
  "kol_id" INTEGER REFERENCES "kols"("id") NOT NULL,
  "order_id" INTEGER REFERENCES "orders"("id") NOT NULL,
  "amount" INTEGER NOT NULL,
  "settled" BOOLEAN DEFAULT FALSE NOT NULL,
  "settled_date" TIMESTAMP WITH TIME ZONE,
  "settled_note" VARCHAR(500),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- commissions 목업 데이터 삽입
INSERT INTO "commissions" ("kol_id", "order_id", "amount", "settled", "settled_date", "settled_note")
VALUES
(1, 1, 120000, TRUE, NOW() - INTERVAL '5 days', '5월 수당 정산 완료'),
(2, 2, 35000, TRUE, NOW() - INTERVAL '3 days', '5월 수당 정산 완료'),
(3, 3, 138500, FALSE, NULL, NULL);

-- 9. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" VARCHAR(1000) NOT NULL,
  "read" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- notifications 목업 데이터 삽입
INSERT INTO "notifications" ("user_id", "title", "content", "read")
VALUES
(1, '새로운 시스템 업데이트 안내', '바이오폭스 KOL 시스템이 업데이트되었습니다. 자세한 내용은 공지사항을 확인해주세요.', FALSE),
(2, '새로운 주문이 접수되었습니다', '강남 바이오 뷰티살롱에서 새로운 주문이 접수되었습니다. 주문번호: ORD-2023-0001', TRUE),
(3, '정산 완료 안내', '5월 수당 정산이 완료되었습니다. 계좌를 확인해주세요.', FALSE); 