'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from './clinical-photos-supabase';

// =================================
// Query 훅들 (Step 2.1)
// =================================

/**
 * 케이스 목록 조회 훅 (Convex 호환)
 */
export function useClinicalCasesSupabase(profileId?: string, filters?: any) {
  return useQuery({
    queryKey: ['clinical-cases-supabase', profileId, filters],
    queryFn: () => api.listClinicalCases(profileId!, filters),
    enabled: !!profileId,
    staleTime: 1000 * 30, // 30초 캐시
    gcTime: 1000 * 60 * 5, // 5분 가비지 컬렉션
  });
}

/**
 * 개별 케이스 조회 훅 (Convex 호환)
 */
export function useClinicalCaseSupabase(caseId?: string) {
  return useQuery({
    queryKey: ['clinical-case-supabase', caseId],
    queryFn: () => api.getClinicalCase(caseId!),
    enabled: !!caseId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * 케이스 사진 목록 조회 훅 (Convex 호환)
 */
export function useClinicalPhotosSupabase(caseId: string | null) {
  return useQuery({
    queryKey: ['clinical-photos-supabase', caseId],
    queryFn: () => api.getClinicalPhotos(caseId!),
    enabled: !!caseId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * 케이스 통계 조회 훅
 */
export function useClinicalCaseStatsSupabase(profileId?: string) {
  return useQuery({
    queryKey: ['clinical-case-stats-supabase', profileId],
    queryFn: () => api.getClinicalCaseStats(profileId),
    enabled: !!profileId,
    staleTime: 1000 * 60, // 1분 캐시 (통계는 자주 변경되지 않음)
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * 라운드별 고객 정보 조회 훅
 */
export function useRoundCustomerInfoSupabase(caseId?: string) {
  return useQuery({
    queryKey: ['round-customer-info-supabase', caseId],
    queryFn: () => api.getRoundCustomerInfo(caseId!),
    enabled: !!caseId,
    staleTime: 1000 * 60, // 1분 캐시
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * 동의서 파일 조회 훅
 */
export function useConsentFileSupabase(caseId?: string) {
  return useQuery({
    queryKey: ['consent-file-supabase', caseId],
    queryFn: () => api.getConsentFile(caseId!),
    enabled: !!caseId,
    staleTime: 1000 * 60 * 5, // 5분 캐시 (동의서는 자주 변경되지 않음)
    gcTime: 1000 * 60 * 10,
  });
}

// =================================
// Mutation 훅들 (Step 2.2)
// =================================

/**
 * 케이스 생성 훅 (Convex 호환)
 */
export function useCreateClinicalCaseSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createClinicalCase,
    onSuccess: (data, variables) => {
      // 케이스 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-stats-supabase'] });

      // 새로 생성된 케이스를 캐시에 추가
      queryClient.setQueryData(['clinical-case-supabase', data._id], data);

      toast.success('케이스가 생성되었습니다.');
    },
    onError: (error: any) => {
      console.error('Case creation error:', error);
      toast.error(`케이스 생성 실패: ${error.message}`);
    },
  });
}

/**
 * 케이스 정보 업데이트 훅 (Convex 호환)
 */
export function useUpdateClinicalCaseSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, updates }: { caseId: string; updates: any }) =>
      api.updateClinicalCase(caseId, updates),
    onSuccess: (data, { caseId }) => {
      // 해당 케이스와 목록 캐시 업데이트
      queryClient.setQueryData(['clinical-case-supabase', caseId], data);
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-stats-supabase'] });

      toast.success('케이스 정보가 업데이트되었습니다.');
    },
    onError: (error: any) => {
      console.error('Case update error:', error);
      toast.error(`케이스 업데이트 실패: ${error.message}`);
    },
  });
}

/**
 * 케이스 상태 업데이트 훅
 */
export function useUpdateClinicalCaseStatusSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      status,
      notes,
      profileId,
    }: {
      caseId: string;
      status: string;
      notes?: string;
      profileId?: string;
    }) => api.updateClinicalCaseStatus(caseId, status, notes),
    onSuccess: (data, { caseId }) => {
      queryClient.setQueryData(['clinical-case-supabase', caseId], data);
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-stats-supabase'] });

      toast.success('케이스 상태가 업데이트되었습니다.');
    },
    onError: (error: any) => {
      console.error('Case status update error:', error);
      toast.error(`상태 업데이트 실패: ${error.message}`);
    },
  });
}

/**
 * 케이스 삭제 훅
 */
export function useDeleteClinicalCaseSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, profileId }: { caseId: string; profileId?: string }) =>
      api.deleteClinicalCase(caseId),
    onSuccess: (_, { caseId }) => {
      // 해당 케이스 캐시 제거
      queryClient.removeQueries({ queryKey: ['clinical-case-supabase', caseId] });
      queryClient.removeQueries({ queryKey: ['clinical-photos-supabase', caseId] });
      queryClient.removeQueries({ queryKey: ['round-customer-info-supabase', caseId] });
      queryClient.removeQueries({ queryKey: ['consent-file-supabase', caseId] });

      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-stats-supabase'] });

      toast.success('케이스가 삭제되었습니다.');
    },
    onError: (error: any) => {
      console.error('Case deletion error:', error);
      toast.error(`케이스 삭제 실패: ${error.message}`);
    },
  });
}

/**
 * 사진 업로드 훅 (Convex 호환)
 */
export function useUploadClinicalPhotoSupabase() {
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
        // Step 1: 업로드 URL 생성
        const uploadUrl = await api.generateUploadUrl();

        // Step 2: 파일 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
        }

        // Step 3: URL에서 파일 경로 추출
        const filePath = uploadUrl?.split('?')[0]?.split('/')?.pop() || '';

        // Step 4: 메타데이터 저장
        return api.saveClinicalPhoto({
          clinical_case_id: caseId,
          session_number: roundNumber,
          photo_type: angle === 'left' ? 'left_side' : angle === 'right' ? 'right_side' : 'front',
          storage_path: filePath,
          file_size: file.size,
          uploaded_by: profileId,
        });
      } catch (error: any) {
        console.error('Photo upload error:', error);
        throw error;
      }
    },
    onSuccess: (_, { caseId }) => {
      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-photos-supabase', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-supabase', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });

      toast.success('사진이 업로드되었습니다.');
    },
    onError: (error: any) => {
      console.error('Photo upload error:', error);
      toast.error(`사진 업로드 실패: ${error.message}`);
    },
  });
}

/**
 * 사진 삭제 훅
 */
export function useDeleteClinicalPhotoSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteClinicalPhoto,
    onSuccess: (_, photoId) => {
      // 사진 관련 캐시들 무효화
      queryClient.invalidateQueries({ queryKey: ['clinical-photos-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-supabase'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-cases-supabase'] });

      toast.success('사진이 삭제되었습니다.');
    },
    onError: (error: any) => {
      console.error('Photo deletion error:', error);
      toast.error(`사진 삭제 실패: ${error.message}`);
    },
  });
}

/**
 * 라운드별 고객 정보 저장 훅
 */
export function useSaveRoundCustomerInfoSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      roundNumber,
      info,
    }: {
      caseId: string;
      roundNumber: number;
      info: any;
    }) => api.saveRoundCustomerInfo(caseId, roundNumber, info),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: ['round-customer-info-supabase', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-supabase', caseId] });

      toast.success('라운드 정보가 저장되었습니다.');
    },
    onError: (error: any) => {
      console.error('Round info save error:', error);
      toast.error(`라운드 정보 저장 실패: ${error.message}`);
    },
  });
}

/**
 * 동의서 파일 저장 훅
 */
export function useSaveConsentFileSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileData: { clinical_case_id: string; [key: string]: any }) =>
      api.saveConsentFile(fileData),
    onSuccess: (_, variables) => {
      const caseId = variables.clinical_case_id;
      queryClient.invalidateQueries({ queryKey: ['consent-file-supabase', caseId] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case-supabase', caseId] });

      toast.success('동의서가 저장되었습니다.');
    },
    onError: (error: any) => {
      console.error('Consent file save error:', error);
      toast.error(`동의서 저장 실패: ${error.message}`);
    },
  });
}

// ✅ Step 2 완료: React Query 훅 생성 완료!
