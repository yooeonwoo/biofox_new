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
  const { profile } = useAuth();
  // Query: 케이스 목록 조회
  const casesQuery = useQuery(
    api.clinical.listClinicalCases,
    profileId
      ? {
          profileId,
          paginationOpts: {
            numItems: 100,
            cursor: null,
          },
        }
      : 'skip'
  );

  // Mutations
  const createCaseMutation = useMutation(api.clinical.createClinicalCase);
  const updateCaseMutation = useMutation(api.clinical.updateClinicalCase);
  const deleteCaseMutation = useMutation(api.clinical.deleteClinicalCase);
  const updateCaseStatusMutation = useMutation(api.clinical.updateClinicalCaseStatus);
  const saveRoundCustomerInfoMutation = useMutation(api.clinical.saveRoundCustomerInfo);

  // Photo mutations
  const uploadPhotoMutation = useMutation(api.fileStorage.saveClinicalPhoto);
  const deletePhotoMutation = useMutation(api.fileStorage.deleteClinicalPhoto);
  const generateUploadUrlMutation = useMutation(api.fileStorage.generateUploadUrl);

  // Consent mutations
  const saveConsentFileMutation = useMutation(api.fileStorage.saveConsentFile);
  const deleteConsentFileMutation = useMutation(api.fileStorage.deleteConsentFile);

  // 케이스 목록을 ClinicalCase 형태로 변환
  const transformCases = (rawCases: any[]): ClinicalCase[] => {
    return rawCases.map(caseItem => ({
      id: caseItem._id, // ClinicalCase 타입이 요구하는 id 속성
      _id: caseItem._id, // Convex ID 유지
      shop_id: caseItem.shop_id,
      case_title: caseItem.case_title,
      name: caseItem.name || '새 고객',
      age: caseItem.age,
      gender: caseItem.gender,
      status:
        caseItem.status === 'in_progress'
          ? 'active'
          : caseItem.status === 'completed'
            ? 'completed'
            : caseItem.status || 'active',
      consent_status: caseItem.consent_status,
      marketing_consent: caseItem.marketing_consent,
      consent_date: caseItem.consent_date,
      subject_type: caseItem.subject_type,
      treatment_item: caseItem.treatment_item,
      concern_area: caseItem.concern_area,
      treatment_plan: caseItem.treatment_plan,
      notes: caseItem.notes,
      tags: caseItem.tags,
      metadata: caseItem.metadata,
      photo_count: caseItem.photo_count,
      latest_session: caseItem.latest_session,
      start_date: caseItem.start_date,
      updated_at: caseItem.updated_at,
      created_at: caseItem.created_at,
      createdAt: caseItem.created_at
        ? new Date(caseItem.created_at).toISOString()
        : new Date().toISOString(), // ClinicalCase 타입이 요구하는 createdAt
      consentReceived: caseItem.consent_status === 'consented',
      consentImageUrl: caseItem.consentImageUrl,
      customerName: caseItem.name || '새 고객',
      customerInfo: {
        name: caseItem.name || '',
        gender: caseItem.gender,
        age: caseItem.age,
        products: [],
        skinTypes: [],
      },
      roundCustomerInfo: caseItem.roundCustomerInfo || {},
      photos: caseItem.photos || [],
      // 제품 체크박스 필드들
      cureBooster: false,
      cureMask: false,
      premiumMask: false,
      allInOneSerum: false,
      // 피부 타입 체크박스 필드들
      skinRedSensitive: false,
      skinPigment: false,
      skinPore: false,
      skinTrouble: false,
      skinWrinkle: false,
      skinEtc: false,
    }));
  };

  // Actions
  const actions = {
    // 케이스 생성
    createCase: async (params: {
      name?: string;
      age?: number;
      gender?: 'male' | 'female' | 'other';
      subject_type: 'self' | 'customer';
      consent_status?: 'no_consent' | 'consented' | 'pending';
    }) => {
      try {
        const result = await createCaseMutation({
          profileId: profileId!,
          ...params,
        });
        toast.success('케이스가 생성되었습니다');
        return result;
      } catch (error) {
        toast.error('케이스 생성 실패');
        throw error;
      }
    },

    // 케이스 업데이트
    updateCase: async (params: {
      caseId: Id<'clinical_cases'>;
      updates: Partial<{
        name?: string;
        age?: number;
        gender?: 'male' | 'female' | 'other';
        consent_status?: 'no_consent' | 'consented' | 'pending';
        status?: 'in_progress' | 'completed' | 'paused' | 'cancelled';
      }>;
    }) => {
      try {
        await updateCaseMutation({
          caseId: params.caseId,
          profileId,
          updates: params.updates,
        });
        toast.success('케이스가 업데이트되었습니다');
      } catch (error) {
        toast.error('케이스 업데이트 실패');
        throw error;
      }
    },

    // 케이스 상태 변경
    updateCaseStatus: async (params: {
      caseId: Id<'clinical_cases'>;
      status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
    }) => {
      try {
        await updateCaseStatusMutation({
          caseId: params.caseId,
          profileId,
          status: params.status,
        });
        toast.success('상태가 변경되었습니다');
      } catch (error) {
        toast.error('상태 변경 실패');
        throw error;
      }
    },

    // 케이스 삭제
    deleteCase: async (params: { caseId: Id<'clinical_cases'> }) => {
      try {
        await deleteCaseMutation({
          caseId: params.caseId,
          profileId,
        });
        toast.success('케이스가 삭제되었습니다');
      } catch (error) {
        toast.error('케이스 삭제 실패');
        throw error;
      }
    },

    // 회차별 고객 정보 저장
    saveRoundCustomerInfo: async (params: {
      caseId: Id<'clinical_cases'>;
      roundNumber: number;
      info: {
        treatmentDate?: string;
        treatmentType?: string;
        products?: string[];
        skinTypes?: string[];
        memo?: string;
      };
    }) => {
      try {
        await saveRoundCustomerInfoMutation({
          caseId: params.caseId,
          profileId,
          roundNumber: params.roundNumber,
          info: params.info,
        });
      } catch (error) {
        console.error('회차 정보 저장 실패:', error);
        // Silent fail - 자동 저장이므로 에러 토스트를 띄우지 않음
      }
    },

    // 사진 업로드 (Supabase Storage 사용)
    uploadPhoto: async (params: {
      caseId: Id<'clinical_cases'>;
      roundDay: number;
      angle: string;
      file: File;
    }) => {
      try {
        // FormData 생성
        const formData = new FormData();
        formData.append('file', params.file);
        formData.append('profileId', profileId as string);
        formData.append('caseId', params.caseId);
        formData.append('sessionNumber', params.roundDay.toString());

        // angle 변환
        const photoType =
          params.angle === 'front'
            ? 'front'
            : params.angle === 'left' || params.angle === 'leftSide' || params.angle === 'left_side'
              ? 'left_side'
              : 'right_side';

        formData.append('photoType', photoType);

        // Supabase Storage에 업로드
        const uploadResponse = await fetch('/api/clinical-photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || '업로드 실패');
        }

        const { storagePath, publicUrl } = await uploadResponse.json();

        // Convex에 메타데이터 저장 (Supabase Storage 경로 저장)
        await uploadPhotoMutation({
          clinical_case_id: params.caseId,
          session_number: params.roundDay,
          photo_type: photoType as 'front' | 'left_side' | 'right_side',
          storageId: storagePath as Id<'_storage'>, // Storage 경로를 ID처럼 사용
          profileId, // string으로 그대로 전달
          file_size: params.file.size,
        });

        toast.success('사진이 업로드되었습니다');
      } catch (error) {
        console.error('Photo upload error:', error);
        toast.error('사진 업로드 실패');
        throw error;
      }
    },

    // 사진 삭제 (Supabase Storage에서도 삭제)
    deletePhoto: async (params: { photoId: Id<'clinical_photos'>; storagePath?: string }) => {
      try {
        // Supabase Storage에서 삭제
        if (params.storagePath) {
          const deleteResponse = await fetch(
            `/api/clinical-photos/delete?path=${encodeURIComponent(params.storagePath)}`,
            {
              method: 'DELETE',
            }
          );

          if (!deleteResponse.ok) {
            console.error('Failed to delete from Supabase storage');
          }
        }

        // Convex에서 메타데이터 삭제
        await deletePhotoMutation({
          photoId: params.photoId,
        });
        toast.success('사진이 삭제되었습니다');
      } catch (error) {
        toast.error('사진 삭제 실패');
        throw error;
      }
    },

    // 동의서 업로드
    uploadConsent: async (params: { caseId: Id<'clinical_cases'>; file: File }) => {
      try {
        // 1. Upload URL 생성
        const uploadData = (await generateUploadUrlMutation()) as any;

        // 2. 파일 업로드
        const response = await fetch(uploadData.uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': params.file.type,
          },
          body: params.file,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        // 3. 메타데이터 저장
        await saveConsentFileMutation({
          clinical_case_id: params.caseId,
          storageId: uploadData.storageId,
          file_name: params.file.name,
          file_size: params.file.size,
          file_type: params.file.type,
          profileId,
        });

        toast.success('동의서가 업로드되었습니다');
      } catch (error) {
        toast.error('동의서 업로드 실패');
        throw error;
      }
    },
  };

  // Data
  const data = {
    cases: casesQuery ? transformCases(casesQuery.page || []) : [],
    isLoading: casesQuery === undefined,
    error: casesQuery === null ? new Error('Failed to load cases') : null,
  };

  return {
    data,
    actions,
  };
}
