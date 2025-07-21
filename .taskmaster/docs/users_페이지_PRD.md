# 사용자 관리 페이지 - 미구현 기능 PRD

## 1. 프로젝트 개요

BIOFOX KOL 시스템의 사용자 관리 페이지(`/biofox-admin/users`)에서 현재 UI는 완전히 구현되어 있지만, 일부 백엔드 API와 기능들이 미구현 상태입니다. 이 PRD는 누락된 기능들의 완성을 목표로 합니다.

### 기술 스택
- **백엔드**: Supabase (PostgreSQL, RPC functions)
- **프론트엔드**: Next.js 14, React, TypeScript
- **API**: Next.js API Routes

## 2. 미구현 기능 목록

### 2.1 사용자 상세 정보 API
**위치**: `/api/users/[userId]/route.ts`

#### 현재 상태
- `UserDetailModal`에서 호출하지만 API가 존재하지 않음
- 사용자 상세 정보, 관계 이력, 활동 내역, 통계 데이터 필요

#### 구현 요구사항
```typescript
// GET /api/users/[userId]
// 응답 데이터 구조:
{
  data: {
    ...기본사용자정보,
    relationship_history: [
      {
        id: string,
        parent_id: string,
        parent_name: string,
        parent_role: string,
        started_at: string,
        ended_at?: string,
        is_active: boolean
      }
    ],
    recent_activity: {
      orders: [
        { id: string, order_date: string, total_amount: number, commission_amount: number }
      ],
      clinical_cases: [
        { id: string, name: string, status: string, created_at: string }
      ]
    },
    crm_stats: {
      total_cards: number,
      total_stages: number,
      completed_stages: number,
      completion_rate: number
    },
    sales_stats: {
      total_sales: number,
      total_commission: number
    }
  }
}
```

### 2.2 사용자 수정 API
**위치**: `/api/users/[userId]/route.ts` (PUT 메서드)

#### 현재 상태  
- 사용자 수정 기능이 "준비 중" 상태로 표시됨
- PUT 메서드 미구현

#### 구현 요구사항
```typescript
// PUT /api/users/[userId]
// 요청 데이터:
{
  name?: string,
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner',
  status?: 'pending' | 'approved' | 'rejected',
  shop_name?: string,
  region?: string,
  commission_rate?: number
}
```

### 2.3 사용자 삭제 API
**위치**: `/api/users/[userId]/route.ts` (DELETE 메서드)

#### 현재 상태
- 프론트엔드에서 호출하지만 API 미구현

#### 구현 요구사항
- 사용자 데이터 완전 삭제 (cascade)
- 관련 데이터 정리 (orders, clinical_cases 등)

### 2.4 일괄 작업 API
**위치**: `/api/users/bulk-action/route.ts`

#### 현재 상태
- 프론트엔드에서 호출하지만 API 미구현
- 일괄 승인, 거절, 역할 변경, 삭제 기능 필요

#### 구현 요구사항
```typescript
// POST /api/users/bulk-action
// 요청 데이터:
{
  user_ids: string[],
  action: 'approve' | 'reject' | 'change_role' | 'delete',
  data?: { role?: string }
}

// 응답:
{
  affected: number,
  results: {
    successful: string[],
    failed: Array<{ id: string, error: string }>
  }
}
```

### 2.5 엑셀 내보내기 API
**위치**: `/api/users/export/route.ts`

#### 현재 상태
- 프론트엔드에서 호출하지만 API 미구현

#### 구현 요구사항
- CSV 파일 생성 및 다운로드
- 현재 적용된 필터 조건 반영
- 한글 인코딩 처리 (UTF-8 BOM)

### 2.6 사용자 추가 모달
**위치**: 새로운 컴포넌트 `components/biofox-admin/users/UserAddModal.tsx`

#### 현재 상태
- "사용자 추가" 버튼은 있지만 기능 미구현

#### 구현 요구사항
- 사용자 추가 폼 모달
- 이메일 중복 확인
- 역할별 필수 필드 검증
- Supabase Auth 초대 이메일 발송 연동

## 3. 데이터베이스 요구사항

### 3.1 필요한 RPC 함수들

```sql
-- 사용자 상세 정보 조회
CREATE OR REPLACE FUNCTION get_user_detailed_info(user_id UUID)
RETURNS JSON AS $$
-- 사용자, 관계 이력, 통계 정보를 한 번에 조회

-- 일괄 사용자 상태 변경
CREATE OR REPLACE FUNCTION bulk_update_users(
  user_ids UUID[],
  action_type TEXT,
  action_data JSONB
)
RETURNS JSON AS $$
-- 여러 사용자 일괄 처리
```

### 3.2 인덱스 최적화
```sql
-- 검색 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(to_tsvector('korean', name || ' ' || email || ' ' || shop_name));

-- 관계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_shop_relationships_active 
ON shop_relationships(child_id) WHERE is_active = true;
```

## 4. 보안 요구사항

### 4.1 권한 검증
- 모든 API에서 관리자 권한 확인
- 사용자별 접근 가능한 데이터 범위 제한

### 4.2 데이터 검증
- 입력 데이터 sanitization
- SQL injection 방지
- XSS 방지

## 5. 성능 요구사항

### 5.1 응답 시간
- 사용자 목록 조회: 2초 이내
- 상세 정보 조회: 1초 이내
- 일괄 작업: 작업 수에 따라 스케일링

### 5.2 동시성 처리
- 일괄 작업 시 트랜잭션 처리
- 동시 수정 시 충돌 방지

## 6. 구현 우선순위

### 높음 (즉시 필요)
1. 사용자 상세 정보 API 구현
2. 사용자 수정 API 구현  
3. 사용자 삭제 API 구현

### 중간 (주요 기능)
4. 일괄 작업 API 구현
5. 사용자 추가 모달 구현

### 낮음 (편의 기능)
6. 엑셀 내보내기 API 구현

## 7. 테스트 요구사항

### 7.1 단위 테스트
- 각 API 엔드포인트별 테스트
- 권한 검증 테스트
- 데이터 검증 테스트

### 7.2 통합 테스트
- 전체 워크플로우 테스트
- 일괄 작업 시나리오 테스트

## 8. 완료 기준

### 8.1 기능적 기준
- 모든 "준비 중" 메시지 제거
- 사용자 CRUD 작업 완전 동작
- 일괄 작업 정상 처리
- 엑셀 다운로드 기능 동작

### 8.2 비기능적 기준
- API 응답 시간 요구사항 충족
- 오류 처리 및 사용자 피드백 완성
- 보안 검증 통과

이 PRD를 통해 사용자 관리 페이지의 모든 기능을 완전히 동작하도록 구현할 수 있습니다. 