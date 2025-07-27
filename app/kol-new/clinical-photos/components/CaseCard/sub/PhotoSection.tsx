import React, { useEffect, useState, useCallback } from 'react';
import PhotoRoundCarousel from '@/app/kol-new/clinical-photos/components/PhotoRoundCarousel';
import type { PhotoSlot } from '@/types/clinical';
import { usePhotoManagement } from '@/app/kol-new/clinical-photos/hooks/usePhotoManagement';
import { LoadingSpinner } from '@/components/ui/loading';
import { useClinicalPhotos } from '@/hooks/useClinicalCases';

interface PhotoSectionProps {
  caseId: string;
  isCompleted?: boolean;
  profileId?: string;
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({ caseId, isCompleted, profileId }) => {
  const { data: photos = [], isLoading: loading } = useClinicalPhotos(caseId);
  const { handlePhotoUpload, handlePhotoDelete } = usePhotoManagement(profileId);

  if (loading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <PhotoRoundCarousel
      caseId={caseId}
      photos={photos}
      isCompleted={isCompleted}
      onPhotoUpload={async (round, angle, file) => {
        await handlePhotoUpload(caseId, round, angle as 'front' | 'left' | 'right', file);
        // React Query의 캐시 무효화가 자동으로 처리됨
      }}
      onPhotoDelete={async photoId => {
        await handlePhotoDelete(String(photoId));
        // React Query의 캐시 무효화가 자동으로 처리됨
      }}
      onPhotosRefresh={() => {
        // React Query의 자동 무효화로 인해 별도 refetch 불필요
      }}
    />
  );
};
