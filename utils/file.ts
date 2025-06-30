/**
 * 파일이 이미지인지 확인
 */
export const isImage = (file: File): boolean => {
  return /^image\//.test(file.type);
};

/**
 * 파일 크기를 MB 단위로 반환
 */
export const getFileSizeMB = (file: File): string => {
  return (file.size / 1024 / 1024).toFixed(2);
};

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 허용된 이미지 파일 확장자 목록
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * 파일 타입이 허용된 이미지 타입인지 확인
 */
export const isAllowedImageType = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
};

/**
 * 파일을 Data URL로 읽기
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}; 