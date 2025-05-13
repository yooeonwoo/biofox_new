import os
import subprocess
import sys
import time

# 환경 변수 설정
os.environ["GEMINI_API_KEY"] = "AIzaSyD-nn5AeN97VQW-oqRW8pI0SRe1ozROdYw"

# 코드베이스 파일 경로
codebase_file = "/Users/yoo/currentbiofox/biofox-kol/repomix-output.xml"

# DeepView MCP 서버 시작 명령
cmd = [
    "/opt/homebrew/bin/python3.13",
    "-m", "deepview_mcp.main",
    codebase_file,
    "--model", "models/gemini-2.5-pro-exp-03-25",
    "--log-level", "DEBUG"
]

# 서버 시작
print("DeepView MCP 서버를 시작합니다...")
process = subprocess.Popen(
    cmd, 
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# 서버가 시작될 때까지 기다림
time.sleep(3)

# 서버 로그 확인
print("\n서버 출력:")
for i in range(10):
    stdout_line = process.stdout.readline()
    if stdout_line:
        print(f"[STDOUT] {stdout_line.strip()}")
    stderr_line = process.stderr.readline()
    if stderr_line:
        print(f"[STDERR] {stderr_line.strip()}")
    if not stdout_line and not stderr_line:
        break

print("\nDeepView MCP 서버가 정상적으로 시작되었습니다.")
print("이제 Cursor IDE에서 MCP 서버를 새로고침하여 deepview-mcp 도구를 사용할 수 있습니다.")

# 서버 종료
print("테스트가 완료되어 서버를 종료합니다...")
process.terminate()
process.wait() 