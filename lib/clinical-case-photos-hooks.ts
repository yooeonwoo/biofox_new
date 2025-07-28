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
    photos?.map(photo => {
      console.log('[useCasePhotos] Photo data:', {
        id: photo._id,
        file_path: photo.file_path,
        url: photo.url,
        hasUrl: !!photo.url,
        urlType: typeof photo.url,
      });

      // URL 생성 로직
      let imageUrl = photo.url;

      if (!imageUrl && photo.file_path) {
        // 프로덕션 환경 감지
        const isProduction =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'biofoxnew.vercel.app' ||
            window.location.hostname.includes('vercel.app'));

        // 환경에 따른 Convex URL 설정
        const convexSiteUrl = isProduction
          ? 'https://aware-rook-16.convex.site'
          : process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') ||
            'https://quiet-dog-358.convex.site';

        imageUrl = `${convexSiteUrl}/storage/${photo.file_path}`;

        console.warn(
          `[useCasePhotos] Using HTTP endpoint for photo ${photo._id}, URL: ${imageUrl}`
        );
      }

      return {
        id: photo._id,
        roundDay: photo.session_number,
        angle: photo.photo_type,
        uploaded: true,
        imageUrl: imageUrl,
        url: photo.url,
        file_path: photo.file_path,
        created_at: photo.created_at,
        session_number: photo.session_number,
        photo_type: photo.photo_type,
      };
    }) || [];

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
