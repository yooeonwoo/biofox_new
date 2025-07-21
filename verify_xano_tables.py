#!/usr/bin/env python3
"""
Xano 데이터베이스 테이블 존재 여부 철저 검증 스크립트
"""

import psycopg2
import sys
from tabulate import tabulate

# Xano 데이터베이스 연결 정보
DB_CONFIG = {
    'host': '34.64.147.136',
    'database': 'xano-xcj1-wluk-xdjk-db',
    'user': 'full-33f4a67d',
    'password': '7fa048da53a894e14aac1ba4ce160601',
    'port': '5432'
}

def test_connection():
    """데이터베이스 연결 테스트"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 연결 정보 확인
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ 데이터베이스 연결 성공!")
        print(f"📊 PostgreSQL 버전: {version[0]}")
        
        return conn, cursor
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return None, None

def check_tables_exist(cursor):
    """테이블 존재 여부 확인"""
    print("\n🔍 테이블 존재 여부 확인:")
    
    # 모든 테이블 목록 조회
    cursor.execute("""
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    
    all_tables = cursor.fetchall()
    
    if not all_tables:
        print("❌ 테이블이 하나도 없습니다!")
        return False
    
    print(f"📋 총 {len(all_tables)}개의 테이블/뷰 발견:")
    
    # 예상 테이블 목록
    expected_tables = [
        'orders', 'order_items', 'device_sales', 'kol_device_accumulator',
        'crm_cards', 'self_growth_cards', 'clinical_cases', 'clinical_sessions'
    ]
    
    table_data = []
    found_tables = []
    
    for table_name, table_type in all_tables:
        status = "✅ 예상됨" if table_name in expected_tables else "❓ 기타"
        table_data.append([table_name, table_type, status])
        found_tables.append(table_name)
    
    print(tabulate(table_data, headers=['테이블명', '유형', '상태'], tablefmt='grid'))
    
    # 예상 테이블 누락 확인
    missing_tables = [t for t in expected_tables if t not in found_tables]
    if missing_tables:
        print(f"\n❌ 누락된 테이블: {missing_tables}")
        return False
    else:
        print(f"\n✅ 모든 예상 테이블이 존재합니다!")
        return True

def check_table_structure(cursor):
    """테이블 구조 상세 확인"""
    print("\n🔍 테이블 구조 확인:")
    
    expected_tables = [
        'orders', 'order_items', 'device_sales', 'kol_device_accumulator',
        'crm_cards', 'self_growth_cards', 'clinical_cases', 'clinical_sessions'
    ]
    
    for table_name in expected_tables:
        try:
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            
            if not columns:
                print(f"❌ {table_name}: 테이블이 존재하지 않습니다!")
                continue
                
            print(f"\n📊 {table_name} 테이블 ({len(columns)}개 컬럼):")
            
            col_data = []
            for col_name, data_type, is_nullable, default in columns:
                nullable = "YES" if is_nullable == "YES" else "NO"
                default_val = default if default else "-"
                col_data.append([col_name, data_type, nullable, default_val])
            
            print(tabulate(col_data, headers=['컬럼명', '데이터타입', 'NULL허용', '기본값'], tablefmt='grid'))
            
        except Exception as e:
            print(f"❌ {table_name} 구조 확인 실패: {e}")

def test_data_operations(cursor):
    """데이터 조작 테스트"""
    print("\n🔍 데이터 조작 테스트:")
    
    try:
        # 1. 테스트 데이터 삽입
        cursor.execute("""
            INSERT INTO orders (shop_id, order_date, total_amount, commission_rate, commission_amount, commission_status)
            VALUES (1, '2024-01-01', 100000, 30.0, 30000, 'calculated')
            RETURNING id;
        """)
        order_id = cursor.fetchone()[0]
        print(f"✅ 테스트 주문 생성 성공 (ID: {order_id})")
        
        # 2. 데이터 조회
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        print(f"✅ 데이터 조회 성공: {order}")
        
        # 3. 데이터 업데이트
        cursor.execute("""
            UPDATE orders 
            SET commission_status = 'approved' 
            WHERE id = %s
        """, (order_id,))
        print(f"✅ 데이터 업데이트 성공")
        
        # 4. 데이터 삭제
        cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
        print(f"✅ 데이터 삭제 성공")
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터 조작 테스트 실패: {e}")
        return False

def main():
    """메인 실행 함수"""
    print("🚀 Xano 데이터베이스 철저 검증 시작")
    print("=" * 50)
    
    # 1. 연결 테스트
    conn, cursor = test_connection()
    if not conn:
        return
    
    try:
        # 2. 테이블 존재 확인
        tables_exist = check_tables_exist(cursor)
        
        if not tables_exist:
            print("\n❌ 테이블이 제대로 생성되지 않았습니다!")
            return
        
        # 3. 테이블 구조 확인
        check_table_structure(cursor)
        
        # 4. 데이터 조작 테스트
        data_test = test_data_operations(cursor)
        
        # 5. 최종 결과
        print("\n" + "=" * 50)
        if tables_exist and data_test:
            print("🎉 모든 테스트 통과! Xano 데이터베이스가 완전히 작동합니다!")
        else:
            print("❌ 일부 테스트 실패. 추가 확인이 필요합니다.")
            
    finally:
        # 연결 종료
        cursor.close()
        conn.close()
        print("🔌 데이터베이스 연결 종료")

if __name__ == "__main__":
    main() 