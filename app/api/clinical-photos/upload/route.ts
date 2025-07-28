import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  CLINICAL_PHOTOS_BUCKET,
  getStoragePath,
  getPublicUrl,
} from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string;
    const caseId = formData.get('caseId') as string;
    const sessionNumber = parseInt(formData.get('sessionNumber') as string);
    const photoType = formData.get('photoType') as string;

    if (!file || !profileId || !caseId || !photoType) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabase = createSupabaseServerClient();

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage 경로 생성
    const storagePath = getStoragePath(profileId, caseId, sessionNumber, photoType);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(CLINICAL_PHOTOS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    // Public URL 가져오기
    const publicUrl = getPublicUrl(supabase, storagePath);

    return NextResponse.json({
      success: true,
      storagePath,
      publicUrl,
      data,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
