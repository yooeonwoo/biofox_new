import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase-storage';

// 동의서 전용 버킷
const CONSENT_FILES_BUCKET = 'consent-files';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string;
    const caseId = formData.get('caseId') as string;

    if (!file || !profileId || !caseId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabase = createSupabaseServerClient();

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage 경로 생성 (동의서는 케이스별로 하나만)
    const storagePath = `${profileId}/${caseId}/consent-${Date.now()}.${file.name.split('.').pop()}`;

    // 기존 동의서 파일 삭제 (있다면)
    const { data: existingFiles } = await supabase.storage
      .from(CONSENT_FILES_BUCKET)
      .list(`${profileId}/${caseId}`);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${profileId}/${caseId}/${f.name}`);
      await supabase.storage.from(CONSENT_FILES_BUCKET).remove(filesToDelete);
    }

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(CONSENT_FILES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/pdf',
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
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      data,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
