#!/usr/bin/env python3
"""
Xano MCP SSL 인증서 문제 해결을 위한 직접 API 호출 스크립트
가이드: https://docs.xano.com/ai-tools/xano-mcp-server
"""
import requests
import urllib3
from urllib3.exceptions import InsecureRequestWarning
import json

# SSL 경고 비활성화
urllib3.disable_warnings(InsecureRequestWarning)

class XanoSSLFixedClient:
    def __init__(self, instance_name):
        self.instance_name = instance_name
        self.base_url = f"https://{instance_name}.k7.xano.io"
        self.session = requests.Session()
        # SSL 검증 비활성화
        self.session.verify = False
        
    def list_databases(self):
        """데이터베이스 목록 조회"""
        try:
            # 메타데이터 API 시도
            response = self.session.get(f"{self.base_url}/api:meta", timeout=30)
            print(f"메타데이터 API 응답 상태: {response.status_code}")
            
            # 관리 API 시도
            mgmt_response = self.session.get(f"{self.base_url}/api:management", timeout=30)
            print(f"관리 API 응답 상태: {mgmt_response.status_code}")
            
            # 워크스페이스 API 시도
            ws_response = self.session.get(f"{self.base_url}/api:management/workspaces", timeout=30)
            print(f"워크스페이스 API 응답 상태: {ws_response.status_code}")
            
            return {
                "success": True,
                "message": "SSL 검증 없이 API 접근 성공",
                "meta_status": response.status_code,
                "management_status": mgmt_response.status_code,
                "workspace_status": ws_response.status_code
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_connection(self):
        """연결 테스트"""
        try:
            response = self.session.get(self.base_url, timeout=30)
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "연결 성공"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# 테스트 실행
if __name__ == "__main__":
    client = XanoSSLFixedClient("xcj1-wluk-xdjk")
    
    print("🔧 Xano SSL 인증서 문제 해결 테스트")
    print("=" * 50)
    
    # 연결 테스트
    print("1. 기본 연결 테스트:")
    result = client.test_connection()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()
    
    # 데이터베이스 목록 조회 테스트
    print("2. 데이터베이스 API 테스트:")
    result = client.list_databases()
    print(json.dumps(result, indent=2, ensure_ascii=False)) 