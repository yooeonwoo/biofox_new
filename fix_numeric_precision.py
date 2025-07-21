#!/usr/bin/env python3
"""
Numeric precision 문제 해결 스크립트
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

def fix_numeric_precision():
    """Numeric precision 문제 해결"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔧 Numeric precision 문제 해결 시작...")
        
        # commission_rate 필드 수정
        cursor.execute("""
            ALTER TABLE orders 
            ALTER COLUMN commission_rate TYPE numeric(10,4);
        """)
        
        print("✅ orders.commission_rate 수정 완료")
        
        # 테스트 데이터 삽입
        cursor.execute("""
            INSERT INTO orders (shop_id, order_date, total_amount, commission_rate, commission_amount, commission_status)
            VALUES (1, '2024-01-01', 100000, 30.0, 30000, 'calculated')
            RETURNING id;
        """)
        order_id = cursor.fetchone()[0]
        print(f"✅ 테스트 주문 생성 성공 (ID: {order_id})")
        
        # 테스트 데이터 삭제
        cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
        print("✅ 테스트 데이터 정리 완료")
        
        conn.commit()
        print("🎉 모든 문제 해결 완료!")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_numeric_precision() 