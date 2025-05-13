#!/bin/bash

# Gemini API 키 설정 (여기에 실제 키를 넣어야 합니다)
export GEMINI_API_KEY="API_KEY_NEEDED_HERE"

# DeepView MCP 실행 (로컬 Python 3.13 사용)
/opt/homebrew/bin/python3.13 -m deepview_mcp.main /Users/yoo/currentbiofox/biofox-kol/repomix-output.xml --log-level DEBUG

# 참고: 실제 사용할 때는 위 스크립트를 실행하지 말고 Cursor의 MCP 설정을 통해 실행하세요 