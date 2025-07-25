/**
 * Case Management 훅 - 더미 데이터 버전
 * Convex 마이그레이션 중 프론트엔드 확인을 위한 임시 구현
 */

import { useMemo, useState } from 'react';
import type { ClinicalCase } from '@/lib/clinical-photos-convex';

/**
 * 케이스 데이터를 더미 데이터로 관리하는 훅
 * @param type 'personal' | 'customer'
 */
export const useCaseManagement = (type: 'personal' | 'customer') => {
  const [cases, setCases] = useState<ClinicalCase[]>([]);

  const dummyCases = useMemo(() => {
    if (type === 'personal') {
      return [
        {
          id: 'personal-1',
          kolId: 'dummy-kol-id',
          customerName: '본인',
          caseName: '보톡스 이마',
          concernArea: '이마 주름',
          treatmentPlan: '보톡스 20유닛 시술',
          consentReceived: true,
          consentDate: '2024-01-01',
          status: 'active' as const,
          createdAt: '2024-01-01T09:00:00.000Z',
          updatedAt: '2024-01-01T09:00:00.000Z',
          totalPhotos: 3,
          cureBooster: true,
          cureMask: true,
          skinRedSensitive: true,
          skinWrinkle: true,
        },
      ];
    } else {
      return [
        {
          id: 'customer-1',
          kolId: 'dummy-kol-id',
          customerId: 'cust-1',
          customerName: '김미영 고객님',
          caseName: '보톡스 이마',
          concernArea: '이마 주름',
          treatmentPlan: '보톡스 30유닛 시술',
          consentReceived: true,
          consentDate: '2024-01-10',
          status: 'active' as const,
          createdAt: '2024-01-10T09:00:00.000Z',
          updatedAt: '2024-01-10T09:00:00.000Z',
          totalPhotos: 6,
          cureBooster: true,
          premiumMask: true,
          skinWrinkle: true,
        },
        {
          id: 'customer-2',
          kolId: 'dummy-kol-id',
          customerId: 'cust-2',
          customerName: '이정희 고객님',
          caseName: '필러 팔자주름',
          concernArea: '팔자주름',
          treatmentPlan: '필러 2cc 시술',
          consentReceived: true,
          consentDate: '2024-01-05',
          status: 'completed' as const,
          createdAt: '2024-01-05T14:30:00.000Z',
          updatedAt: '2024-01-15T14:30:00.000Z',
          totalPhotos: 9,
          allInOneSerum: true,
          skinPigment: true,
        },
        {
          id: 'customer-3',
          kolId: 'dummy-kol-id',
          customerId: 'cust-3',
          customerName: '박소연 고객님',
          caseName: '리프팅 시술',
          concernArea: '얼굴 전체 탄력',
          treatmentPlan: '울쎄라 + 써마지 복합 시술',
          consentReceived: false,
          status: 'active' as const,
          createdAt: '2024-01-03T11:00:00.000Z',
          updatedAt: '2024-01-03T11:00:00.000Z',
          totalPhotos: 0,
        },
      ];
    }
  }, [type]);

  const result = useMemo(() => {
    return {
      cases: cases.length > 0 ? cases : dummyCases,
      loading: false,
      refresh: async () => {
        console.log('더미 모드에서는 새로고침이 작동하지 않습니다.');
      },
      setCases: (newCases: ClinicalCase[] | ((prev: ClinicalCase[]) => ClinicalCase[])) => {
        if (typeof newCases === 'function') {
          setCases(newCases);
        } else {
          setCases(newCases);
        }
      },
    };
  }, [type, cases, dummyCases]);

  return result;
};
