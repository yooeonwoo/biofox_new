import {
  useUploadClinicalPhotoSupabase as useUploadClinicalPhoto,
  useDeleteClinicalPhotoSupabase as useDeleteClinicalPhoto,
  useClinicalPhotosSupabase as useClinicalPhotos,
} from '@/lib/clinical-photos-supabase-hooks';

/**
 * 사진 업로드 / 삭제 로직을 공통화한 훅 - Convex 기반 구현
 * 기존 더미 함수들을 실제 Convex 뮤테이션으로 교체
 */
export const usePhotoManagement = (profileId?: string) => {
  const uploadPhoto = useUploadClinicalPhoto();
  const deletePhoto = useDeleteClinicalPhoto();

  const handlePhotoUpload = async (
    caseId: string,
    roundDay: number,
    angle: 'front' | 'left' | 'right',
    file: File
  ) => {
    try {
      const result = await uploadPhoto.mutateAsync({
        caseId,
        roundNumber: roundDay,
        angle,
        file,
        profileId,
      });
      return result;
    } catch (error) {
      console.error('사진 업로드 실패', error);
      throw error;
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId);
    } catch (error) {
      console.error('사진 삭제 실패', error);
      throw error;
    }
  };

  return {
    handlePhotoUpload,
    handlePhotoDelete,
    isUploading: uploadPhoto.isPending,
    isDeleting: deletePhoto.isPending,
  };
};
