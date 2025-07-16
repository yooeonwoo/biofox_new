# Xano 데이터베이스 구조 설정

## 1. Supabase 연결 설정

### External Database Connection
1. Xano 대시보드에서 **Database** → **External Connections** 클릭
2. **Add Connection** 클릭
3. 다음 정보 입력:
   ```
   Connection Name: Supabase_BIOFOX
   Type: PostgreSQL
   Host: db.cezxkgmzlkbjqataogtd.supabase.co
   Port: 5432
   Database: postgres
   Username: postgres
   Password: [Supabase 대시보드에서 확인]
   SSL Mode: Required
   ```

## 2. Xano 테이블 구조

### 2.1 CRM Cards (crm_cards)
```sql
-- CRM 카드 테이블
CREATE TABLE crm_cards (
  id                    INTEGER PRIMARY KEY,
  kol_id                TEXT NOT NULL,        -- Supabase profiles.id 참조
  shop_id               TEXT NOT NULL,        -- Supabase profiles.id 참조
  
  -- CRM 단계 (10단계)
  stage_1_status        BOOLEAN DEFAULT false,
  stage_1_completed_at  TIMESTAMP,
  stage_2_status        BOOLEAN DEFAULT false,
  stage_2_completed_at  TIMESTAMP,
  stage_3_status        BOOLEAN DEFAULT false,
  stage_3_completed_at  TIMESTAMP,
  stage_4_status        BOOLEAN DEFAULT false,
  stage_4_completed_at  TIMESTAMP,
  stage_5_status        BOOLEAN DEFAULT false,
  stage_5_completed_at  TIMESTAMP,
  stage_6_status        BOOLEAN DEFAULT false,
  stage_6_completed_at  TIMESTAMP,
  stage_7_status        BOOLEAN DEFAULT false,
  stage_7_completed_at  TIMESTAMP,
  stage_8_status        BOOLEAN DEFAULT false,
  stage_8_completed_at  TIMESTAMP,
  stage_9_status        BOOLEAN DEFAULT false,
  stage_9_completed_at  TIMESTAMP,
  stage_10_status       BOOLEAN DEFAULT false,
  stage_10_completed_at TIMESTAMP,
  
  -- 설치교육 정보
  installation_date     DATE,
  installation_manager  TEXT,
  installation_contact  TEXT,
  
  -- 특이사항 질문
  q1_cleobios           TEXT CHECK (q1_cleobios IN ('Y', 'N')),
  q2_instasure          TEXT CHECK (q2_inst