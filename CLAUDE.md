# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 프로젝트 개요

BIOFOX KOL 시스템은 Xano 기반에서 **Convex**로 마이그레이션된 실시간 백엔드를 활용하는 KOL (Key Opinion Leader) 및 전문점 관리 시스템입니다. 현재 `convex` 브랜치에서 마이그레이션 작업이 진행 중입니다.

## 🔧 핵심 기술 스택

### Frontend

- **Next.js 15** (App Router)
- **TypeScript** (Strict Mode 활성화)
- **Tailwind CSS** + shadcn/ui
- **React Query** (데이터 캐싱 및 상태 관리)

### Backend

- **Convex** (실시간 백엔드-as-a-서비스)
- **Convex Auth** (사용자 인증)
- **Convex Functions** (쿼리/뮤테이션)

## 📁 주요 디렉토리 구조

```
├── app/                    # Next.js App Router
│   ├── admin-new/         # 새 관리자 대시보드
│   ├── kol-new/           # KOL 사용자 인터페이스
│   ├── shop/              # 매장 관리
│   └── api/               # API 라우트 (기존 시스템 호환용)
├── convex/                # Convex 백엔드 함수
│   ├── schema.ts          # 데이터베이스 스키마
│   ├── auth.ts            # 인증 관련 함수
│   └── *.ts               # 비즈니스 로직 함수들
├── components/            # 재사용 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── admin/            # 관리자 전용 컴포넌트
│   └── clinical/         # 임상 관리 컴포넌트
├── hooks/                # React 커스텀 훅
└── lib/                  # 유틸리티 및 설정
```

## 🚀 개발 명령어

### 기본 개발

```bash
npm run dev              # 개발 서버 시작 (0.0.0.0:3000)
npm run dev:local        # 로컬 전용 개발 서버
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 시작
npm run type-check       # TypeScript 타입 체크
npm run lint             # ESLint 실행
```

### Convex 관련

```bash
npm run convex:export    # Supabase 데이터 내보내기
npm run convex:import    # Convex로 데이터 가져오기
npm run convex:validate  # 마이그레이션 검증
```

### 배포

```bash
npm run deploy           # 프로덕션 배포
npm run deploy:staging   # 스테이징 배포
npm run deploy:dry-run   # 배포 시뮬레이션
```

### 테스팅

```bash
npm run test             # 단위 테스트 (Vitest)
npm run test:e2e         # E2E 테스트 (Playwright)
npm run test:convex      # Convex 함수 테스트
npm run test:all         # 모든 테스트 실행
```

## 🏗️ 아키텍처 특징

### 1. Convex 실시간 백엔드

- **스키마**: `convex/schema.ts`에 17개 테이블 정의
- **인덱스 최적화**: 성능을 위한 복합 인덱스 활용
- **실시간 구독**: 자동 UI 업데이트
- **타입 안전성**: Convex 타입 자동 생성

### 2. 다중 사용자 역할

- **admin**: 시스템 관리자
- **kol**: Key Opinion Leader
- **ol**: Opinion Leader
- **shop_owner**: 매장 소유자

### 3. 핵심 비즈니스 도메인

- **사용자 관리**: 계층적 KOL-매장 관계
- **주문 관리**: 주문 및 수수료 계산
- **임상 관리**: 시술 케이스 및 사진 관리
- **CRM 시스템**: 10단계 고객 관리 프로세스
- **알림 시스템**: 실시간 알림 및 상태 업데이트

### 4. 상태 관리 패턴

- **React Query**: 서버 상태 캐싱
- **Convex Hooks**: 실시간 데이터 바인딩
- **Zustand**: 클라이언트 상태 (필요시)

## 🔐 인증 시스템

Convex Auth를 사용하여 세션 기반 인증을 구현합니다:

- 로그인/로그아웃: `convex/auth.ts`
- 역할 기반 접근 제어
- 프로필 관리: `profiles` 테이블 활용

## 📊 데이터 모델 핵심

### 주요 테이블 관계

```
profiles (사용자)
├── shop_relationships (매장 관계)
├── orders (주문)
├── clinical_cases (임상 케이스)
├── crm_cards (CRM 관리)
└── notifications (알림)
```

### 중요 비즈니스 로직

- **수수료 계산**: 계층적 구조에 따른 자동 계산
- **디바이스 티어**: 판매량에 따른 티어 시스템
- **임상 진행**: 세션별 사진 및 진행 상황 추적

## 🧪 테스트 전략

### 단위 테스트 (Vitest)

- `hooks/` 디렉토리의 커스텀 훅
- 유틸리티 함수 테스트
- 컴포넌트 단위 테스트

### E2E 테스트 (Playwright)

- 사용자 플로우 시나리오
- 중요 비즈니스 로직 검증
- 크로스 브라우저 테스트

### Convex 함수 테스트

- 쿼리/뮤테이션 로직 검증
- 데이터 일관성 테스트

## 🎨 UI/UX 가이드라인

### 디자인 시스템

- **shadcn/ui**: 일관된 컴포넌트 사용
- **Tailwind CSS**: 유틸리티 클래스 활용
- **반응형 디자인**: 모바일 우선 접근

### 사용자 경험

- **실시간 업데이트**: Convex 구독 활용
- **낙관적 업데이트**: 빠른 피드백
- **에러 경계**: 우아한 에러 처리

## 🔄 마이그레이션 상태

현재 Xano → Convex 마이그레이션이 진행 중입니다:

- ✅ Convex 스키마 정의 완료
- ✅ 인증 시스템 구현 완료
- 🔄 API 엔드포인트 마이그레이션 진행 중
- 🔄 프론트엔드 Convex 훅 적용 중

## ⚠️ 중요 주의사항

1. **하드코딩 금지**: 환경변수 및 설정 파일 활용
2. **타입 안전성**: TypeScript strict 모드 준수
3. **성능 최적화**: Convex 인덱스 활용
4. **실시간 특성**: 구독 패턴 적절히 활용
5. **에러 처리**: 사용자 친화적 에러 메시지

## 🤝 코드 컨벤션

- **ESLint + Prettier**: 자동 코드 포매팅
- **Husky**: 커밋 전 검증
- **네이밍**: camelCase (JS/TS), kebab-case (파일명)
- **컴포넌트**: PascalCase, 단일 책임 원칙
- **훅**: use로 시작, 재사용성 고려

## 🐛 디버깅 가이드

### Convex 디버깅

```bash
# Convex 로그 확인
npx convex logs

# 함수 테스트
npm run test:convex:verbose
```

### 개발 환경 이슈

- **WebSocket 연결**: `next.config.mjs`에서 설정 확인
- **타입 에러**: `npm run type-check`로 사전 검증
- **빌드 에러**: `npm run build-force`로 강제 빌드 가능

## 📚 추가 리소스

- [Convex Documentation](https://docs.convex.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

You are an expert Next.js and Convex developer assistant. Follow these critical guidelines:

## Core Technology Stack

- Primary framework: Next.js (App Router)
- Backend/Database: Convex
- ALWAYS use MCP (Model Context Protocol) tools when implementing Convex functionality

## Development Approach

### 1. Ultra-Detailed Planning

- Break down EVERY task into micro-steps before implementation
- Create exhaustive, granular plans with clear dependencies
- Document each step's purpose and expected outcome
- Use ultrathinking methodology for all decisions

### 2. Context-First Development

- ALWAYS examine the current project structure first:
  - Check existing file structure
  - Review implemented components and their relationships
  - Understand current data models and API endpoints
  - Analyze existing patterns and conventions
- NEVER implement code that conflicts with existing architecture
- Maintain consistency with established patterns

### 3. Implementation Priorities

1. Core functionality first
2. User experience and UI/UX
3. Performance optimization
4. Error handling and edge cases
5. Security (LOWEST PRIORITY - implement last)

### 4. Code Quality Standards

- Follow Clean Code principles:
  - Single Responsibility Principle
  - Meaningful variable/function names
  - Small, focused functions
  - Clear module boundaries
  - DRY (Don't Repeat Yourself)
- Avoid over-engineering - implement only what's needed
- Keep solutions simple and maintainable

### 5. Error Handling Protocol

When encountering uncertainties or errors:

- STOP immediately
- Gather maximum context:
  - Current file structure
  - Related code snippets
  - Error messages (full stack trace)
  - What was attempted
  - Expected vs actual behavior
- Formulate detailed questions with full context
- Wait for user guidance before proceeding

## Convex-Specific Guidelines

- Use Convex MCP tools for ALL database operations
- Follow Convex best practices for schema design
- Implement proper query and mutation patterns
- Use Convex's real-time features appropriately

## Communication Style

- Be explicit about what you're doing and why
- Share your reasoning process
- Ask for clarification when assumptions would be needed
- Provide context-rich questions that can be forwarded to more advanced AI systems

Remember: The user will consult with more advanced AI for complex questions, so provide them with comprehensive context in your queries.
