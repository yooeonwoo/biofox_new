// ✅ Convex 훅 사용
import {
  useClinicalCasesConvex,
  useClinicalCaseConvex,
  useClinicalPhotosConvex,
  useCreateClinicalCaseConvex,
  useUpdateClinicalCaseConvex,
  useUpdateClinicalCaseStatusConvex,
  useDeleteClinicalCaseConvex,
} from '@/lib/clinical-photos-hooks';
import { Id } from '@/convex/_generated/dataModel'; // ✅ Id 타입 추가
import { toast } from 'sonner';
import { useCallback } from 'react';

/**
 * 🚀 Supabase 기반 Clinical Cases 훅들
 * React Query 기반 상태 관리 및 캐시 최적화 지원
 */

// 케이스 목록 조회 훅 (Convex 버전)
export function useClinicalCases(status?: 'in_progress' | 'completed' | 'paused' | 'cancelled') {
  const result = useClinicalCasesConvex(undefined, status);

  return {
    data: result.data || [],
    isLoading: result.isLoading,
    isPending: result.isLoading, // ✅ React Query v5 표준
    isError: result.error !== null, // ✅ error 존재 여부로 판단
    error: result.error,
    isSuccess: result.data !== undefined && result.error === null, // ✅ 데이터 존재하고 에러 없으면 성공
    hasMore: false, // 페이지네이션은 향후 구현
  };
}

// 특정 케이스 조회 훅 (Convex 버전)
export function useClinicalCase(caseId: string | null) {
  const result = useClinicalCaseConvex(caseId || undefined);

  return {
    data: result.data || null,
    isLoading: result.isLoading,
    isPending: result.isLoading, // ✅ React Query v5 표준
    isError: result.error !== null, // ✅ error 존재 여부로 판단
    error: result.error,
    isSuccess: result.data !== undefined && result.error === null, // ✅ 데이터 존재하고 에러 없으면 성공
  };
}

// 케이스 사진 목록 조회 훅 (Convex 버전)
export function useClinicalPhotos(caseId: string | null, sessionNumber: number = 1) {
  const result = useClinicalPhotosConvex(caseId);

  // 세션별 필터링 (클라이언트 사이드)
  const filteredData =
    result.data?.filter(photo => (sessionNumber ? photo.roundDay === sessionNumber : true)) || [];

  return {
    data: filteredData,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
  };
}

// 케이스 생성 훅 (Convex 버전)
export function useCreateClinicalCase() {
  const mutation = useCreateClinicalCaseConvex();

  const createCase = useCallback(
    async (caseData: any, profileId: string) => {
      try {
        return await mutation.mutateAsync({
          ...caseData,
          profileId,
        });
      } catch (error) {
        console.error('Case creation error:', error);
        throw error;
      }
    },
    [mutation]
  );

  return {
    mutate: createCase,
    mutateAsync: createCase,
    isLoading: mutation.isLoading, // ✅ 상위 훅에서 전달
    isPending: mutation.isPending, // ✅ React Query v5 표준
    isError: mutation.isError, // ✅ 상위 훅에서 전달
    isSuccess: mutation.isSuccess, // ✅ 상위 훅에서 전달
    error: mutation.error, // ✅ 상위 훅에서 전달
    data: mutation.data, // ✅ 상위 훅에서 전달
  };
}

// 케이스 업데이트 훅 (Convex 버전)
export function useUpdateClinicalCase() {
  const mutation = useUpdateClinicalCaseConvex();

  const updateCase = useCallback(
    async ({ caseId, updates }: { caseId: string; updates: any }) => {
      try {
        return await mutation.mutateAsync({ caseId, updates });
      } catch (error) {
        console.error('Case update error:', error);
        throw error;
      }
    },
    [mutation]
  );

  return {
    mutate: updateCase,
    mutateAsync: updateCase,
    isLoading: mutation.isLoading, // ✅ 상위 훅에서 전달
    isPending: mutation.isPending, // ✅ React Query v5 표준
    isError: mutation.isError, // ✅ 상위 훅에서 전달
    isSuccess: mutation.isSuccess, // ✅ 상위 훅에서 전달
    error: mutation.error, // ✅ 상위 훅에서 전달
    data: mutation.data, // ✅ 상위 훅에서 전달
  };
}

// 케이스 상태 업데이트 훅 (Convex 버전)
export function useUpdateClinicalCaseStatus() {
  const mutation = useUpdateClinicalCaseStatusConvex();

  const updateStatus = useCallback(
    async ({
      caseId,
      status,
      profileId,
    }: {
      caseId: string;
      status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
      profileId?: string;
    }) => {
      try {
        return await mutation.mutateAsync({ caseId, status });
      } catch (error) {
        console.error('Case status update error:', error);
        throw error;
      }
    },
    [mutation]
  );

  return {
    mutate: updateStatus,
    mutateAsync: updateStatus,
    isLoading: mutation.isLoading, // ✅ 상위 훅에서 전달
    isPending: mutation.isPending, // ✅ React Query v5 표준
    isError: mutation.isError, // ✅ 상위 훅에서 전달
    isSuccess: mutation.isSuccess, // ✅ 상위 훅에서 전달
    error: mutation.error, // ✅ 상위 훅에서 전달
    data: mutation.data, // ✅ 상위 훅에서 전달
  };
}

// 케이스 삭제 훅 (Convex 버전)
export function useDeleteClinicalCase() {
  const mutation = useDeleteClinicalCaseConvex();

  const deleteCase = useCallback(
    async (caseId: string, profileId?: Id<'profiles'>) => {
      // ✅ 타입 수정
      try {
        return await mutation.mutateAsync({ caseId, profileId });
      } catch (error) {
        console.error('Case deletion error:', error);
        throw error;
      }
    },
    [mutation]
  );

  return {
    mutate: deleteCase,
    mutateAsync: deleteCase,
    isLoading: mutation.isLoading, // ✅ 상위 훅에서 전달
    isPending: mutation.isPending, // ✅ React Query v5 표준
    isError: mutation.isError, // ✅ 상위 훅에서 전달
    isSuccess: mutation.isSuccess, // ✅ 상위 훅에서 전달
    error: mutation.error, // ✅ 상위 훅에서 전달
    data: mutation.data, // ✅ 상위 훅에서 전달
  };
}

// ✅ 나머지 함수들은 기존 Convex 기반으로 유지하거나 필요시 추가 마이그레이션
// 현재 clinical photos 페이지에서 주로 사용되는 핵심 함수들만 우선 마이그레이션

// 편의 함수: 고객 케이스 목록 (본인 제외)
export function useCustomerCases(profileId?: string) {
  const result = useClinicalCases(); // ✅ Convex 기반 함수로 변경

  const customerCases = result.data?.filter((c: any) => c.name?.trim() !== '본인') || []; // ✅ 타입 명시

  return {
    data: customerCases,
    isLoading: result.isLoading,
    isPending: result.isPending, // ✅ React Query v5 표준
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
  };
}

// ✅ Step 3.1.3 완료: 전역 훅 파일 Supabase 전환 완료
