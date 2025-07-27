import React from 'react';
import PhotoRoundCarousel from '@/app/shop/clinical-photos/components/PhotoRoundCarousel';
import {
  useClinicalPhotosConvex,
  useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoConvex,
} from '@/lib/clinical-photos-hooks';
import type { PhotoSlot } from '@/types/clinical';
import { LoadingSpinner } from '@/components/ui/loading';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface PhotoSectionProps {
  caseId: string;
  isCompleted?: boolean;
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({ caseId, isCompleted }) => {
  // 사용자 정보 및 프로필 가져오기
  const { user: authUser } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  // Convex 훅을 사용하여 실시간 데이터 로드
  const { data: photos, isLoading } = useClinicalPhotosConvex(caseId);
  const uploadPhoto = useUploadClinicalPhotoConvex();
  const deletePhoto = useDeleteClinicalPhotoConvex();

  if (isLoading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <PhotoRoundCarousel
      caseId={caseId}
      photos={photos || []}
      isCompleted={isCompleted}
      onPhotoUpload={async (round, angle, file) => {
        await uploadPhoto.mutateAsync({
          caseId,
          roundNumber: round,
          angle,
          file,
          profileId: profile?._id, // profileId 추가
        });
        // Convex는 실시간 동기화로 자동 업데이트
      }}
      onPhotoDelete={async (round, angle) => {
        // 해당 사진 ID 찾기
        const photo = photos?.find(p => p.roundDay === round && p.angle === angle);
        if (photo?.photoId) {
          await deletePhoto.mutateAsync(photo.photoId);
        }
        // Convex는 실시간 동기화로 자동 업데이트
      }}
      onPhotosRefresh={() => {
        // Convex는 실시간 동기화로 별도 새로고침 불필요
      }}
    />
  );
};
