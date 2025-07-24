/**
 * Shop용 임상사진 업로드 API Route (Convex 기반)
 * KOL용 API Route와 동일한 구조로 마이그레이션됨
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// angle 값을 Convex photo_type으로 매핑
function mapAngleToPhotoType(angle: string): 'front' | 'left_side' | 'right_side' {
  switch (angle.toLowerCase()) {
    case 'front':
      return 'front';
    case 'left':
    case 'left_side':
      return 'left_side';
    case 'right':
    case 'right_side':
      return 'right_side';
    default:
      throw new Error(`Invalid angle: ${angle}. Must be 'front', 'left', or 'right'`);
  }
}

// POST: 이미지 파일 업로드 (Convex 3단계 프로세스)
export async function POST(request: NextRequest) {
  try {
    console.log('Convex Shop Upload API called');

    const authResult = await checkAuthSupabase();
    const userId = authResult.user?.id;
    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', userId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const type = formData.get('type') as string; // 'photo' or 'consent'
    const roundNumber = formData.get('roundNumber') as string;
    const angle = formData.get('angle') as string;

    console.log('Upload params:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      caseId,
      type,
      roundNumber,
      angle,
    });

    // 필수 필드 검증
    if (!file || !caseId) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'File and caseId are required' }, { status: 400 });
    }

    if (type === 'photo' && (!roundNumber || !angle)) {
      return NextResponse.json(
        { error: 'roundNumber and angle are required for photo uploads' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
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

    // 🚀 Step 3: 메타데이터 저장 및 비즈니스 로직 처리
    console.log('Step 3: Saving metadata to Convex...');

    try {
      let saveResult;

      if (type === 'photo') {
        // angle을 photo_type으로 변환
        const photoType = mapAngleToPhotoType(angle);

        // 임상 사진 저장
        saveResult = await convex.mutation(api.fileStorage.saveClinicalPhoto, {
          storageId,
          clinical_case_id: caseId as Id<'clinical_cases'>,
          session_number: parseInt(roundNumber),
          photo_type: photoType,
          file_size: file.size,
        });

        console.log('Clinical photo metadata saved:', saveResult);
      } else if (type === 'consent') {
        // 동의서 파일 저장
        saveResult = await convex.mutation(api.fileStorage.saveConsentFile, {
          storageId,
          clinical_case_id: caseId as Id<'clinical_cases'>,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        });

        console.log('Consent file metadata saved:', saveResult);
      } else {
        throw new Error(`Unsupported file type: ${type}`);
      }

      // 파일 URL 생성
      const fileUrl = await convex.query(api.fileStorage.getFileUrl, {
        storageId,
      });

      console.log('File URL generated:', fileUrl);

      return NextResponse.json({
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageId,
        savedId: saveResult, // 저장된 레코드 ID 반환 (삭제 시 사용)
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
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 이미지 파일 삭제 (Convex 기반)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await checkAuthSupabase();
    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get('storageId');
    const caseId = searchParams.get('caseId');
    const type = searchParams.get('type'); // 'photo' or 'consent'

    if (!storageId || !caseId || !type) {
      return NextResponse.json(
        { error: 'storageId, caseId, and type are required' },
        { status: 400 }
      );
    }

    console.log('Deleting file:', { storageId, caseId, type });

    // TODO: 파일 삭제 로직 구현 필요
    // Convex에서는 caseId로 직접 삭제할 수 없으므로, 다음 단계가 필요:
    // 1. caseId로 해당 photo/consent 레코드 조회
    // 2. 조회된 레코드의 ID로 삭제 함수 호출
    //
    // 현재는 기본 응답만 반환 (임시)
    console.warn('File deletion not yet implemented for Convex backend');

    return NextResponse.json({
      success: true,
      message: 'File deletion feature will be implemented in next phase',
    });

    console.log('File deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
