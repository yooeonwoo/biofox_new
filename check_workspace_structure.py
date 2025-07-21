#!/usr/bin/env python3
"""
워크스페이스 테이블 구조 확인 스크립트
"""

import psycopg2

# Xano 데이터베이스 연결 정보
DB_CONFIG = {
    'host': '34.64.147.136',
    'database': 'xano-xcj1-wluk-xdjk-db',
    'user': 'full-33f4a67d',
    'password': '7fa048da53a894e14aac1ba4ce160601',
    'port': '5432'
}

def check_workspace_info():
    """워크스페이스 정보 확인"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Xano 워크스페이스 정보 확인")
        print("=" * 50)
        
        # 1. 워크스페이스 테이블 구조 확인
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'mvp_workspace' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print(f"📊 mvp_workspace 테이블 구조:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({col[2]})")
            
        # 2. 워크스페이스 데이터 확인
        cursor.execute("SELECT * FROM mvp_workspace LIMIT 3;")
        workspaces = cursor.fetchall()
        print(f"\n🏢 워크스페이스 데이터:")
        for ws in workspaces:
            print(f"  - {ws}")
            
        # 3. 데이터베이스 이름에서 인스턴스 이름 추출
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        
        # xano-xcj1-wluk-xdjk-db -> xcj1-wluk-xdjk
        instance_name = db_name.replace('xano-', '').replace('-db', '')
        
        print(f"\n🎯 **정확한 인스턴스 정보:**")
        print(f"   인스턴스 이름: {instance_name}")
        print(f"   인스턴스 URL: https://{instance_name}.k7.xano.io")
        print(f"   데이터베이스: {db_name}")
        print(f"   호스트: 34.64.147.136:5432")
        
        # 4. 우리가 만든 테이블 목록
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('orders', 'order_items', 'device_sales', 'kol_device_accumulator',
                              'crm_cards', 'self_growth_cards', 'clinical_cases', 'clinical_sessions')
            ORDER BY table_name;
        """)
        
        our_tables = cursor.fetchall()
        print(f"\n✅ 생성된 테이블 목록:")
        for table in our_tables:
            print(f"   - {table[0]}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    check_workspace_info() 