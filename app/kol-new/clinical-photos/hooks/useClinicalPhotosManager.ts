/**
 * Clinical Photos 중앙 데이터 관리 훅
 * 모든 Convex 데이터 로직을 단일 창구로 캡슐화
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import type { ClinicalCase } from '@/types/clinical'; // 표준 타입 import
import { useAuth } from '@/hooks/useAuth';

interface UseClinicalPhotosManagerProps {
  profileId?: Id<'profiles'>;
}

export function useClinicalPhotosManager({ profileId }: UseClinicalPhotosManagerProps) {
  const { user, profile } = useAuth();
  // Query: 케이스 목록 조회 (Convex는 유지)
  const casesQuery = useQuery(
    api.clinical.listClinicalCases,
    profile?._id
      ? {
          profileId: profile._id,
          paginationOpts: {
            numItems: 100,
            cursor: null,
          },
        }
      : 'skip'
  );

  // Mutations (Convex 부분은 유지)
  const createCaseMutation = useMutation(api.clinical.createClinicalCase);
  const updateCaseMutation = useMutation(api.clinical.updateClinicalCase);
  const deleteCaseMutation = useMutation(api.clinical.deleteClinicalCase);
  const updateCaseStatusMutation = useMutation(api.clinical.updateClinicalCaseStatus);
  const saveRoundCustomerInfoMutation = useMutation(api.clinical.saveRoundCustomerInfo);

  const actions = {
    // ... (기존 케이스 관련 액션들은 그대로 유지)
    createCase: async (params: any) => {
      if (!profile?._id) throw new Error('Profile not loaded');
      return await createCaseMutation({ ...params, profileId: profile._id });
    },
    updateCase: async (params: any) => {
      if (!profile?._id) throw new Error('Profile not loaded');
      return await updateCaseMutation({ ...params, profileId: profile._id });
    },
    deleteCase: async (params: any) => {
      if (!profile?._id) throw new Error('Profile not loaded');
      return await deleteCaseMutation({ ...params, profileId: profile._id });
    },
    updateCaseStatus: async (params: any) => {
      if (!profile?._id) throw new Error('Profile not loaded');
      return await updateCaseStatusMutation({ ...params, profileId: profile._id });
    },
    saveRoundCustomerInfo: async (params: any) => {
      if (!profile?._id) throw new Error('Profile not loaded');
      return await saveRoundCustomerInfoMutation({ ...params, profileId: profile._id });
    },

    // 사진 업로드 (Supabase API 호출로 변경)
    uploadPhoto: async (params: {
      caseId: Id<'clinical_cases'>;
      roundNumber: number; // roundDay -> roundNumber로 통일
      angle: string;
      file: File;
    }) => {
      if (!user?.id) {
        toast.error('인증 정보가 없습니다. 다시 로그인해주세요.');
        throw new Error('User not authenticated');
      }
      try {
        const formData = new FormData();
        formData.append('file', params.file);
        formData.append('profileId', user.id); // Supabase Auth User ID
        formData.append('caseId', params.caseId);
        formData.append('sessionNumber', params.roundNumber.toString());

        const photoType =
          params.angle === 'front'
            ? 'front'
            : params.angle.includes('left')
              ? 'left_side'
              : 'right_side';
        formData.append('photoType', photoType);

        const response = await fetch('/api/clinical-photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '사진 업로드에 실패했습니다.');
        }

        toast.success('사진이 업로드되었습니다');
        // Convex 쿼리가 실시간으로 업데이트되므로 별도의 상태 업데이트는 불필요.
        // 필요하다면 react-query의 invalidateQueries 등을 사용할 수 있음.
      } catch (error) {
        console.error('Photo upload error:', error);
        toast.error(error instanceof Error ? error.message : '사진 업로드 실패');
        throw error;
      }
    },

    // 사진 삭제 (Supabase API 호출로 변경)
    deletePhoto: async (params: { photoId: Id<'clinical_photos'>; storagePath: string }) => {
      try {
        const response = await fetch(
          `/api/clinical-photos/delete?path=${encodeURIComponent(params.storagePath)}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '사진 삭제에 실패했습니다.');
        }

        toast.success('사진이 삭제되었습니다');
        // Convex 쿼리가 실시간으로 업데이트되므로 별도의 상태 업데이트는 불필요.
      } catch (error) {
        console.error('Photo delete error:', error);
        toast.error(error instanceof Error ? error.message : '사진 삭제 실패');
        throw error;
      }
    },

    // 동의서 업로드 (Supabase API 호출로 변경)
    uploadConsent: async (params: { caseId: Id<'clinical_cases'>; file: File }) => {
      if (!user?.id) {
        toast.error('인증 정보가 없습니다. 다시 로그인해주세요.');
        throw new Error('User not authenticated');
      }
      try {
        const formData = new FormData();
        formData.append('file', params.file);
        formData.append('profileId', user.id); // Supabase Auth User ID
        formData.append('caseId', params.caseId);

        const response = await fetch('/api/clinical/consent/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '동의서 업로드에 실패했습니다.');
        }

        toast.success('동의서가 업로드되었습니다');
      } catch (error) {
        console.error('Consent upload error:', error);
        toast.error(error instanceof Error ? error.message : '동의서 업로드 실패');
        throw error;
      }
    },

    // 동의서 삭제 (Supabase API 호출로 추가)
    deleteConsent: async (params: { storagePath: string }) => {
      try {
        const response = await fetch(
          `/api/clinical/consent/delete?path=${encodeURIComponent(params.storagePath)}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '동의서 삭제에 실패했습니다.');
        }

        toast.success('동의서가 삭제되었습니다');
      } catch (error) {
        console.error('Consent delete error:', error);
        toast.error(error instanceof Error ? error.message : '동의서 삭제 실패');
        throw error;
      }
    },
  };

  // Data
  const data = {
    cases: casesQuery?.page || [],
    isLoading: casesQuery === undefined,
    error: casesQuery === null ? new Error('Failed to load cases') : null,
  };

  return {
    data,
    actions,
  };
}
