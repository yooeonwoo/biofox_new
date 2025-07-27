/**
 * Clinical Photos Service - Convex 전환 리다이렉트
 * 기존 API 호출을 새로운 Convex 기반 훅으로 교체
 *
 * ⚠️ 이 파일은 레거시 호환성을 위해 유지되지만
 * 새로운 개발에서는 /lib/clinical-photos-convex.ts 사용을 권장합니다
 */

import { PERSONAL_CASE_NAME, PERSONAL_PREFIX } from '@/app/kol-new/clinical-photos/types';

// 새로운 Convex 기반 훅들에서 임포트
export {
  useClinicalCases,
  useClinicalCase,
  useCreateClinicalCase,
  useUpdateClinicalCaseStatus,
  useDeleteClinicalCase,
  useClinicalPhotos,
  useUploadClinicalPhoto,
  useDeleteClinicalPhoto,
  useEnsurePersonalCase,
  useCustomerCases,
  type ClinicalCase,
  type UploadResponse,
} from '@/lib/clinical-photos-convex';
import type { PhotoSlot } from '@/types/clinical';

/**
 * @deprecated 레거시 함수 - useEnsurePersonalCase() 훅 사용을 권장
 */
export const fetchPersonalCase = async () => {
  console.warn('fetchPersonalCase는 deprecated입니다. useEnsurePersonalCase() 훅을 사용하세요.');
  throw new Error('이 함수는 더 이상 지원되지 않습니다. useEnsurePersonalCase() 훅을 사용하세요.');
};

/**
 * @deprecated 레거시 함수 - useEnsurePersonalCase() 훅 사용을 권장
 */
export const ensurePersonalCaseExists = async () => {
  console.warn(
    'ensurePersonalCaseExists는 deprecated입니다. useEnsurePersonalCase() 훅을 사용하세요.'
  );
  throw new Error('이 함수는 더 이상 지원되지 않습니다. useEnsurePersonalCase() 훅을 사용하세요.');
};

/**
 * @deprecated 레거시 함수 - useCustomerCases() 훅 사용을 권장
 */
export const fetchCustomerCases = async () => {
  console.warn('fetchCustomerCases는 deprecated입니다. useCustomerCases() 훅을 사용하세요.');
  throw new Error('이 함수는 더 이상 지원되지 않습니다. useCustomerCases() 훅을 사용하세요.');
};
