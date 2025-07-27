/**
 * Clinical Photos React Hooks
 * Convex React 훅을 사용하여 실시간 업데이트와 인증을 지원합니다.
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { convexToUICase, uiToConvexCreateArgs } from './clinical-photos-mapper';

/**
 * 케이스 목록 조회 훅 (실시간 동기화)
 */
export function useClinicalCasesConvex(status?: string, profileId?: Id<'profiles'>) {
  const cases = useQuery(api.clinical.listClinicalCases, {
    profileId: profileId, // 프로필 ID 전달
    paginationOpts: { numItems: 100, cursor: null },
    status: status as any,
  });

  return {
    data: cases?.page?.map(convexToUICase) || [],
    isLoading: cases === undefined,
    error: null,
  };
}

/**
 * 특정 케이스 조회 훅
 */
export function useClinicalCaseConvex(caseId: string | null) {
  const caseData = useQuery(
    api.clinical.getClinicalCase,
    caseId ? { caseId: caseId as Id<'clinical_cases'> } : 'skip'
  );

  return {
    data: caseData ? convexToUICase(caseData) : null,
    isLoading: caseId ? caseData === undefined : false,
    error: null,
  };
}

/**
 * 케이스 생성 훅
 */
export function useCreateClinicalCaseConvex() {
  const createMutation = useMutation(api.clinical.createClinicalCase);

  const createCase = async (caseData: any, profileId: Id<'profiles'>) => {
    try {
      const convexArgs = uiToConvexCreateArgs(caseData);
      const result = await createMutation({
        ...convexArgs,
        profileId, // 프로필 ID 추가
      });
      toast.success('케이스가 생성되었습니다.');
      if (!result) {
        throw new Error('케이스 생성 결과를 받지 못했습니다.');
      }
      return convexToUICase(result);
    } catch (error: any) {
      console.error('Case creation error:', error);
      toast.error(`케이스 생성에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  return {
    mutate: createCase,
    mutateAsync: createCase,
  };
}

/**
 * 케이스 상태 업데이트 훅
 */
export function useUpdateClinicalCaseStatusConvex() {
  const updateMutation = useMutation(api.clinical.updateClinicalCaseStatus);

  const updateStatus = async ({
    caseId,
    status,
    profileId,
  }: {
    caseId: string;
    status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
    profileId?: string;
  }) => {
    try {
      await updateMutation({
        caseId: caseId as Id<'clinical_cases'>,
        status,
        profileId: profileId as Id<'profiles'> | undefined,
      });
      toast.success('케이스 상태가 업데이트되었습니다.');
    } catch (error: any) {
      console.error('Case status update error:', error);
      toast.error(`케이스 상태 수정에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  return {
    mutate: updateStatus,
    mutateAsync: updateStatus,
  };
}

/**
 * 케이스 삭제 훅
 */
export function useDeleteClinicalCaseConvex() {
  const deleteMutation = useMutation(api.clinical.deleteClinicalCase);

  const deleteCase = async (caseId: string, profileId?: string) => {
    try {
      await deleteMutation({
        caseId: caseId as Id<'clinical_cases'>,
        profileId: profileId as Id<'profiles'> | undefined,
      });
      toast.success('케이스가 삭제되었습니다.');
    } catch (error: any) {
      console.error('Case deletion error:', error);
      toast.error(`케이스 삭제에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  return {
    mutate: deleteCase,
    mutateAsync: deleteCase,
  };
}

/**
 * 케이스의 사진 목록 조회 훅
 */
export function useClinicalPhotosConvex(caseId: string | null) {
  const photos = useQuery(
    api.fileStorage.getClinicalPhotos,
    caseId ? { clinical_case_id: caseId as Id<'clinical_cases'> } : 'skip'
  );

  return {
    data:
      photos?.map((photo: any) => ({
        id: photo._id,
        roundDay: photo.session_number || 1,
        angle: photo.photo_type || 'front',
        imageUrl: photo.url,
        uploaded: !!photo.url,
        photoId: photo._id,
      })) || [],
    isLoading: caseId ? photos === undefined : false,
    error: null,
  };
}

/**
 * 사진 업로드 훅
 */
export function useUploadClinicalPhotoConvex() {
  const generateUploadUrl = useMutation(api.fileStorage.generateSecureUploadUrl);
  const savePhoto = useMutation(api.fileStorage.saveClinicalPhoto);

  const uploadPhoto = async ({
    caseId,
    roundNumber,
    angle,
    file,
    profileId, // profileId 추가
  }: {
    caseId: string;
    roundNumber: number;
    angle: string;
    file: File;
    profileId?: Id<'profiles'>; // profileId 추가
  }) => {
    try {
      // Step 1: 업로드 URL 생성
      const uploadUrl = await generateUploadUrl();

      // Step 2: 파일 업로드
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
      }

      const { storageId } = await uploadResponse.json();

      // Step 3: 메타데이터 저장
      const photoResult = await savePhoto({
        storageId,
        clinical_case_id: caseId as Id<'clinical_cases'>,
        session_number: roundNumber,
        photo_type: angle as 'front' | 'left_side' | 'right_side',
        file_size: file.size,
        profileId, // profileId 전달
      });

      toast.success('사진이 업로드되었습니다.');
      return photoResult;
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast.error(`사진 업로드에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  return {
    mutate: uploadPhoto,
    mutateAsync: uploadPhoto,
  };
}

/**
 * 사진 삭제 훅
 */
export function useDeleteClinicalPhotoConvex() {
  const deleteMutation = useMutation(api.fileStorage.deleteClinicalPhoto);

  const deletePhoto = async (photoId: string) => {
    try {
      await deleteMutation({
        photoId: photoId as Id<'clinical_photos'>,
      });
      toast.success('사진이 삭제되었습니다.');
    } catch (error: any) {
      console.error('Photo deletion error:', error);
      toast.error(`사진 삭제에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  return {
    mutate: deletePhoto,
    mutateAsync: deletePhoto,
  };
}

/**
 * 케이스의 라운드별 고객 정보 조회 훅
 */
export function useRoundCustomerInfoConvex(caseId: string | null, profileId?: string) {
  const roundInfo = useQuery(
    api.clinical.getRoundCustomerInfo,
    caseId
      ? {
          caseId: caseId as Id<'clinical_cases'>,
          profileId: profileId as Id<'profiles'> | undefined,
        }
      : 'skip'
  );

  return {
    data: roundInfo || [],
    isLoading: caseId ? roundInfo === undefined : false,
    error: null,
  };
}

/**
 * 편의 함수: 개인 케이스 확인/생성
 * @deprecated profileId를 전달해야 하므로 직접 사용하는 것을 권장
 */
// export function useEnsurePersonalCaseConvex() {
//   const { data: cases, isLoading } = useClinicalCasesConvex();
//   const createCase = useCreateClinicalCaseConvex();

//   const personalCase = cases?.find(c => c.customerName?.trim() === '본인');

//   const ensurePersonalCaseExists = async () => {
//     if (personalCase) return personalCase;

//     return await createCase.mutateAsync({
//       customerName: '본인',
//       caseName: '본인 임상 케이스',
//       concernArea: '본인 케어',
//       treatmentPlan: '개인 관리 계획',
//       consentReceived: false,
//     });
//   };

//   return {
//     personalCase,
//     ensurePersonalCaseExists,
//     isLoading,
//   };
// }

/**
 * 편의 함수: 고객 케이스 목록 (본인 제외)
 */
export function useCustomerCasesConvex() {
  const { data: allCases, ...rest } = useClinicalCasesConvex();

  const customerCases = allCases?.filter(c => c.customerName?.trim() !== '본인') || [];

  return {
    data: customerCases,
    ...rest,
  };
}

/**
 * 편의 함수: 케이스 통계
 * @deprecated profileId를 전달해야 하므로 직접 사용하는 것을 권장
 */
// export function useClinicalCaseStatsConvex() {
//   const { data: allCases, ...rest } = useClinicalCasesConvex();

//   const stats = useMemo(() => {
//     if (!allCases) return null;

//     return {
//       total: allCases.length,
//       byStatus: {
//         active: allCases.filter(c => c.status === 'active').length,
//         completed: allCases.filter(c => c.status === 'completed').length,
//       },
//       byType: {
//         personal: allCases.filter(c => c.customerName?.trim() === '본인').length,
//         customer: allCases.filter(c => c.customerName?.trim() !== '본인').length,
//       },
//     };
//   }, [allCases]);

//   return { stats, ...rest };
// }
