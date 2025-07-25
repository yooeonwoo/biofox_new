import { uploadPhoto, deletePhoto } from '@/lib/clinical-photos';

/**
 * 사진 업로드 / 삭제 로직을 공통화한 훅
 * 비즈니스 로직(VALIDATION, S3 Path 등)은 여기에 모아둔다.
 */
export const usePhotoManagement = () => {
  const handlePhotoUpload = async (
    caseId: number,
    roundDay: number,
    angle: 'front' | 'left' | 'right',
    file: File
  ) => {
    try {
      const url = await uploadPhoto(caseId, roundDay, angle, file);
      return url;
    } catch (error) {
      // TODO: toast 처리 공통화
      console.error('사진 업로드 실패', error);
      throw error;
    }
  };

  const handlePhotoDelete = async (
    caseId: number,
    roundDay: number,
    angle: 'front' | 'left' | 'right'
  ) => {
    try {
      await deletePhoto(caseId, roundDay, angle);
    } catch (error) {
      console.error('사진 삭제 실패', error);
      throw error;
    }
  };

  return { handlePhotoUpload, handlePhotoDelete };
};
