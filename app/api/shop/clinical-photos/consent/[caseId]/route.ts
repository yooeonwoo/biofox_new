/**
 * Shop용 임상사진 동의서 삭제 API Route (Convex 기반)
 * Supabase에서 Convex로 마이그레이션됨
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// DELETE: 동의서 파일 삭제
export async function DELETE(request: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    console.log('Clinical Consent Delete API called');

    const authResult = await checkAuthSupabase();
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.user.id;

    const caseId = params.caseId;

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    console.log('Deleting consent files for case:', caseId);

    try {
      // Convex에서 해당 케이스의 동의서 파일 조회
      const consentFile = await convex.query(api.fileStorage.getConsentFile, {
        clinical_case_id: caseId as Id<'clinical_cases'>,
      });

      if (!consentFile) {
        console.log('No consent file found for case:', caseId);
        return NextResponse.json({
          success: true,
          message: 'No consent file found to delete',
        });
      }

      // Convex에서 동의서 파일 삭제 (Storage + DB)
      await convex.mutation(api.fileStorage.deleteConsentFile, {
        consentId: consentFile._id,
      });

      console.log('Consent file deleted successfully for case:', caseId);

      return NextResponse.json({
        success: true,
        message: 'Consent file deleted successfully',
      });
    } catch (convexError) {
      console.error('Failed to delete consent file via Convex:', convexError);
      return NextResponse.json({ error: 'Failed to delete consent file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting consent files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
