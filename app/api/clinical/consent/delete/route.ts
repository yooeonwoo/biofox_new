import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json({ error: 'Storage path가 필요합니다.' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // 1. Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('consent-files')
      .remove([storagePath]);

    if (storageError) {
      console.error('Supabase storage delete error:', storageError);
      // Log the error but proceed to delete from DB to avoid orphaned records.
    }

    // 2. Delete metadata from the database
    const { error: dbError } = await supabase
      .from('consent_files')
      .delete()
      .eq('file_path', storagePath);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json(
        { error: '동의서 메타데이터 삭제에 실패했습니다.', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '동의서가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Consent delete processing error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: '동의서 삭제 처리 중 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    );
  }
}
