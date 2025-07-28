/**
 * Clinical Photos Convex 훅들
 * Convex를 사용한 임상 사진 관리 기능
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ClinicalCase, PhotoSlot } from '@/types/clinical';

// =================================
// Helper functions
// =================================

/**
 * Convex clinical_cases를 ClinicalCase 타입으로 변환
 */
function convertToClinicalCase(convexCase: any): ClinicalCase {
  return {
    id: convexCase._id,
    customerName: convexCase.name,
    status: convexCase.status === 'in_progress' ? 'active' : convexCase.status,
    createdAt: new Date(convexCase.created_at).toISOString(),
    consentReceived: convexCase.consent_status === 'consented',
    consentImageUrl: convexCase.consent_file?.file_path,
    photos: [], // 별도로 조회해야 함
    customerInfo: {
      name: convexCase.name,
      age: convexCase.age,
      gender: convexCase.gender,
      treatmentType: convexCase.treatment_item,
      products: convexCase.metadata?.products || [],
      skinTypes: convexCase.metadata?.skinTypes || [],
      memo: convexCase.treatment_plan || '',
    },
    roundCustomerInfo: convexCase.metadata?.roundInfo || {},
    metadata: convexCase.metadata,
    treatmentPlan: convexCase.treatment_plan,
    concernArea: convexCase.concern_area,
    caseTitle: convexCase.case_title,
    // 체크박스 필드들
    cureBooster: convexCase.metadata?.cureBooster,
    cureMask: convexCase.metadata?.cureMask,
    premiumMask: convexCase.metadata?.premiumMask,
    allInOneSerum: convexCase.metadata?.allInOneSerum,
    skinRedSensitive: convexCase.metadata?.skinRedSensitive,
    skinPigment: convexCase.metadata?.skinPigment,
    skinPore: convexCase.metadata?.skinPore,
    skinTrouble: convexCase.metadata?.skinTrouble,
    skinWrinkle: convexCase.metadata?.skinWrinkle,
    skinEtc: convexCase.metadata?.skinEtc,
  };
}

/**
 * Convex clinical_photos를 PhotoSlot 타입으로 변환
 */
function convertToPhotoSlot(convexPhoto: any): PhotoSlot {
  return {
    id: convexPhoto._id,
    roundDay: convexPhoto.session_number || 1,
    angle: convexPhoto.photo_type as 'front' | 'left_side' | 'right_side', // ✅ 백엔드 호환 타입으로 변경
    imageUrl: convexPhoto.file_path,
    url: convexPhoto.file_path,
    session_number: convexPhoto.session_number,
    uploaded: true,
    photoId: convexPhoto._id,
  };
}

// =================================
// Query 훅들
// =================================

/**
 * 케이스 목록 조회 훅
 */
export function useClinicalCasesConvex(
  profileId?: Id<'profiles'>,
  status?: 'in_progress' | 'completed' | 'paused' | 'cancelled'
) {
  const result = useQuery(
    api.clinical.listClinicalCases,
    profileId
      ? {
          profileId,
          paginationOpts: { numItems: 100, cursor: null },
          status,
        }
      : 'skip'
  );

  // 페이지네이션 응답을 단순 배열로 변환
  if (result && 'page' in result) {
    const convertedData = result.page?.map(convertToClinicalCase) || [];
    return {
      data: convertedData,
      isLoading: false,
      isPending: false, // ✅ React Query v5 표준
      isError: false,
      error: null,
      isSuccess: true, // ✅ 데이터 존재하고 에러 없으면 성공
    };
  }

  const isLoading = result === undefined;
  return {
    data: [],
    isLoading,
    isPending: isLoading, // ✅ React Query v5 표준
    isError: false,
    error: null,
    isSuccess: !isLoading, // ✅ 로딩 완료면 성공
  };
}

/**
 * 개별 케이스 조회 훅
 */
export function useClinicalCaseConvex(caseId?: string) {
  const result = useQuery(
    api.clinical.getClinicalCase,
    caseId ? { caseId: caseId as Id<'clinical_cases'> } : 'skip'
  );

  const isLoading = result === undefined;
  const hasData = result !== undefined;

  return {
    data: result ? convertToClinicalCase(result) : null,
    isLoading,
    isPending: isLoading, // ✅ React Query v5 표준
    isError: false,
    error: null,
    isSuccess: hasData, // ✅ 데이터 존재하면 성공
  };
}

/**
 * 케이스 사진 목록 조회 훅
 */
export function useClinicalPhotosConvex(caseId: string | null) {
  const result = useQuery(
    api.clinicalPhotos.getClinicalPhotos,
    caseId ? { caseId: caseId as Id<'clinical_cases'> } : 'skip'
  );

  const convertedData = result?.map(convertToPhotoSlot) || [];
  const isLoading = result === undefined;
  const hasData = result !== undefined;

  return {
    data: convertedData,
    isLoading,
    isPending: isLoading, // ✅ React Query v5 표준
    isError: false,
    error: null,
    isSuccess: hasData, // ✅ 데이터 존재하면 성공
  };
}

/**
 * 케이스 통계 조회 훅
 */
export function useClinicalCaseStatsConvex(profileId?: Id<'profiles'>) {
  const cases = useClinicalCasesConvex(profileId);

  // 클라이언트 사이드에서 통계 계산
  const stats = {
    total: cases.data?.length || 0,
    in_progress: cases.data?.filter(c => c.status === 'in_progress').length || 0,
    completed: cases.data?.filter(c => c.status === 'completed').length || 0,
    with_consent: cases.data?.filter(c => c.consent_status === 'consented').length || 0,
    total_photos: cases.data?.reduce((sum, c) => sum + (c.photo_count || 0), 0) || 0,
    total_sessions: cases.data?.reduce((sum, c) => sum + (c.total_sessions || 0), 0) || 0,
  };

  return {
    data: stats,
    isLoading: cases.isLoading,
    isPending: cases.isPending, // ✅ 상위 훅에서 전달
    isError: cases.isError,
    error: cases.error,
    isSuccess: cases.isSuccess, // ✅ 상위 훅에서 전달
  };
}

/**
 * 라운드별 고객 정보 조회 훅
 */
export function useRoundCustomerInfoConvex(caseId?: string) {
  const caseData = useClinicalCaseConvex(caseId);

  // metadata.rounds에서 라운드 정보 추출
  const roundInfo = caseData.data?.metadata?.rounds || {};

  return {
    data: roundInfo,
    isLoading: caseData.isLoading,
    isPending: caseData.isPending, // ✅ 상위 훅에서 전달
    isError: caseData.isError,
    error: caseData.error,
    isSuccess: caseData.isSuccess, // ✅ 상위 훅에서 전달
  };
}

/**
 * 동의서 파일 조회 훅
 */
export function useConsentFileConvex(caseId?: string) {
  const result = useQuery(
    api.clinicalPhotos.getConsentFile,
    caseId ? { caseId: caseId as Id<'clinical_cases'> } : 'skip'
  );

  const isLoading = result === undefined;
  const hasData = result !== undefined;

  return {
    data: result || null,
    isLoading,
    isPending: isLoading, // ✅ React Query v5 표준
    isError: false,
    error: null,
    isSuccess: hasData, // ✅ 데이터 존재하면 성공
  };
}

// =================================
// Mutation 훅들
// =================================

/**
 * 케이스 생성 훅
 */
export function useCreateClinicalCaseConvex() {
  const createCase = useMutation(api.clinical.createClinicalCase);

  return {
    mutateAsync: async (data: any) => {
      try {
        const result = await createCase({
          profileId: data.profileId,
          name: data.name || data.customerName,
          subject_type: data.subject_type || (data.customerName === '본인' ? 'self' : 'customer'),
          case_title: data.caseName || data.case_title,
          concern_area: data.concernArea || data.concern_area,
          treatment_plan: data.treatmentPlan || data.treatment_plan,
          consent_status: data.consentReceived ? 'consented' : 'no_consent',
          consent_date: data.consent_date,
          age: data.age,
          gender: data.gender,
          marketing_consent: data.marketing_consent || false,
          notes: data.notes,
          treatment_item: data.treatment_item,
        });

        toast.success('케이스가 생성되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Case creation error:', error);
        toast.error(`케이스 생성 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 케이스 정보 업데이트 훅
 */
export function useUpdateClinicalCaseConvex() {
  const updateCase = useMutation(api.clinical.updateClinicalCase);

  return {
    mutateAsync: async ({
      caseId,
      updates,
      profileId,
    }: {
      caseId: string | Id<'clinical_cases'>;
      updates: any;
      profileId?: Id<'profiles'>;
    }) => {
      try {
        const result = await updateCase({
          caseId: caseId as Id<'clinical_cases'>,
          updates,
          profileId,
        });

        toast.success('케이스 정보가 업데이트되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Case update error:', error);
        toast.error(`케이스 업데이트 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 케이스 상태 업데이트 훅
 */
export function useUpdateClinicalCaseStatusConvex() {
  const updateStatus = useMutation(api.clinical.updateClinicalCaseStatus);

  return {
    mutateAsync: async ({
      caseId,
      status,
      notes,
      profileId,
    }: {
      caseId: string;
      status: string;
      notes?: string;
      profileId?: Id<'profiles'>;
    }) => {
      try {
        const result = await updateStatus({
          caseId: caseId as Id<'clinical_cases'>,
          status: status as 'in_progress' | 'completed' | 'paused' | 'cancelled',
          notes,
          profileId,
        });

        toast.success('케이스 상태가 업데이트되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Status update error:', error);
        toast.error(`상태 업데이트 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 케이스 삭제 훅
 */
export function useDeleteClinicalCaseConvex() {
  const deleteCase = useMutation(api.clinical.deleteClinicalCase);

  return {
    mutateAsync: async ({ caseId, profileId }: { caseId: string; profileId?: Id<'profiles'> }) => {
      try {
        await deleteCase({
          caseId: caseId as Id<'clinical_cases'>,
          profileId,
        });

        toast.success('케이스가 삭제되었습니다.');
        return true;
      } catch (error: any) {
        console.error('Case deletion error:', error);
        toast.error(`케이스 삭제 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 사진 업로드 훅
 */
export function useUploadClinicalPhotoConvex() {
  const generateUploadUrl = useMutation(api.fileStorage.generateSecureUploadUrl);
  const savePhoto = useMutation(api.clinicalPhotos.uploadClinicalPhoto);

  return {
    mutateAsync: async ({
      caseId,
      roundNumber,
      angle,
      file,
      profileId,
    }: {
      caseId: string;
      roundNumber: number;
      angle: string;
      file: File;
      profileId?: Id<'profiles'>;
    }) => {
      try {
        // 1. 업로드 URL 생성
        console.log('[Upload Debug] Generating upload URL...');
        const uploadUrl = await generateUploadUrl();
        console.log('[Upload Debug] Upload URL:', uploadUrl);

        // 2. 파일 업로드 (POST 메서드 사용)
        console.log('[Upload Debug] Uploading file...');
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
        });

        console.log('[Upload Debug] Upload response status:', uploadResponse.status);
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('[Upload Debug] Upload error:', errorText);
          throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
        }

        // 3. response body에서 storageId 추출
        const { storageId } = await uploadResponse.json();
        console.log('[Upload Debug] Storage ID:', storageId);

        if (!storageId) {
          throw new Error('Storage ID를 받지 못했습니다.');
        }

        // 4. 메타데이터 저장
        console.log('[Upload Debug] Saving metadata...');
        const result = await savePhoto({
          caseId: caseId as Id<'clinical_cases'>,
          sessionNumber: roundNumber,
          photoType: angle as 'front' | 'left_side' | 'right_side',
          storageId: storageId as Id<'_storage'>,
          fileName: file.name,
          fileSize: file.size,
          profileId: profileId ? (profileId as any) : undefined, // string으로 전달
        });

        console.log('[Upload Debug] Metadata saved:', result);
        toast.success('사진이 업로드되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Photo upload error:', error);
        toast.error(`사진 업로드 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 사진 삭제 훅
 */
export function useDeleteClinicalPhotoConvex() {
  const deletePhoto = useMutation(api.clinicalPhotos.deleteClinicalPhoto);

  return {
    mutateAsync: async (photoId: string) => {
      try {
        await deletePhoto({
          photoId: photoId as Id<'clinical_photos'>,
        });

        toast.success('사진이 삭제되었습니다.');
        return true;
      } catch (error: any) {
        console.error('Photo deletion error:', error);
        toast.error(`사진 삭제 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 라운드별 고객 정보 저장 훅
 */
export function useSaveRoundCustomerInfoConvex() {
  const saveRoundInfo = useMutation(api.clinical.saveRoundCustomerInfo);

  return {
    mutateAsync: async ({
      caseId,
      roundNumber,
      info,
      profileId,
    }: {
      caseId: string;
      roundNumber: number;
      info: any;
      profileId?: Id<'profiles'>;
    }) => {
      try {
        const result = await saveRoundInfo({
          caseId: caseId as Id<'clinical_cases'>,
          roundNumber,
          info,
          profileId,
        });

        toast.success('라운드 정보가 저장되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Round info save error:', error);
        toast.error(`라운드 정보 저장 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}

/**
 * 동의서 파일 저장 훅
 */
export function useSaveConsentFileConvex() {
  const generateUploadUrl = useMutation(api.fileStorage.generateSecureUploadUrl);
  const saveConsent = useMutation(api.clinicalPhotos.saveConsentFile);

  return {
    mutateAsync: async (fileData: { clinical_case_id: string; file: File; [key: string]: any }) => {
      try {
        // 1. 업로드 URL 생성
        console.log('[Consent Upload Debug] Generating upload URL...');
        const uploadUrl = await generateUploadUrl();
        console.log('[Consent Upload Debug] Upload URL:', uploadUrl);

        // 2. 파일 업로드 (POST 메서드 사용)
        console.log('[Consent Upload Debug] Uploading file...');
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: fileData.file,
        });

        console.log('[Consent Upload Debug] Upload response status:', uploadResponse.status);
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('[Consent Upload Debug] Upload error:', errorText);
          throw new Error(`동의서 업로드 실패: ${uploadResponse.statusText}`);
        }

        // 3. response body에서 storageId 추출
        const { storageId } = await uploadResponse.json();
        console.log('[Consent Upload Debug] Storage ID:', storageId);

        if (!storageId) {
          throw new Error('Storage ID를 받지 못했습니다.');
        }

        // 4. 메타데이터 저장
        console.log('[Consent Upload Debug] Saving metadata...');
        const result = await saveConsent({
          caseId: fileData.clinical_case_id as Id<'clinical_cases'>,
          storageId: storageId as Id<'_storage'>,
          fileName: fileData.file.name,
          fileSize: fileData.file.size,
          fileType: fileData.file.type,
        });

        console.log('[Consent Upload Debug] Metadata saved:', result);
        toast.success('동의서가 저장되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Consent file save error:', error);
        toast.error(`동의서 저장 실패: ${error.message}`);
        throw error;
      }
    },
    // ✅ React Query 표준 속성들 추가 (기본값)
    isPending: false,
    isLoading: false, // isPending alias
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
  };
}
