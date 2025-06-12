import { fetchCases, createCase } from '@/lib/clinical-photos-api';
import type { ClinicalCase } from '@/lib/clinical-photos';
import { PERSONAL_CASE_NAME, PERSONAL_PREFIX } from '@/app/kol-new/clinical-photos/types';

/**
 * 모든 케이스를 가져온 뒤, customerName 이 '본인' 인 케이스를 반환한다.
 */
export const fetchPersonalCase = async (): Promise<ClinicalCase | undefined | null> => {
  const allCases = await fetchCases();
  return allCases.find(c => c.customerName?.trim() === PERSONAL_CASE_NAME);
};

/**
 * '본인' 케이스가 존재하지 않으면 생성 후 반환한다.
 */
export const ensurePersonalCaseExists = async (): Promise<ClinicalCase | undefined | null> => {
  const existing = await fetchPersonalCase();
  if (existing) return existing;

  // 생성 로직 - 최소 필수 필드만 전달
  return await createCase({
    customerName: PERSONAL_CASE_NAME,
    caseName: '본인 임상 케이스',
    concernArea: '본인 케어',
    treatmentPlan: `${PERSONAL_PREFIX}개인 관리 계획`,
    consentReceived: false,
  });
};

/**
 * '본인' 케이스를 제외한 고객 케이스 목록을 반환한다.
 */
export const fetchCustomerCases = async (): Promise<ClinicalCase[]> => {
  const allCases = await fetchCases();
  return allCases.filter(c => c.customerName?.trim() !== PERSONAL_CASE_NAME);
}; 