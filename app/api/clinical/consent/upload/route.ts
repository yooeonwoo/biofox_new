import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string; // This is supabaseUserId (UUID)
    const caseId = formData.get('caseId') as string; // This is clinical_cases.id (UUID)

    if (!file || !profileId || !caseId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // 1. Find the profile's primary key using the supabaseUserId
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('supabaseUserId', profileId)
      .single();

    if (profileError || !profileData) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }
    const profilePkId = profileData.id;

    // 2. Upload file to Supabase Storage
    const storagePath = `consent_files/${profilePkId}/${caseId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('consent-files') // bucket name
      .upload(storagePath, file, {
        contentType: file.type || 'application/pdf',
        upsert: true, // Overwrite if file exists
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { error: '동의서 파일 스토리지 업로드에 실패했습니다.', details: uploadError.message },
        { status: 500 }
      );
    }

    // 3. Insert metadata into the database
    const { data: insertedData, error: dbError } = await supabase
      .from('consent_files')
      .insert({
        clinical_case_id: caseId,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: profilePkId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // If DB insert fails, delete the orphaned file from storage
      await supabase.storage.from('consent-files').remove([storagePath]);
      return NextResponse.json(
        { error: '동의서 메타데이터 저장에 실패했습니다.', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileData: insertedData,
      message: '동의서가 성공적으로 업로드되었습니다.',
    });
  } catch (error) {
    console.error('Consent upload processing error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: '동의서 업로드 처리 중 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    );
  }
}
