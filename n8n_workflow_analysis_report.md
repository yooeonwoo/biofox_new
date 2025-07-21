# n8n 워크플로우 분석 보고서: 파일업로드 copy

## 📋 워크플로우 개요

**워크플로우 ID**: GcFTCVHS6wUB8Uad  
**워크플로우 이름**: 파일업로드 copy  
**상태**: 비활성화 (Inactive)  
**생성일**: 2025-06-22  
**최종 수정일**: 2025-07-18  
**총 노드 수**: 25개  

## 🎯 워크플로우 목적

이 워크플로우는 **지식베이스 구축을 위한 파일 업로드 및 벡터 임베딩 시스템**입니다. 다양한 형식의 문서(PDF, Excel, Word, CSV, JSON, Text, HTML)를 업로드받아 텍스트를 추출하고, OpenAI 임베딩을 통해 벡터화한 후 Supabase Vector Store에 저장합니다.

## 🔄 워크플로우 흐름

### 1. **파일 수신 단계**
- **트리거**: Form Trigger (웹훅 ID: c406de83-b9f3-432b-aaae-c0bbbf793341)
- **폼 제목**: "폭스야 지식베이스 파일 업로드"
- **지원 파일 형식**: PDF, Excel(.xlsx, .xls), CSV, JSON, Text, HTML, Word(.docx)

### 2. **인증 및 검증 단계**
- **인증 검증**: 사용자 권한 확인 (public 모드, 업로드 권한 체크)
- **파일 검증**: 바이너리 데이터 존재 여부 확인

### 3. **파일 타입 분석 단계**
- **파일 분기**: MIME 타입과 파일 확장자를 기반으로 파일 타입 결정
- **Switch 노드 + If 노드들**: 파일 타입별로 적절한 처리 경로 분기

### 4. **콘텐츠 추출 단계**
각 파일 타입별 전용 추출기:
- **PDF**: Extract from File (PDF 모드)
- **Excel**: Extract from File (XLSX 모드)
- **Word**: Word 파일 설정 노드로 임시 처리
- **CSV**: Extract from File1
- **JSON**: Extract from File2 (fromJson 모드)
- **Text**: Extract from File3 (text 모드)
- **HTML**: Extract from File4 (html 모드)

### 5. **데이터 변환 및 저장 단계**
- **Code1**: 추출된 콘텐츠를 Vector Store용 형식으로 변환
  - Q&A 파일 특별 처리 기능 포함
  - 메타데이터 생성 (source, type, timestamp 등)
- **Supabase Vector Store**: OpenAI 임베딩을 사용하여 벡터화 후 저장
- **Code3 + Supabase Update**: 문서 메타데이터 업데이트

## 🛠️ 주요 구성 요소

### 노드 타입별 분류:
- **트리거 노드**: 1개 (Form Trigger)
- **검증/처리 노드**: 5개 (Code 노드들)
- **파일 추출 노드**: 7개 (Extract from File 계열)
- **조건 분기 노드**: 6개 (Switch 1개, If 5개)
- **AI/ML 노드**: 4개 (Vector Store, Embeddings, Data Loader, Text Splitter)
- **데이터베이스 노드**: 1개 (Supabase)
- **유틸리티 노드**: 1개 (Set)

### 사용된 외부 서비스:
- **OpenAI API**: 텍스트 임베딩 생성
- **Supabase**: 벡터 데이터베이스 및 메타데이터 저장

## ⚠️ 발견된 문제점

### 🚨 오류 (10개)
1. **필수 속성 누락**: 여러 Extract from File 노드에서 `binaryPropertyName` 미설정
2. **Word Extractor**: `destinationKey` 속성 누락
3. **Default Data Loader**: `dataType` 속성 누락
4. **전체 워크플로우 검증 오류**: "e.message.includes is not a function"

### ⚡ 경고 (11개)
1. **구버전 노드**: 5개의 If 노드가 구버전 사용 중 (v2 → v2.2 업그레이드 필요)
2. **표현식 경고**: 
   - Default Data Loader: 입력 데이터 없이 $json 사용
   - Supabase: $ 접두사 누락 가능성
3. **오류 처리 부재**: 대부분의 노드에 오류 처리 설정 없음
4. **긴 체인 구조**: 13개 노드의 선형 체인 (서브 워크플로우 분리 권장)

## 💪 강점

1. **포괄적인 파일 형식 지원**: 7가지 주요 문서 형식 처리 가능
2. **지능적인 Q&A 처리**: Q&A 문서를 자동으로 감지하고 개별 질문-답변으로 분리
3. **메타데이터 관리**: 파일 정보, 처리 상태, 타임스탬프 등 체계적 관리
4. **벡터 검색 지원**: OpenAI 임베딩을 통한 의미 기반 검색 가능

## 🔧 개선 권장사항

### 즉시 수정 필요:
1. **Extract from File 노드들의 binaryPropertyName 설정**
   - 각 노드에 `"파일 업로드"` 또는 적절한 바이너리 필드명 설정
2. **노드 버전 업데이트**: If 노드들을 최신 버전으로 업그레이드
3. **오류 처리 추가**: 각 노드에 onError 속성 설정

### 구조 개선:
1. **서브 워크플로우 분리**:
   - 파일 타입 감지 및 라우팅
   - 콘텐츠 추출 및 변환
   - 벡터 저장 및 메타데이터 업데이트
2. **병렬 처리**: Switch 대신 If 노드들의 병렬 실행으로 성능 향상
3. **재시도 로직**: 외부 API 호출 노드에 재시도 설정 추가

### 기능 개선:
1. **처리 결과 알림**: 성공/실패 시 사용자에게 상세 피드백 제공
2. **파일 크기 제한**: 대용량 파일 처리 시 청크 분할 고려
3. **중복 방지**: 동일 파일 재업로드 감지 및 처리

## 📊 성능 고려사항

- **순차 처리 구조**: 현재 모든 노드가 순차적으로 실행되어 처리 시간이 길어질 수 있음
- **메모리 사용**: 대용량 파일 처리 시 메모리 사용량 모니터링 필요
- **API 호출 최적화**: OpenAI 임베딩 호출 시 배치 처리 고려

## 🎯 결론

이 워크플로우는 다양한 문서 형식을 지원하는 강력한 지식베이스 구축 시스템입니다. 특히 Q&A 문서 처리와 벡터 검색 기능이 잘 구현되어 있습니다. 다만 발견된 설정 오류들을 수정하고, 오류 처리를 강화하며, 구조를 개선한다면 더욱 안정적이고 효율적인 시스템이 될 것입니다.

### 명령어 설명

*   `claude mcp add task-master-mcp`: `task-master-mcp`라는 이름으로 새로운 MCP(Managed Claude Process)를 추가합니다.
*   `-e MCP_MODE=stdio`: MCP 통신 모드를 표준 입출력(Standard I/O)으로 설정합니다. 이는 Claude Code와 Taskmaster 프로세스가 서로 통신하는 방식입니다.
*   `-e LOG_LEVEL=error`: 로그 레벨을 'error'로 설정하여 불필요한 로그 출력을 최소화합니다.
*   `-e DISABLE_CONSOLE_OUTPUT=true`: 콘솔 출력을 비활성화하여 깔끔한 통신을 유지합니다.
*   `-- npx task-master-mcp`: 실제로 실행할 명령어입니다. `npx`를 사용하여 로컬에 설치된 `task-master-mcp` 패키지를 실행합니다.

이 명령어를 실행하면 Claude Code 내에서 Taskmaster의 다양한 기능(`get_tasks`, `add_task`, `expand_task` 등)을 도구(tool) 형태로 사용하실 수 있게 됩니다.