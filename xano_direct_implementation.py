#!/usr/bin/env python3
"""
BIOFOX KOL 시스템 - Xano 직접 구현 스크립트
PostgreSQL 직접 연결을 통해 Xano 데이터베이스에 테이블 생성 및 API 구조 구축
"""

import psycopg2
from psycopg2 import sql
import json
from datetime import datetime, timezone
import sys

# Xano 데이터베이스 연결 정보 (사용자 제공)
DB_CONFIG = {
    'host': '34.64.147.136',
    'database': 'xano-xcj1-wluk-xdjk-db',
    'user': 'full-33f4a67d',
    'password': '7fa048da53a894e14aac1ba4ce160601',
    'port': '5432'
}

class XanoBiofoxImplementer:
    def __init__(self):
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """Xano PostgreSQL 데이터베이스에 연결"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("✅ Xano 데이터베이스 연결 성공!")
            
            # 현재 연결 정보 확인
            self.cursor.execute("SELECT version();")
            version = self.cursor.fetchone()
            print(f"📊 PostgreSQL 버전: {version[0]}")
            
        except psycopg2.Error as e:
            print(f"❌ 데이터베이스 연결 실패: {e}")
            sys.exit(1)
    
    def close(self):
        """연결 종료"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("🔌 데이터베이스 연결 종료")
    
    def execute_sql(self, query, params=None, description=""):
        """SQL 쿼리 실행"""
        try:
            print(f"🔧 {description}")
            self.cursor.execute(query, params)
            self.conn.commit()
            print(f"✅ {description} 완료")
            return True
        except psycopg2.Error as e:
            print(f"❌ {description} 실패: {e}")
            self.conn.rollback()
            return False
    
    def create_orders_table(self):
        """주문 관리 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            shop_id INTEGER NOT NULL,
            order_date DATE NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            commission_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            is_self_shop_order BOOLEAN NOT NULL DEFAULT FALSE,
            created_by INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100),
            CONSTRAINT chk_commission_status CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled'))
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
        CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
        CREATE INDEX IF NOT EXISTS idx_orders_commission_status ON orders(commission_status);
        """
        
        return self.execute_sql(query, description="주문 테이블 생성")
    
    def create_order_items_table(self):
        """주문 상세 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_code VARCHAR(100),
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_quantity CHECK (quantity > 0),
            CONSTRAINT chk_unit_price CHECK (unit_price >= 0),
            CONSTRAINT chk_subtotal CHECK (subtotal >= 0)
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product_code ON order_items(product_code);
        """
        
        return self.execute_sql(query, description="주문 상세 테이블 생성")
    
    def create_device_sales_table(self):
        """기기 판매 추적 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS device_sales (
            id SERIAL PRIMARY KEY,
            kol_id INTEGER NOT NULL,
            device_model VARCHAR(100) NOT NULL,
            sale_date DATE NOT NULL,
            tier VARCHAR(20) NOT NULL DEFAULT 'tier_1_4',
            standard_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            actual_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            serial_numbers TEXT[], -- 시리얼 번호 배열
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_tier CHECK (tier IN ('tier_1_4', 'tier_5_plus')),
            CONSTRAINT chk_standard_commission CHECK (standard_commission >= 0),
            CONSTRAINT chk_actual_commission CHECK (actual_commission >= 0)
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_device_sales_kol_id ON device_sales(kol_id);
        CREATE INDEX IF NOT EXISTS idx_device_sales_date ON device_sales(sale_date);
        CREATE INDEX IF NOT EXISTS idx_device_sales_tier ON device_sales(tier);
        """
        
        return self.execute_sql(query, description="기기 판매 추적 테이블 생성")
    
    def create_kol_device_accumulator_table(self):
        """KOL 기기 누적 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS kol_device_accumulator (
            id SERIAL PRIMARY KEY,
            kol_id INTEGER NOT NULL UNIQUE,
            total_devices_sold INTEGER NOT NULL DEFAULT 0,
            total_devices_returned INTEGER NOT NULL DEFAULT 0,
            net_devices_sold INTEGER NOT NULL DEFAULT 0,
            current_tier VARCHAR(20) NOT NULL DEFAULT 'tier_1_4',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_total_devices_sold CHECK (total_devices_sold >= 0),
            CONSTRAINT chk_total_devices_returned CHECK (total_devices_returned >= 0),
            CONSTRAINT chk_net_devices_sold CHECK (net_devices_sold >= 0),
            CONSTRAINT chk_current_tier CHECK (current_tier IN ('tier_1_4', 'tier_5_plus'))
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_kol_device_accumulator_kol_id ON kol_device_accumulator(kol_id);
        CREATE INDEX IF NOT EXISTS idx_kol_device_accumulator_tier ON kol_device_accumulator(current_tier);
        """
        
        return self.execute_sql(query, description="KOL 기기 누적 테이블 생성")
    
    def create_crm_cards_table(self):
        """CRM 카드 시스템 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS crm_cards (
            id SERIAL PRIMARY KEY,
            kol_id INTEGER NOT NULL,
            shop_id INTEGER NOT NULL UNIQUE,
            
            -- 10단계 CRM 스테이지
            stage_1_status VARCHAR(20) DEFAULT 'pending',
            stage_1_completed_at TIMESTAMP WITH TIME ZONE,
            stage_2_status VARCHAR(20) DEFAULT 'pending',
            stage_2_completed_at TIMESTAMP WITH TIME ZONE,
            stage_3_status VARCHAR(20) DEFAULT 'pending',
            stage_3_completed_at TIMESTAMP WITH TIME ZONE,
            stage_4_status VARCHAR(20) DEFAULT 'pending',
            stage_4_completed_at TIMESTAMP WITH TIME ZONE,
            stage_5_status VARCHAR(20) DEFAULT 'pending',
            stage_5_completed_at TIMESTAMP WITH TIME ZONE,
            stage_6_status VARCHAR(20) DEFAULT 'pending',
            stage_6_completed_at TIMESTAMP WITH TIME ZONE,
            stage_7_status VARCHAR(20) DEFAULT 'pending',
            stage_7_completed_at TIMESTAMP WITH TIME ZONE,
            stage_8_status VARCHAR(20) DEFAULT 'pending',
            stage_8_completed_at TIMESTAMP WITH TIME ZONE,
            stage_9_status VARCHAR(20) DEFAULT 'pending',
            stage_9_completed_at TIMESTAMP WITH TIME ZONE,
            stage_10_status VARCHAR(20) DEFAULT 'pending',
            stage_10_completed_at TIMESTAMP WITH TIME ZONE,
            
            -- 설치 교육 관련
            installation_training_completed BOOLEAN DEFAULT FALSE,
            installation_training_date TIMESTAMP WITH TIME ZONE,
            
            -- 6개 질문 필드
            q1_answer TEXT,
            q2_answer TEXT,
            q3_answer TEXT,
            q4_answer TEXT,
            q5_answer TEXT,
            q6_answer TEXT,
            
            -- 태그 시스템
            tags TEXT[], -- 태그 배열
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_stage_status CHECK (
                stage_1_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_2_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_3_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_4_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_5_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_6_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_7_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_8_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_9_status IN ('pending', 'in_progress', 'completed', 'skipped') AND
                stage_10_status IN ('pending', 'in_progress', 'completed', 'skipped')
            )
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_crm_cards_kol_id ON crm_cards(kol_id);
        CREATE INDEX IF NOT EXISTS idx_crm_cards_shop_id ON crm_cards(shop_id);
        CREATE INDEX IF NOT EXISTS idx_crm_cards_tags ON crm_cards USING GIN(tags);
        """
        
        return self.execute_sql(query, description="CRM 카드 시스템 테이블 생성")
    
    def create_self_growth_cards_table(self):
        """셀프 성장 카드 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS self_growth_cards (
            id SERIAL PRIMARY KEY,
            shop_id INTEGER NOT NULL UNIQUE,
            crm_card_id INTEGER,
            
            -- 본사 교육 상태
            hq_training_status VARCHAR(20) NOT NULL DEFAULT 'not_started',
            hq_training_completed_at TIMESTAMP WITH TIME ZONE,
            
            -- 자가 평가 점수
            self_assessment_score INTEGER DEFAULT 0,
            self_assessment_date TIMESTAMP WITH TIME ZONE,
            
            -- 성장 계획
            growth_plan TEXT,
            growth_plan_created_at TIMESTAMP WITH TIME ZONE,
            
            -- 목표 설정
            monthly_goal INTEGER DEFAULT 0,
            quarterly_goal INTEGER DEFAULT 0,
            yearly_goal INTEGER DEFAULT 0,
            
            -- 달성률 추적
            current_month_achievement DECIMAL(5,2) DEFAULT 0.00,
            current_quarter_achievement DECIMAL(5,2) DEFAULT 0.00,
            current_year_achievement DECIMAL(5,2) DEFAULT 0.00,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_hq_training_status CHECK (hq_training_status IN ('not_started', 'in_progress', 'completed')),
            CONSTRAINT chk_self_assessment_score CHECK (self_assessment_score >= 0 AND self_assessment_score <= 100),
            CONSTRAINT chk_achievement_rate CHECK (
                current_month_achievement >= 0 AND current_month_achievement <= 200 AND
                current_quarter_achievement >= 0 AND current_quarter_achievement <= 200 AND
                current_year_achievement >= 0 AND current_year_achievement <= 200
            )
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_self_growth_cards_shop_id ON self_growth_cards(shop_id);
        CREATE INDEX IF NOT EXISTS idx_self_growth_cards_crm_card_id ON self_growth_cards(crm_card_id);
        CREATE INDEX IF NOT EXISTS idx_self_growth_cards_hq_training_status ON self_growth_cards(hq_training_status);
        """
        
        return self.execute_sql(query, description="셀프 성장 카드 테이블 생성")
    
    def create_clinical_cases_table(self):
        """임상 케이스 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS clinical_cases (
            id SERIAL PRIMARY KEY,
            kol_id INTEGER NOT NULL,
            shop_id INTEGER NOT NULL,
            
            -- 대상자 정보
            subject_type VARCHAR(20) NOT NULL DEFAULT 'customer',
            subject_name VARCHAR(100) NOT NULL,
            subject_age INTEGER,
            subject_gender VARCHAR(10),
            subject_phone VARCHAR(20),
            subject_email VARCHAR(100),
            
            -- 케이스 상태
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            consent_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            
            -- 일정 관리
            start_date DATE NOT NULL,
            end_date DATE,
            estimated_duration_weeks INTEGER DEFAULT 4,
            
            -- 임상 정보
            treatment_type VARCHAR(100),
            treatment_area VARCHAR(100),
            notes TEXT,
            
            -- 메타데이터
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_subject_type CHECK (subject_type IN ('customer', 'personal', 'model')),
            CONSTRAINT chk_case_status CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
            CONSTRAINT chk_consent_status CHECK (consent_status IN ('pending', 'approved', 'rejected')),
            CONSTRAINT chk_subject_age CHECK (subject_age > 0 AND subject_age < 120),
            CONSTRAINT chk_subject_gender CHECK (subject_gender IN ('male', 'female', 'other')),
            CONSTRAINT chk_duration CHECK (estimated_duration_weeks > 0 AND estimated_duration_weeks <= 52)
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_clinical_cases_kol_id ON clinical_cases(kol_id);
        CREATE INDEX IF NOT EXISTS idx_clinical_cases_shop_id ON clinical_cases(shop_id);
        CREATE INDEX IF NOT EXISTS idx_clinical_cases_status ON clinical_cases(status);
        CREATE INDEX IF NOT EXISTS idx_clinical_cases_start_date ON clinical_cases(start_date);
        """
        
        return self.execute_sql(query, description="임상 케이스 테이블 생성")
    
    def create_clinical_sessions_table(self):
        """임상 세션 테이블 생성"""
        query = """
        CREATE TABLE IF NOT EXISTS clinical_sessions (
            id SERIAL PRIMARY KEY,
            case_id INTEGER NOT NULL,
            session_number INTEGER NOT NULL,
            session_date DATE NOT NULL,
            
            -- 세션 정보
            session_type VARCHAR(50) DEFAULT 'treatment',
            duration_minutes INTEGER DEFAULT 60,
            
            -- 기록 정보
            notes TEXT,
            before_photos TEXT[], -- 시술 전 사진 URL 배열
            after_photos TEXT[], -- 시술 후 사진 URL 배열
            
            -- 평가 정보
            pain_level INTEGER DEFAULT 0,
            satisfaction_score INTEGER DEFAULT 0,
            side_effects TEXT,
            
            -- 다음 세션 정보
            next_session_date DATE,
            next_session_notes TEXT,
            
            -- 메타데이터
            session_metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT chk_session_number CHECK (session_number > 0),
            CONSTRAINT chk_session_type CHECK (session_type IN ('consultation', 'treatment', 'followup', 'final')),
            CONSTRAINT chk_duration_minutes CHECK (duration_minutes > 0 AND duration_minutes <= 480),
            CONSTRAINT chk_pain_level CHECK (pain_level >= 0 AND pain_level <= 10),
            CONSTRAINT chk_satisfaction_score CHECK (satisfaction_score >= 0 AND satisfaction_score <= 10),
            CONSTRAINT unique_case_session UNIQUE(case_id, session_number)
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_clinical_sessions_case_id ON clinical_sessions(case_id);
        CREATE INDEX IF NOT EXISTS idx_clinical_sessions_session_date ON clinical_sessions(session_date);
        CREATE INDEX IF NOT EXISTS idx_clinical_sessions_session_type ON clinical_sessions(session_type);
        """
        
        return self.execute_sql(query, description="임상 세션 테이블 생성")
    
    def create_update_triggers(self):
        """업데이트 트리거 생성"""
        query = """
        -- 업데이트 트리거 함수 생성
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- 각 테이블에 업데이트 트리거 적용
        DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
        CREATE TRIGGER update_orders_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_device_sales_updated_at ON device_sales;
        CREATE TRIGGER update_device_sales_updated_at
            BEFORE UPDATE ON device_sales
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_kol_device_accumulator_updated_at ON kol_device_accumulator;
        CREATE TRIGGER update_kol_device_accumulator_updated_at
            BEFORE UPDATE ON kol_device_accumulator
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_crm_cards_updated_at ON crm_cards;
        CREATE TRIGGER update_crm_cards_updated_at
            BEFORE UPDATE ON crm_cards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_self_growth_cards_updated_at ON self_growth_cards;
        CREATE TRIGGER update_self_growth_cards_updated_at
            BEFORE UPDATE ON self_growth_cards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_clinical_cases_updated_at ON clinical_cases;
        CREATE TRIGGER update_clinical_cases_updated_at
            BEFORE UPDATE ON clinical_cases
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_clinical_sessions_updated_at ON clinical_sessions;
        CREATE TRIGGER update_clinical_sessions_updated_at
            BEFORE UPDATE ON clinical_sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        
        return self.execute_sql(query, description="업데이트 트리거 생성")
    
    def create_sample_data(self):
        """샘플 데이터 생성"""
        queries = [
            # 샘플 주문 데이터
            """
            INSERT INTO orders (shop_id, order_date, total_amount, commission_rate, commission_amount, commission_status)
            VALUES 
                (1, '2024-01-15', 150000.00, 30.00, 45000.00, 'approved'),
                (2, '2024-01-16', 200000.00, 25.00, 50000.00, 'pending'),
                (3, '2024-01-17', 180000.00, 35.00, 63000.00, 'paid')
            ON CONFLICT DO NOTHING;
            """,
            
            # 샘플 기기 판매 데이터
            """
            INSERT INTO device_sales (kol_id, device_model, sale_date, tier, standard_commission, actual_commission, serial_numbers)
            VALUES 
                (1, 'BIOFOX-2024-PRO', '2024-01-15', 'tier_1_4', 500000.00, 500000.00, ARRAY['BF2024001', 'BF2024002']),
                (2, 'BIOFOX-2024-BASIC', '2024-01-16', 'tier_1_4', 300000.00, 300000.00, ARRAY['BF2024003']),
                (3, 'BIOFOX-2024-PRO', '2024-01-17', 'tier_5_plus', 500000.00, 600000.00, ARRAY['BF2024004', 'BF2024005', 'BF2024006'])
            ON CONFLICT DO NOTHING;
            """,
            
            # 샘플 CRM 카드 데이터
            """
            INSERT INTO crm_cards (kol_id, shop_id, stage_1_status, stage_1_completed_at, tags)
            VALUES 
                (1, 1, 'completed', '2024-01-10 10:00:00+00', ARRAY['premium', 'vip']),
                (2, 2, 'in_progress', NULL, ARRAY['standard']),
                (3, 3, 'completed', '2024-01-12 15:30:00+00', ARRAY['premium', 'referral'])
            ON CONFLICT (shop_id) DO NOTHING;
            """,
            
            # 샘플 임상 케이스 데이터
            """
            INSERT INTO clinical_cases (kol_id, shop_id, subject_type, subject_name, subject_age, subject_gender, start_date, treatment_type)
            VALUES 
                (1, 1, 'customer', '김○○', 35, 'female', '2024-01-15', '안티에이징 케어'),
                (2, 2, 'customer', '이○○', 28, 'female', '2024-01-16', '여드름 흉터 치료'),
                (3, 3, 'personal', '박○○', 42, 'male', '2024-01-17', '리프팅 케어')
            ON CONFLICT DO NOTHING;
            """
        ]
        
        for i, query in enumerate(queries, 1):
            self.execute_sql(query, description=f"샘플 데이터 생성 {i}/4")
    
    def verify_tables(self):
        """테이블 생성 확인"""
        query = """
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('orders', 'order_items', 'device_sales', 'kol_device_accumulator', 
                          'crm_cards', 'self_growth_cards', 'clinical_cases', 'clinical_sessions')
        ORDER BY table_name;
        """
        
        try:
            self.cursor.execute(query)
            tables = self.cursor.fetchall()
            
            print("\n📊 생성된 테이블 목록:")
            total_columns = 0
            for table_name, column_count in tables:
                print(f"   ✅ {table_name}: {column_count}개 컬럼")
                total_columns += column_count
            
            print(f"\n🎯 총 {len(tables)}개 테이블, {total_columns}개 컬럼 생성 완료!")
            return True
            
        except psycopg2.Error as e:
            print(f"❌ 테이블 확인 실패: {e}")
            return False
    
    def run_implementation(self):
        """전체 구현 실행"""
        print("🚀 BIOFOX KOL 시스템 Xano 구현 시작")
        print("=" * 50)
        
        # 1. 데이터베이스 연결
        self.connect()
        
        # 2. 테이블 생성
        tables_to_create = [
            ('orders', self.create_orders_table),
            ('order_items', self.create_order_items_table),
            ('device_sales', self.create_device_sales_table),
            ('kol_device_accumulator', self.create_kol_device_accumulator_table),
            ('crm_cards', self.create_crm_cards_table),
            ('self_growth_cards', self.create_self_growth_cards_table),
            ('clinical_cases', self.create_clinical_cases_table),
            ('clinical_sessions', self.create_clinical_sessions_table),
        ]
        
        success_count = 0
        for table_name, create_func in tables_to_create:
            if create_func():
                success_count += 1
        
        # 3. 트리거 생성
        if self.create_update_triggers():
            success_count += 1
        
        # 4. 샘플 데이터 생성
        self.create_sample_data()
        
        # 5. 테이블 확인
        self.verify_tables()
        
        print("\n" + "=" * 50)
        print(f"✅ BIOFOX KOL 시스템 구현 완료! ({success_count}/{len(tables_to_create)+1} 성공)")
        print("🎯 다음 단계: API 엔드포인트 구현")
        
        # 6. 연결 종료
        self.close()

def main():
    """메인 실행 함수"""
    try:
        implementer = XanoBiofoxImplementer()
        implementer.run_implementation()
    except KeyboardInterrupt:
        print("\n⚠️ 사용자에 의해 중단됨")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 