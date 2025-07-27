/**
 * Case Management 훅 - Convex 기반 실제 구현
 * 기존 더미 데이터 버전을 Convex 훅으로 완전 교체
 */

import { useMemo } from 'react';
import {
  useClinicalCases,
  useCreateClinicalCase,
  type ClinicalCase,
} from '@/lib/clinical-photos-convex';

/**
 * 케이스 데이터를 Convex에서 실시간으로 관리하는 훅
 * @param type 'personal' | 'customer'
 */
export const useCaseManagement = (type: 'personal' | 'customer') => {
  // Convex 훅들 사용 - 조건부 호출 방지를 위해 항상 같은 훅 사용
  const {
    data: allCases = [],
    isLoading: allCasesLoading,
    refetch: refetchAll,
  } = useClinicalCases();
  const createCase = useCreateClinicalCase();

  const result = useMemo(() => {
    if (type === 'personal') {
      // 개인 케이스 (배열 형태로 반환)
      const personalCase = allCases.find(c => c.customerName?.trim() === '본인');
      const ensurePersonalCaseExists = async () => {
        if (personalCase) return personalCase;

        return await createCase.mutateAsync({
          customerName: '본인',
          caseName: '본인 임상 케이스',
          concernArea: '본인 케어',
          treatmentPlan: '개인 관리 계획',
          consentReceived: false,
        });
      };

      return {
        cases: personalCase ? [personalCase] : [],
        loading: allCasesLoading || createCase.isPending,
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
      const customerCases = allCases.filter(c => c.customerName?.trim() !== '본인');

      return {
        cases: customerCases,
        loading: allCasesLoading,
        refresh: async () => {
          await refetchAll();
        },
        setCases: (newCases: ClinicalCase[] | ((prev: ClinicalCase[]) => ClinicalCase[])) => {
          // 실제 데이터는 Convex에서 관리되므로 이 함수는 더 이상 필요하지 않음
          console.warn('setCases는 더 이상 사용되지 않습니다. Convex 뮤테이션을 사용하세요.');
        },
      };
    }
  }, [type, allCases, allCasesLoading, refetchAll, createCase]);

  return result;
};
