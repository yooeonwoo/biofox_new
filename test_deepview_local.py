import os
import sys
from pathlib import Path

# 현재 경로 출력
current_dir = os.getcwd()
print(f"현재 작업 디렉토리: {current_dir}")

# repomix-output.xml 파일 확인
repomix_file = Path(current_dir) / "repomix-output.xml"
if repomix_file.exists():
    print(f"코드베이스 파일이 존재합니다: {repomix_file}")
    print(f"파일 크기: {repomix_file.stat().st_size / (1024 * 1024):.2f} MB")
else:
    print(f"코드베이스 파일이 존재하지 않습니다: {repomix_file}")

# Gemini API 키 확인
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key:
    print("Gemini API 키가 환경 변수에 설정되어 있습니다.")
    # 키의 일부만 출력 (보안)
    masked_key = gemini_api_key[:4] + "*" * (len(gemini_api_key) - 8) + gemini_api_key[-4:]
    print(f"API 키 (마스킹됨): {masked_key}")
else:
    print("Gemini API 키가 환경 변수에 설정되어 있지 않습니다.")

try:
    # DeepView MCP 모듈 임포트 시도
    import deepview_mcp
    print(f"DeepView MCP 버전: {deepview_mcp.__version__}")
    print("DeepView MCP가 정상적으로 설치되어 있습니다.")
except ImportError as e:
    print(f"DeepView MCP를 임포트할 수 없습니다: {e}")
    sys.exit(1)

print("\nDeepView MCP 설정이 완료되었습니다.")
print("실제 쿼리를 수행하려면 Cursor IDE에서 MCP 서버 설정을 확인하세요.") 