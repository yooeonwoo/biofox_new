/**
 * Clinical Photos API - Convex 기반 완전 전환
 * 기존 lib/clinical-photos-api.ts의 Supabase 직접 호출을 Convex로 대체
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { ConvexHttpClient } from 'convex/browser';
import { convexToUICase, uiToConvexCreateArgs, isConvexId } from './clinical-photos-mapper';
import { PhotoSlot } from '@/types/clinical';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 타입 정의
export interface ClinicalCase {
  id: string; // Convex ID는 문자열
  kolId: string;
  customerId?: string | null;
  customerName: string;
  caseName: string;
  concernArea?: string | null;
  treatmentPlan?: string | null;
  consentReceived: boolean;
  consentDate?: string | null;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  totalPhotos: number;
  consentImageUrl?: string | null;

  // 제품 선택 필드
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;

  // 피부타입 필드
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// =================================
// 📋 Clinical Cases 관리 훅들
// =================================

/**
 * 케이스 목록 조회 훅 (실시간 동기화)
 */
export function useClinicalCases(status?: string) {
  return useQuery({
    queryKey: ['clinical-cases', status],
    queryFn: async () => {
      try {
        const result = await convex.query(api.clinical.listClinicalCases, {
          paginationOpts: { numItems: 100, cursor: null },
          status: status as any,
        });

        return result.page.map(convexToUICase);
      } catch (error) {
        console.error('Clinical cases fetch error:', error);
        toast.error('케이스 목록을 불러오는데 실패했습니다.');
        return [];
      }
    },
    staleTime: 1000 * 60, // 1분간 캐시 유지
    refetchOnWindowFocus: true,
  });
}

/**
 * 특정 케이스 조회 훅
 */
export function useClinicalCase(caseId: string | null) {
  return useQuery({
    queryKey: ['clinical-case', caseId],
    queryFn: async () => {
      if (!caseId) return null;

      try {
        const result = await convex.query(api.clinical.getClinicalCase, {
          caseId: caseId as Id<'clinical_cases'>,
        });

        return result ? convexToUICase(result) : null;
      } catch (error) {
        console.error('Clinical case fetch error:', error);
        toast.error('케이스 정보를 불러오는데 실패했습니다.');
        return null;
      }
    },
    enabled: !!caseId,
    staleTime: 1000 * 30, // 30초간 캐시 유지
  });
}

/**
 * 케이스 생성 훅
 */
export function useCreateClinicalCase(profileId?: Id<'profiles'>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: {
      customerName: string;
      caseName: string;
      concernArea?: string;
      treatmentPlan?: string;
      consentReceived?: boolean;
      consentDate?: string;
      // 제품 선택
      cureBooster?: boolean;
      cureMask?: boolean;
      premiumMask?: boolean;
      allInOneSerum?: boolean;
      // 피부타입
      skinRedSensitive?: boolean;
      skinPigment?: boolean;
      skinPore?: boolean;
      skinTrouble?: boolean;
      skinWrinkle?: boolean;
      skinEtc?: boolean;
    }) => {
      try {
        if (!profileId) {
          throw new Error('프로필 ID가 필요합니다.');
        }

        const convexArgs = {
          ...uiToConvexCreateArgs(caseData),
          profileId: profileId,
        };
        const result = await convex.mutation(api.clinical.createClinicalCase, convexArgs);

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
    },
    onSuccess: () => {
      // 캐시 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
    },
  });
}

/**
 * 케이스 상태 업데이트 훅 (간단한 상태 변경만 지원)
 */
export function useUpdateClinicalCaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      status,
    }: {
      caseId: string;
      status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
    }) => {
      try {
        const result = await convex.mutation(api.clinical.updateClinicalCaseStatus, {
          caseId: caseId as Id<'clinical_cases'>,
          status,
        });

        toast.success('케이스 상태가 업데이트되었습니다.');
        return result;
      } catch (error: any) {
        console.error('Case status update error:', error);
        toast.error(`케이스 상태 수정에 실패했습니다: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, { caseId }) => {
      // 특정 케이스와 전체 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
    },
  });
}

/**
 * 케이스 삭제 훅
 */
export function useDeleteClinicalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, profileId }: { caseId: string; profileId?: string }) => {
      try {
        await convex.mutation(api.clinical.deleteClinicalCase, {
          caseId: caseId as Id<'clinical_cases'>,
          profileId: profileId as Id<'profiles'> | undefined,
        });

        toast.success('케이스가 삭제되었습니다.');
        return caseId;
      } catch (error: any) {
        console.error('Case deletion error:', error);
        toast.error(`케이스 삭제에 실패했습니다: ${error.message}`);
        throw error;
      }
    },
    onSuccess: caseId => {
      // 캐시에서 삭제된 케이스 제거
      queryClient.removeQueries({ queryKey: ['clinical-case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
    },
  });
}

// =================================
// 📸 Clinical Photos 관리 훅들
// =================================

/**
 * 케이스의 사진 목록 조회 훅
 */
export function useClinicalPhotos(caseId: string | null) {
  return useQuery({
    queryKey: ['clinical-photos', caseId],
    queryFn: async () => {
      if (!caseId) return [];

      try {
        const photos = await convex.query(api.fileStorage.getClinicalPhotos, {
          clinical_case_id: caseId as Id<'clinical_cases'>,
        });

        return photos.map(transformPhotoSlot);
      } catch (error) {
        console.error('Clinical photos fetch error:', error);
        toast.error('사진 목록을 불러오는데 실패했습니다.');
        return [];
      }
    },
    enabled: !!caseId,
    staleTime: 1000 * 30, // 30초간 캐시 유지
  });
}

/**
 * 사진 업로드 훅 (Convex Storage 사용)
 */
export function useUploadClinicalPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
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
      profileId?: string;
    }) => {
      try {
        // 🚀 Step 1: Convex에서 업로드 URL 생성
        console.log('[Upload Debug] Generating upload URL...');
        const uploadUrl = await convex.mutation(api.fileStorage.generateSecureUploadUrl);
        console.log('[Upload Debug] Upload URL generated:', uploadUrl);

        // 🚀 Step 2: Convex Storage로 직접 업로드
        console.log('[Upload Debug] Uploading file to:', uploadUrl);
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
        });

        console.log('[Upload Debug] Upload response status:', uploadResponse.status);
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('[Upload Debug] Upload failed:', errorText);
          throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
        }

        // 디버깅을 위한 로그 추가
        const responseText = await uploadResponse.text();
        console.log('[Upload Debug] Response text:', responseText);

        let storageId;
        try {
          const responseData = JSON.parse(responseText);
          storageId = responseData.storageId;
          console.log('[Upload Debug] Parsed storageId:', storageId);
        } catch (parseError) {
          console.error('[Upload Debug] Failed to parse response:', parseError);
          throw new Error('업로드 응답 파싱 실패');
        }

        if (!storageId) {
          throw new Error('storageId를 받지 못했습니다');
        }

        // 🚀 Step 3: 메타데이터 저장
        console.log('[Upload Debug] Saving metadata with storageId:', storageId);
        const photoResult = await convex.mutation(api.fileStorage.saveClinicalPhoto, {
          storageId,
          clinical_case_id: caseId as Id<'clinical_cases'>,
          session_number: roundNumber,
          photo_type: angle as 'front' | 'left_side' | 'right_side',
          file_size: file.size,
          profileId: profileId, // string으로 그대로 전달
        });

        console.log('[Upload Debug] Photo metadata saved:', photoResult);
        toast.success('사진이 업로드되었습니다.');
        return photoResult;
      } catch (error: any) {
        console.error('Photo upload error:', error);
        toast.error(`사진 업로드에 실패했습니다: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, { caseId }) => {
      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-photos', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case', caseId] });
    },
  });
}

/**
 * 사진 삭제 훅
 */
export function useDeleteClinicalPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      try {
        await convex.mutation(api.fileStorage.deleteClinicalPhoto, {
          photoId: photoId as Id<'clinical_photos'>,
        });

        toast.success('사진이 삭제되었습니다.');
        return photoId;
      } catch (error: any) {
        console.error('Photo deletion error:', error);
        toast.error(`사진 삭제에 실패했습니다: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, photoId) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-photos'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
    },
  });
}

// =================================
// 🔧 유틸리티 함수들
// =================================

/**
 * Convex Clinical Photo 데이터를 PhotoSlot 형식으로 변환
 */
function transformPhotoSlot(convexPhoto: any): PhotoSlot {
  return {
    id: convexPhoto._id,
    roundDay: convexPhoto.session_number || 1,
    angle: convexPhoto.photo_type || 'front',
    imageUrl: convexPhoto.file_url,
    uploaded: !!convexPhoto.file_url,
    photoId: convexPhoto._id,
  };
}

/**
 * 편의 함수: 개인 케이스 확인/생성
 */
export function useEnsurePersonalCase(profileId?: Id<'profiles'>) {
  const { data: cases, isLoading } = useClinicalCases();
  const createCase = useCreateClinicalCase(profileId);

  const personalCase = cases?.find(c => c.customerName?.trim() === '본인');

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
    personalCase,
    isLoading,
    ensurePersonalCaseExists,
    isCreating: createCase.isPending,
  };
}

/**
 * 편의 함수: 고객 케이스 목록 (본인 제외)
 */
export function useCustomerCases() {
  const { data: allCases, ...rest } = useClinicalCases();

  const customerCases = allCases?.filter(c => c.customerName?.trim() !== '본인') || [];

  return {
    data: customerCases,
    ...rest,
  };
}
