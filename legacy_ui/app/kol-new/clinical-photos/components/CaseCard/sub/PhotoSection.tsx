import React, { useEffect, useState, useCallback } from 'react';
import PhotoRoundCarousel from '@/app/kol-new/clinical-photos/components/PhotoRoundCarousel';
import { fetchPhotos } from '@/lib/clinical-photos-api';
import type { PhotoSlot } from '@/lib/clinical-photos';
import { usePhotoManagement } from '@/app/kol-new/clinical-photos/hooks/usePhotoManagement';
import { LoadingSpinner } from '@/components/ui/loading';

interface PhotoSectionProps {
  caseId: number;
  isCompleted?: boolean;
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({ caseId, isCompleted }) => {
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { handlePhotoUpload, handlePhotoDelete } = usePhotoManagement();

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPhotos(caseId);
      setPhotos(data);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  if (loading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <PhotoRoundCarousel
      caseId={String(caseId)}
      photos={photos}
      isCompleted={isCompleted}
      onPhotoUpload={async (round, angle, file) => {
        await handlePhotoUpload(caseId, round, angle as any, file);
        await loadPhotos();
      }}
      onPhotoDelete={async (round, angle) => {
        await handlePhotoDelete(caseId, round, angle as any);
        await loadPhotos();
      }}
      onPhotosRefresh={loadPhotos}
    />
  );
}; 