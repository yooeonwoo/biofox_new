/**
 * Case Management 훅 - Convex 기반 실제 구현
 * 기존 더미 데이터 버전을 Convex 훅으로 완전 교체
 */

import { useMemo } from 'react';
import {
  useClinicalCases,
  useEnsurePersonalCase,
  useCustomerCases,
  type ClinicalCase,
} from '@/lib/clinical-photos-convex';

/**
 * 케이스 데이터를 Convex에서 실시간으로 관리하는 훅
 * @param type 'personal' | 'customer'
 */
export const useCaseManagement = (type: 'personal' | 'customer') => {
  // Convex 훅들 사용
  const {
    data: allCases = [],
    isLoading: allCasesLoading,
    refetch: refetchAll,
  } = useClinicalCases();
  const {
    personalCase,
    isLoading: personalLoading,
    ensurePersonalCaseExists,
  } = useEnsurePersonalCase();
  const {
    data: customerCases = [],
    isLoading: customerLoading,
    refetch: refetchCustomers,
  } = useCustomerCases();

  const result = useMemo(() => {
    if (type === 'personal') {
      // 개인 케이스 (배열 형태로 반환)
      const personalCases = personalCase ? [personalCase] : [];

      return {
        cases: personalCases,
        loading: personalLoading,
        refresh: async () => {
          await refetchAll();
        },
        setCases: (newCases: ClinicalCase[] | ((prev: ClinicalCase[]) => ClinicalCase[])) => {
          // 실제 데이터는 Convex에서 관리되므로 이 함수는 더 이상 필요하지 않음
          console.warn('setCases는 더 이상 사용되지 않습니다. Convex 뮤테이션을 사용하세요.');
        },
        // 개인 케이스 자동 생성 편의 함수
        ensurePersonalCase: ensurePersonalCaseExists,
      };
    } else {
      // 고객 케이스들
      return {
        cases: customerCases,
        loading: customerLoading,
        refresh: async () => {
          await refetchCustomers();
        },
        setCases: (newCases: ClinicalCase[] | ((prev: ClinicalCase[]) => ClinicalCase[])) => {
          // 실제 데이터는 Convex에서 관리되므로 이 함수는 더 이상 필요하지 않음
          console.warn('setCases는 더 이상 사용되지 않습니다. Convex 뮤테이션을 사용하세요.');
        },
      };
    }
  }, [
    type,
    personalCase,
    personalLoading,
    customerCases,
    customerLoading,
    refetchAll,
    refetchCustomers,
    ensurePersonalCaseExists,
  ]);

  return result;
};
