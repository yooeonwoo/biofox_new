#!/usr/bin/env python3
import os
import sys
import json
import subprocess
from pathlib import Path

# 현재 실행 중인 DeepView MCP 프로세스 종료
os.system("pkill -f 'deepview-mcp' || true")

# 환경 변수 설정
os.environ["GEMINI_API_KEY"] = "AIzaSyD-nn5AeN97VQW-oqRW8pI0SRe1ozROdYw"

# MCP 요청 생성
mcp_request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call_tool",
    "params": {
        "name": "deepview",
        "arguments": {
            "question": "이 프로젝트의 구조와 주요 기능을 간략히 설명해주세요.",
            "codebase_file": "/Users/yoo/currentbiofox/biofox-kol/repomix-output.xml"
        }
    }
}

# 요청 직렬화
request_json = json.dumps(mcp_request)

try:
    # DeepView MCP 서버 실행
    process = subprocess.Popen(
        ["/opt/homebrew/bin/deepview-mcp", "/Users/yoo/currentbiofox/biofox-kol/repomix-output.xml", "--model", "gemini-2.5-pro"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=os.environ
    )
    
    print("서버에 요청 전송 중...")
    # JSON-RPC 요청 전송
    process.stdin.write(request_json + "\n")
    process.stdin.flush()
    
    # 응답 읽기
    response_line = process.stdout.readline()
    print("서버 응답 수신:")
    print(response_line)
    
    # 기타 출력도 확인
    for line in process.stdout:
        print(line.strip())
        
except Exception as e:
    print(f"오류 발생: {str(e)}")
finally:
    # 프로세스 종료
    try:
        process.terminate()
        print("서버 종료됨")
    except:
        pass