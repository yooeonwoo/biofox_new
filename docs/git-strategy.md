# Git 브랜치 전략

## 개요

BIOFOX KOL 프로젝트의 Git 브랜치 전략은 기능 개발, 버그 수정, 문서화 등 다양한 작업을 체계적으로 관리하기 위한 가이드라인입니다. 이 문서는 브랜치 생성, 코드 리뷰, 머지, 릴리스 등의 프로세스를 설명합니다.

## 브랜치 명명 규칙

모든 브랜치는 다음 형식을 따라야 합니다:

```
<type>/<description>
```

여기서:
- `<type>`: 브랜치 유형 (아래 참조)
- `<description>`: 작업 내용을 간결하게 설명하는 소문자 영문, 숫자, 하이픈으로 구성

### 브랜치 유형

- `feature`: 새로운 기능 개발
- `bugfix`: 버그 수정
- `hotfix`: 긴급 버그 수정 (프로덕션)
- `docs`: 문서 작업
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 작성
- `chore`: 기타 유지보수 작업

예시:
- `feature/kol-specialty-store-relation`
- `bugfix/login-validation-error`
- `docs/api-documentation`

## 기본 브랜치

- `main`: 프로덕션 코드, 항상 배포 가능한 상태 유지
- `develop`: 개발 중인 코드, 다음 릴리스를 위한 통합 브랜치

## 브랜치 워크플로우

### 기능 개발 (Feature)

1. `develop` 브랜치에서 `feature/feature-name` 브랜치 생성
2. 기능 개발 진행
3. 개발 완료 후 `develop` 브랜치로 Pull Request 생성
4. 코드 리뷰 진행
5. 승인 후 `develop` 브랜치로 머지

```bash
# 브랜치 생성
git checkout develop
git pull
git checkout -b feature/kol-specialty-store-relation

# 개발 및 커밋
git add .
git commit -m "feat: 전문점-KOL 관계 기능 구현"

# 푸시
git push -u origin feature/kol-specialty-store-relation

# 이후 PR 생성 (GitHub 또는 GitLab UI에서)
```

### 버그 수정 (Bugfix)

1. `develop` 브랜치에서 `bugfix/bug-description` 브랜치 생성
2. 버그 수정 진행
3. 수정 완료 후 `develop` 브랜치로 Pull Request 생성
4. 코드 리뷰 진행
5. 승인 후 `develop` 브랜치로 머지

### 긴급 버그 수정 (Hotfix)

1. `main` 브랜치에서 `hotfix/urgent-bug-description` 브랜치 생성
2. 버그 수정 진행
3. 수정 완료 후 `main` 브랜치와 `develop` 브랜치 모두에 Pull Request 생성
4. 코드 리뷰 진행
5. 승인 후 양쪽 브랜치로 머지

### 문서 작업 (Docs)

1. 적절한 베이스 브랜치에서 `docs/documentation-description` 브랜치 생성
2. 문서 작업 진행
3. 작업 완료 후 베이스 브랜치로 Pull Request 생성
4. 리뷰 진행
5. 승인 후 베이스 브랜치로 머지

## 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따라야 합니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `<type>`: commit 유형 (feat, fix, docs, style, refactor, test, chore)
- `<scope>`: commit 영향 범위 (선택 사항)
- `<subject>`: commit 간단 설명
- `<body>`: 상세 설명 (선택 사항)
- `<footer>`: 이슈 참조 등 (선택 사항)

예시:
```
feat(store): KOL-전문점 관계 기능 구현

- 전문점에 KOL 소속 정보 추가
- KOL별 전문점 필터링 및 그룹화 기능 구현
- 전문점 추가/수정 시 KOL 선택 필드 추가

Closes #123
```

## 코드 리뷰 프로세스

1. Pull Request 생성 시 명확한 제목과 설명 작성
2. 최소 1명 이상의 리뷰어 지정
3. CI/CD 파이프라인 통과 확인
4. 리뷰어의 코멘트에 대응 및 수정
5. 최종 승인 후 머지 진행

## 릴리스 프로세스

1. `develop` 브랜치에서 `release/vX.Y.Z` 브랜치 생성
2. 릴리스 준비 (버전 업데이트, 문서 정리 등)
3. 테스트 진행
4. 문제가 없으면 `main` 브랜치로 머지
5. `main` 브랜치에 태그 생성 (vX.Y.Z)
6. `main`에서 `develop`으로 변경사항 백포트

## 버전 관리 (Semantic Versioning)

프로젝트는 Semantic Versioning (X.Y.Z) 규칙을 따릅니다:

- X: 주 버전 (Major) - 호환성 없는 API 변경
- Y: 부 버전 (Minor) - 이전 버전과 호환되는 기능 추가
- Z: 수 버전 (Patch) - 이전 버전과 호환되는 버그 수정

## 참고

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/) 