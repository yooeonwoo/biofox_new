# Xano 테이블 설정 가이드

## 📊 생성할 테이블 목록

### 1. orders (주문)
```
테이블명: orders
설명: 모든 주문 데이터 관리

필드:
- id (integer, auto-increment, PK)
- shop_id (text, required) - Supabase profiles.id 참조
- order_date (date, required)
- order_number (text)
- total_amount (decimal, required)
- commission_rate (decimal)
- commission_amount (decimal)
- commission_status (text) - 'calculated', 'adjusted', 'paid', 'cancelled'
- order_status (text) - 'pending', 'completed', 'cancelled', 'refunded'
- is_self_shop_order (boolean, default: false)
- notes (text)
- metadata (json)
- created_at (timestamp, default: now)
- updated_at (timestamp, default: now)
- created_by (text) - Supabase profiles.id 참조
```

### 2. order_items (주문 상세)
```
테이블명: order_items
설명: 주문의 상세 아이템

필드:
- id (integer, auto-increment, PK)
- order_id (integer, required) - orders.id 참조
- product_id (text) - Supabase products.id 참조
- product_name (text, required)
- product_code (text)
- quantity (integer, required)
- unit_price (decimal, required)
- subtotal (decimal, required)
- item_commission_rate (decimal)
- item_commission_amount (decimal)
- created_at (timestamp, default: now)
```

### 3. device_sales (기기 판매)
```
테이블명: device_sales
설명: 마이크로젯 기기 판매 관리

필드:
- id (integer, auto-increment, PK)
- shop_id (text, required) - Supabase profiles.id 참조
- sale_date (date, required)
- device_name (text, default: '마이크로젯')
- quantity (integer, required)
- tier_at_sale (text, required) - 'tier_1_4', 'tier_5_plus'
- standard_commission (decimal, required)
- actual_commission (decimal, required)
- commission_status (text, default: 'calculated')
- notes (text)
- serial_numbers (text array)
- created_at (timestamp, default: now)
- updated_at (timestamp, default: now)
- created_by (text, required) - Supabase profiles.id 참조
```

### 4. kol_device_accumulator (KOL 기기 누적)
```
테이블명: kol_device_accumulator
설명: KOL별 기기 판매 누적 관리

필드:
- id (integer, auto-increment, PK)
- kol_id (text, unique, required) - Supabase profiles.id 참조
- total_devices_sold (integer, default: 0)
- total_devices_returned (integer, default: 0)
- net_devices_sold (integer, computed) - total_sold - total_returned
- current_tier (text, default: 'tier_1_4')
- tier_1_4_count (integer, default: 0)
- tier_5_plus_count (integer, default: 0)
- tier_changed_at (timestamp)
- last_updated (timestamp, default: now)
- created_at (timestamp, default: now)
```

### 5. crm_cards (CRM 카드)
```
테이블명: crm_cards
설명: KOL의 전문점 관리 카드

필드:
- id (integer, auto-increment, PK)
- kol_id (text, required) - Supabase profiles.id 참조
- shop_id (text, required) - Supabase profiles.id 참조
- stage_1_status (boolean, default: false)
- stage_1_completed_at (timestamp)
- stage_2_status (boolean, default: false)
- stage_2_completed_at (timestamp)
... (stage 3-10 동일 패턴)
- installation_date (date)
- installation_manager (text)
- installation_contact (text)
- q1_cleobios (text) - 'Y' or 'N'
- q2_instasure (text) - 'Y' or 'N'
- q3_proper_procedure (text) - 'Y' or 'N'
- q4_progress_check (text) - 'Y' or 'N'
- q5_feedback_need (text) - '상', '중', '하'
- q6_management (text) - '상', '중', '하'
- priority_level (text, default: 'normal')
- notes (text)
- tags (text array)
- total_clinical_cases (integer, default: 0)
- active_clinical_cases (integer, default: 0)
- last_activity_at (timestamp)
- created_at (timestamp, default: now)
- updated_at (timestamp, default: now)
- created_by (text) - Supabase profiles.id 참조

제약조건:
- UNIQUE(kol_id, shop_id)
```

### 6. self_growth_cards (셀프성장 카드)
```
테이블명: self_growth_cards
설명: 전문점의 셀프 관리 카드

필드:
- id (integer, auto-increment, PK)
- shop_id (text, unique, required) - Supabase profiles.id 참조
- crm_card_id (integer) - crm_cards.id 참조
- installation_date (date)
- installation