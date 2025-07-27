/**
 * Case Management 훅 - Convex 기반 완전 전환 (Shop 버전)
 * 기존 API 호출을 Convex 실시간 동기화로 대체
 */

import { useMemo } from 'react';
import type { ClinicalCase } from '@/lib/clinical-photos-convex';
import { useClinicalCases } from '@/lib/clinical-photos-convex';
import { useCreateClinicalCase } from '@/lib/clinical-photos-convex';

/**
 * 케이스 데이터를 실시간으로 관리하는 Convex 기반 훅 (Shop 버전)
 * @param type 'personal' | 'customer'
 */
export const useCaseManagement = (type: 'personal' | 'customer') => {
  // 🚀 Convex 실시간 훅 사용 - 조건부 호출 방지를 위해 항상 같은 훅 사용
  const { data: allCases = [], isLoading } = useClinicalCases();
  const createCase = useCreateClinicalCase();

  const result = useMemo(() => {
    if (type === 'personal') {
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
        loading: isLoading || createCase.isPending,
        refresh: async () => {
          // Convex는 자동으로 실시간 업데이트되므로 별도 refresh 불필요
          if (!personalCase) {
            await ensurePersonalCaseExists();
          }
        },
        setCases: () => {
          console.warn(
            'setCases는 Convex 모드에서 지원되지 않습니다. 실시간 동기화가 자동으로 처리됩니다.'
          );
        },
      };
    } else {
      const customerCases = allCases.filter(c => c.customerName?.trim() !== '본인');

      return {
        cases: customerCases,
        loading: isLoading,
        refresh: async () => {
          // Convex는 자동으로 실시간 업데이트되므로 별도 refresh 불필요
          console.info('Convex는 실시간 업데이트되므로 수동 새로고침이 불필요합니다.');
        },
        setCases: () => {
          console.warn(
            'setCases는 Convex 모드에서 지원되지 않습니다. 실시간 동기화가 자동으로 처리됩니다.'
          );
        },
      };
    }
  }, [type, allCases, isLoading, createCase]);

  return result;
};
