/**
 * 임상 케이스별 사진 및 동의서 데이터를 조회하는 훅
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type { PhotoSlot } from '@/types/clinical';

/**
 * 케이스별 임상 사진 조회 훅
 */
export function useCasePhotos(caseId: string | null) {
  const photos = useQuery(
    api.fileStorage.getClinicalPhotos,
    caseId ? { clinical_case_id: caseId as Id<'clinical_cases'> } : 'skip'
  );

  // PhotoSlot 형태로 변환
  const photoSlots: PhotoSlot[] =
    photos?.map(photo => ({
      id: photo._id,
      roundDay: photo.session_number,
      angle: photo.photo_type,
      uploaded: true,
      imageUrl: photo.url,
      url: photo.url,
      file_path: photo.file_path,
      created_at: photo.created_at,
      session_number: photo.session_number,
      photo_type: photo.photo_type,
    })) || [];

  return {
    photos: photoSlots,
    isLoading: photos === undefined && caseId !== null,
  };
}

/**
 * 케이스별 동의서 파일 조회 훅
 */
export function useCaseConsentFile(caseId: string | null) {
  const consentFile = useQuery(
    api.fileStorage.getConsentFile,
    caseId ? { clinical_case_id: caseId as Id<'clinical_cases'> } : 'skip'
  );

  return {
    consentFile,
    isLoading: consentFile === undefined && caseId !== null,
  };
}

/**
 * 케이스별 모든 파일 데이터 조회 훅 (사진 + 동의서)
 */
export function useCaseFiles(caseId: string | null) {
  const { photos, isLoading: photosLoading } = useCasePhotos(caseId);
  const { consentFile, isLoading: consentLoading } = useCaseConsentFile(caseId);

  return {
    photos,
    consentFile,
    isLoading: photosLoading || consentLoading,
  };
}
