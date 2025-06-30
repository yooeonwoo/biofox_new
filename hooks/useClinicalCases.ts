import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalPhotosAPI } from '@/services/clinicalPhotos';
import type { ClinicalCase } from '@/lib/clinical-photos';
import { toast } from 'sonner';

// 쿼리 키 팩토리
export const clinicalQueryKeys = {
  all: ['clinical'] as const,
  cases: () => [...clinicalQueryKeys.all, 'cases'] as const,
  case: (id: number) => [...clinicalQueryKeys.cases(), id] as const,
  photos: (caseId: number) => [...clinicalQueryKeys.all, 'photos', caseId] as const,
  roundInfo: (caseId: number) => [...clinicalQueryKeys.all, 'roundInfo', caseId] as const,
} as const;

// 케이스 목록 조회 훅
export function useClinicalCases(status?: string) {
  return useQuery({
    queryKey: [...clinicalQueryKeys.cases(), status],
    queryFn: () => clinicalPhotosAPI.cases.list(status),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
  });
}

// 특정 케이스 조회 훅
export function useClinicalCase(caseId: number) {
  return useQuery({
    queryKey: clinicalQueryKeys.case(caseId),
    queryFn: () => clinicalPhotosAPI.cases.get(caseId),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 케이스 사진 목록 조회 훅
export function useClinicalPhotos(caseId: number) {
  return useQuery({
    queryKey: clinicalQueryKeys.photos(caseId),
    queryFn: () => clinicalPhotosAPI.photos.list(caseId),
    enabled: !!caseId,
    staleTime: 2 * 60 * 1000, // 2분
  });
}

// 회차별 고객 정보 조회 훅
export function useClinicalRoundInfo(caseId: number) {
  return useQuery({
    queryKey: clinicalQueryKeys.roundInfo(caseId),
    queryFn: () => clinicalPhotosAPI.roundInfo.fetch(caseId),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 케이스 생성 뮤테이션
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clinicalPhotosAPI.cases.create,
    onSuccess: (newCase) => {
      if (newCase) {
        // 케이스 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.cases() });
        toast.success('케이스가 성공적으로 생성되었습니다.');
      }
    },
    onError: (error) => {
      toast.error(`케이스 생성 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 케이스 업데이트 뮤테이션
export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, updates }: { caseId: number; updates: Partial<ClinicalCase> }) =>
      clinicalPhotosAPI.cases.update(caseId, updates),
    onSuccess: (updatedCase, { caseId }) => {
      if (updatedCase) {
        // 특정 케이스 캐시 업데이트
        queryClient.setQueryData(clinicalQueryKeys.case(caseId), updatedCase);
        // 케이스 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.cases() });
        toast.success('케이스가 성공적으로 업데이트되었습니다.');
      }
    },
    onError: (error) => {
      toast.error(`케이스 업데이트 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 케이스 삭제 뮤테이션
export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clinicalPhotosAPI.cases.remove,
    onSuccess: (success, caseId) => {
      if (success) {
        // 관련 캐시 무효화
        queryClient.removeQueries({ queryKey: clinicalQueryKeys.case(caseId) });
        queryClient.removeQueries({ queryKey: clinicalQueryKeys.photos(caseId) });
        queryClient.removeQueries({ queryKey: clinicalQueryKeys.roundInfo(caseId) });
        queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.cases() });
        toast.success('케이스가 성공적으로 삭제되었습니다.');
      }
    },
    onError: (error) => {
      toast.error(`케이스 삭제 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 사진 업로드 뮤테이션
export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, roundNumber, angle, file }: {
      caseId: number;
      roundNumber: number;
      angle: string;
      file: File;
    }) => clinicalPhotosAPI.photos.upload(caseId, roundNumber, angle, file),
    onSuccess: (imageUrl, { caseId }) => {
      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.photos(caseId) });
      toast.success('사진이 성공적으로 업로드되었습니다.');
    },
    onError: (error) => {
      toast.error(`사진 업로드 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 사진 삭제 뮤테이션
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, roundNumber, angle }: {
      caseId: number;
      roundNumber: number;
      angle: string;
    }) => clinicalPhotosAPI.photos.remove(caseId, roundNumber, angle),
    onSuccess: (_, { caseId }) => {
      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.photos(caseId) });
      toast.success('사진이 성공적으로 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error(`사진 삭제 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 동의서 업로드 뮤테이션
export function useUploadConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, file }: { caseId: number; file: File }) =>
      clinicalPhotosAPI.consent.upload(caseId, file),
    onSuccess: (imageUrl, { caseId }) => {
      // 케이스 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.cases() });
      toast.success('동의서가 성공적으로 업로드되었습니다.');
    },
    onError: (error) => {
      toast.error(`동의서 업로드 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
}

// 회차별 정보 저장 뮤테이션
export function useSaveRoundInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, roundNumber, roundInfo }: {
      caseId: number;
      roundNumber: number;
      roundInfo: {
        age?: number;
        gender?: 'male' | 'female' | 'other';
        treatmentType?: string;
        treatmentDate?: string;
        products?: string[];
        skinTypes?: string[];
        memo?: string;
      };
    }) => clinicalPhotosAPI.roundInfo.save(caseId, roundNumber, roundInfo),
    onSuccess: (_, { caseId }) => {
      // 회차별 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: clinicalQueryKeys.roundInfo(caseId) });
      toast.success('회차별 정보가 성공적으로 저장되었습니다.');
    },
    onError: (error) => {
      toast.error(`회차별 정보 저장 실패: ${error.message || '알 수 없는 오류'}`);
    },
  });
} 