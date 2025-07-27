/**
 * Clinical Photos 훅들 - Supabase 전환
 * 기존 Convex 훅들을 Supabase 훅으로 re-export하여 호환성 유지
 */

// ✅ Step 3.1.2: Convex 훅들을 Supabase 훅으로 re-export
export {
  useClinicalCasesSupabase as useClinicalCasesConvex,
  useClinicalCaseSupabase as useClinicalCaseConvex,
  useCreateClinicalCaseSupabase as useCreateClinicalCaseConvex,
  useUpdateClinicalCaseSupabase as useUpdateClinicalCaseConvex,
  useUpdateClinicalCaseStatusSupabase as useUpdateClinicalCaseStatusConvex,
  useDeleteClinicalCaseSupabase as useDeleteClinicalCaseConvex,
  useClinicalPhotosSupabase as useClinicalPhotosConvex,
  useUploadClinicalPhotoSupabase as useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoSupabase as useDeleteClinicalPhotoConvex,
  useClinicalCaseStatsSupabase as useClinicalCaseStatsConvex,
  useRoundCustomerInfoSupabase as useRoundCustomerInfoConvex,
  useSaveRoundCustomerInfoSupabase as useSaveRoundCustomerInfoConvex,
  useConsentFileSupabase as useConsentFileConvex,
  useSaveConsentFileSupabase as useSaveConsentFileConvex,
} from './clinical-photos-supabase-hooks';

// 추가 유틸리티 함수들도 필요시 re-export
export * from './clinical-photos-supabase-hooks';

// ✅ 기존 Convex 파일과 100% 호환되는 인터페이스 제공
// 이제 모든 컴포넌트에서 기존 import 문을 그대로 사용 가능
