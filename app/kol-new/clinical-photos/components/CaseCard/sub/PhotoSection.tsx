import React, { useEffect, useState, useCallback } from 'react';
import PhotoRoundCarousel from '@/app/kol-new/clinical-photos/components/PhotoRoundCarousel';
import type { PhotoSlot } from '@/types/clinical';
import { usePhotoManagement } from '@/app/kol-new/clinical-photos/hooks/usePhotoManagement';
import { LoadingSpinner } from '@/components/ui/loading';
import { useClinicalPhotos } from '@/lib/clinical-photos-convex';

interface PhotoSectionProps {
  caseId: string;
  isCompleted?: boolean;
  profileId?: string;
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({ caseId, isCompleted, profileId }) => {
  const { data: photos = [], isLoading: loading, refetch: loadPhotos } = useClinicalPhotos(caseId);
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
        await loadPhotos();
      }}
      onPhotoDelete={async photoId => {
        await handlePhotoDelete(String(photoId));
        await loadPhotos();
      }}
      onPhotosRefresh={loadPhotos}
    />
  );
};
