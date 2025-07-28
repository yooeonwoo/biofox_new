import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  CLINICAL_PHOTOS_BUCKET,
  deleteFile,
} from '@/lib/supabase-storage';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json({ error: 'Storage path가 필요합니다.' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabase = createSupabaseServerClient();

    // 파일 삭제
    await deleteFile(supabase, storagePath);

    return NextResponse.json({
      success: true,
      message: '파일이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: '파일 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
