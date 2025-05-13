import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path

# XML 파일 경로
INPUT_XML = '/Users/yoo/currentbiofox/biofox-kol/repomix-output.xml'
OUTPUT_DIR = '/Users/yoo/currentbiofox/biofox-kol/split_codebase'

# 출력 디렉토리 생성
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"XML 파일 로드 중: {INPUT_XML}")

# XML을 텍스트로 직접 처리 (XML 파서는 큰 파일에서 메모리 문제 발생 가능)
with open(INPUT_XML, 'r', encoding='utf-8') as f:
    content = f.read()

print("XML 로드 완료, 파일 분석 중...")

# 파일 항목 추출을 위한 정규식 패턴
# 단순화된 패턴, 실제 구현에서는 더 견고한 파싱 필요
pattern = r'<file path="([^"]+)"[^>]*>(.*?)<\/file>'
files = re.findall(pattern, content, re.DOTALL)

print(f"총 {len(files)}개 파일 항목 찾음")

# 디렉토리별로 그룹화
dir_groups = {}
for file_path, file_content in files:
    # 디렉토리 추출 (예: app/layout.tsx -> app)
    parts = file_path.split('/')
    if len(parts) > 1:
        dir_name = parts[0]
    else:
        dir_name = '_root'
    
    if dir_name not in dir_groups:
        dir_groups[dir_name] = []
    
    dir_groups[dir_name].append((file_path, file_content))

print(f"파일을 {len(dir_groups)}개 디렉토리 그룹으로 나눔")

# 각 디렉토리 그룹에 대해 XML 파일 생성
for dir_name, files in dir_groups.items():
    if not files:
        continue
    
    output_path = os.path.join(OUTPUT_DIR, f"{dir_name}.xml")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<code>\n')
        for file_path, file_content in files:
            f.write(f'  <file path="{file_path}">{file_content}</file>\n')
        f.write('</code>')
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"생성: {output_path} ({file_size:.2f} MB, {len(files)}개 파일)")

print("\n분할 완료!")
print(f"분할된 XML 파일은 {OUTPUT_DIR} 디렉토리에 저장되었습니다.")
print("각 XML 파일은 특정 디렉토리의 코드만 포함합니다.")
print("DeepView MCP 사용 시 --codebase 옵션으로 필요한 파일만 로드하세요.") 