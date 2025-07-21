#!/usr/bin/env python3
"""
실제 Xano 인스턴스와 워크스페이스 정보 확인 스크립트
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

def check_xano_instance_info():
    """Xano 인스턴스 정보 확인"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Xano 인스턴스 정보 확인")
        print("=" * 50)
        
        # 1. 데이터베이스 이름 확인
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        print(f"📊 데이터베이스 이름: {db_name}")
        
        # 2. 호스트 정보 확인
        cursor.execute("SELECT inet_server_addr();")
        host_info = cursor.fetchone()[0]
        print(f"🌐 호스트 IP: {host_info}")
        
        # 3. 현재 사용자 확인
        cursor.execute("SELECT current_user;")
        current_user = cursor.fetchone()[0]
        print(f"👤 현재 사용자: {current_user}")
        
        # 4. Xano 관련 테이블 확인
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'mvp_%'
            ORDER BY table_name
            LIMIT 10;
        """)
        
        mvp_tables = cursor.fetchall()
        print(f"\n🔧 Xano 시스템 테이블 (mvp_*):")
        for table in mvp_tables:
            print(f"  - {table[0]}")
            
        # 5. 워크스페이스 정보 확인 (mvp_workspace 테이블에서)
        cursor.execute("""
            SELECT id, name, created_at 
            FROM mvp_workspace 
            ORDER BY created_at DESC 
            LIMIT 5;
        """)
        
        workspaces = cursor.fetchall()
        print(f"\n🏢 워크스페이스 목록:")
        for ws in workspaces:
            print(f"  - ID: {ws[0]}, 이름: {ws[1]}, 생성일: {ws[2]}")
        
        # 6. 인스턴스 이름 추출 (데이터베이스 이름에서)
        instance_name = db_name.replace('xano-', '').replace('-db', '')
        print(f"\n🎯 추정 인스턴스 이름: {instance_name}")
        print(f"🌐 추정 인스턴스 URL: https://{instance_name}.k7.xano.io")
        
        # 7. 우리가 만든 테이블 확인
        cursor.execute("""
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_name IN ('orders', 'order_items', 'device_sales', 'kol_device_accumulator',
                              'crm_cards', 'self_growth_cards', 'clinical_cases', 'clinical_sessions')
            ORDER BY table_name;
        """)
        
        our_tables = cursor.fetchall()
        print(f"\n✅ 우리가 생성한 테이블:")
        for table in our_tables:
            print(f"  - {table[0]}: {table[1]}개 컬럼")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    check_xano_instance_info() 