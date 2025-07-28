import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export function useUploadClinicalPhotoSupabase() {
  const [isUploading, setIsUploading] = useState(false);
  const saveClinicalPhoto = useMutation(api.fileStorage.saveClinicalPhoto);

  const uploadPhoto = async (
    file: File,
    clinical_case_id: string,
    session_number: number,
    photo_type: 'front' | 'left_side' | 'right_side',
    profileId: string
  ) => {
    setIsUploading(true);
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileId', profileId);
      formData.append('caseId', clinical_case_id);
      formData.append('sessionNumber', session_number.toString());
      formData.append('photoType', photo_type);

      // Supabase Storage에 업로드
      const response = await fetch('/api/clinical-photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '업로드 실패');
      }

      const { storagePath, publicUrl } = await response.json();

      // Convex에 메타데이터 저장 (Supabase Storage 경로 저장)
      await saveClinicalPhoto({
        storageId: storagePath as Id<'_storage'>, // Storage 경로를 ID처럼 사용
        clinical_case_id: clinical_case_id as Id<'clinical_cases'>,
        session_number,
        photo_type,
        file_size: file.size,
        profileId: profileId as Id<'profiles'> | undefined,
      });

      toast.success('사진이 업로드되었습니다.');
      return { storagePath, publicUrl };
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('사진 업로드에 실패했습니다.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadPhoto, isUploading };
}

export function useDeleteClinicalPhotoSupabase() {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteClinicalPhoto = useMutation(api.fileStorage.deleteClinicalPhoto);

  const deletePhoto = async (photoId: Id<'clinical_photos'>, storagePath: string) => {
    setIsDeleting(true);
    try {
      // Supabase Storage에서 삭제
      const response = await fetch(
        `/api/clinical-photos/delete?path=${encodeURIComponent(storagePath)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '삭제 실패');
      }

      // Convex에서 메타데이터 삭제
      await deleteClinicalPhoto({ photoId });

      toast.success('사진이 삭제되었습니다.');
    } catch (error) {
      console.error('Photo delete error:', error);
      toast.error('사진 삭제에 실패했습니다.');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePhoto, isDeleting };
}
