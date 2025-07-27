export const PERSONAL_CASE_NAME = '본인' as const;
export const PERSONAL_PREFIX = '[본인] ' as const;

// Case 상태 리터럴 타입
export type CaseStatus = 'active' | 'completed' | 'archived';

// 통합된 타입을 사용하여 중복 정의를 방지한다.
import type { ClinicalCase as BaseClinicalCase } from '@/types/clinical';

export type ClinicalCase = BaseClinicalCase;

// CaseCard 컴포넌트에서 사용할 공통 props 타입 정의
export interface CaseCardProps {
  /** personal | customer 구분 */
  type: 'personal' | 'customer';
  /** 렌더링할 케이스 데이터 */
  case: ClinicalCase;
  /** 고객 이름 수정 가능 여부 (본인 케이스는 false) */
  editableName?: boolean;
  /** 케이스 삭제 버튼 표시 여부 */
  showDelete?: boolean;
  /** 신규 케이스 뱃지 표시 여부 */
  showNewBadge?: boolean;
  /** 케이스 업데이트 콜백 */
  onUpdate: (caseId: string, updates: Partial<ClinicalCase>) => void;
  /** 케이스 삭제 콜백 */
  onDelete?: (caseId: string) => void;
}
