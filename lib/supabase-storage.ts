import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase 서버 클라이언트 생성 (SSR용)
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// Storage 버킷 이름
export const CLINICAL_PHOTOS_BUCKET = 'clinical-photos';

// 이미지 업로드 경로 생성
export function getStoragePath(
  profileId: string,
  caseId: string,
  sessionNumber: number,
  photoType: string
) {
  return `${profileId}/${caseId}/${sessionNumber}/${photoType}-${Date.now()}.jpg`;
}

// Public URL 가져오기
export function getPublicUrl(supabase: any, path: string) {
  const { data } = supabase.storage.from(CLINICAL_PHOTOS_BUCKET).getPublicUrl(path);

  return data?.publicUrl || null;
}

// 파일 삭제
export async function deleteFile(supabase: any, path: string) {
  const { error } = await supabase.storage.from(CLINICAL_PHOTOS_BUCKET).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }

  return true;
}
