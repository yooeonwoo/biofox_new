/**
 * Clinical용 동의서 업로드 API Route (Convex 기반)
 * Supabase에서 Convex로 마이그레이션됨
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    console.log('Clinical Consent Upload API called');

    // 인증 체크
    const authResult = await checkAuthSupabase();
    const userId = authResult.user?.id;
    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', userId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clinical_case_id = formData.get('clinical_case_id') as string;

    console.log('Upload params:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      clinical_case_id,
    });

    if (!file || !clinical_case_id) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // 파일 타입 체크
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 🚀 Step 1: Convex에서 업로드 URL 생성
    console.log('Step 1: Generating upload URL from Convex...');
    const uploadUrl = await convex.mutation(api.fileStorage.generateSecureUploadUrl);

    console.log('Upload URL generated:', uploadUrl);

    // 🚀 Step 2: 클라이언트에서 Convex Storage로 직접 업로드
    console.log('Step 2: Uploading file to Convex Storage...');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Convex upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: `File upload failed: ${uploadResponse.statusText}` },
        { status: 500 }
      );
    }

    const { storageId } = await uploadResponse.json();
    console.log('File uploaded successfully, storageId:', storageId);

    // 🚀 Step 3: 메타데이터 저장
    console.log('Step 3: Saving metadata to Convex...');

    try {
      // 동의서 파일 저장
      const saveResult = await convex.mutation(api.fileStorage.saveConsentFile, {
        storageId,
        clinical_case_id: clinical_case_id as Id<'clinical_cases'>,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });

      console.log('Consent file metadata saved:', saveResult);

      // 파일 URL 생성
      const fileUrl = await convex.query(api.fileStorage.getFileUrl, {
        storageId,
      });

      console.log('File URL generated:', fileUrl);

      return NextResponse.json({
        data: {
          id: saveResult,
          clinical_case_id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_date: new Date().toISOString(),
          url: fileUrl,
        },
      });
    } catch (metadataError) {
      console.error('Metadata save failed:', metadataError);

      // TODO: 메타데이터 저장 실패 시 Storage 정리 로직 구현 필요
      console.warn(
        'File uploaded to storage but metadata save failed. Manual cleanup may be required for storageId:',
        storageId
      );

      return NextResponse.json(
        { error: `Failed to save file metadata: ${metadataError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Consent upload error:', error);
    return NextResponse.json({ error: 'Failed to upload consent file' }, { status: 500 });
  }
}
