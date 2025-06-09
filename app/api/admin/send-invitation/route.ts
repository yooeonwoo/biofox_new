import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import clerkApi from '@/lib/clerk-direct-api';

/**
 * 개별 사용자에게 초대 이메일 발송
 * 관리자만 접근 가능
 */
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await checkAuthSupabase(['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { email, redirectUrl } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일 주소가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 주소 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    console.log(`초대 이메일 발송 시작: ${email}`);

    // 1. 먼저 Allowlist에 추가 (이미 있으면 에러 무시)
    try {
      await clerkApi.createAllowlistIdentifier(email, false);
      console.log(`✅ Allowlist에 추가: ${email}`);
    } catch (allowlistError) {
      if (allowlistError.message?.includes('already exists')) {
        console.log(`ℹ️  이미 Allowlist에 존재: ${email}`);
      } else {
        console.error('Allowlist 추가 실패:', allowlistError);
        return NextResponse.json(
          { error: 'Allowlist 추가에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    // 2. Clerk Invitation 발송
    try {
      const invitationData = {
        email_address: email,
        redirect_url: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/signin`
      };

      const response = await clerkApi.makeRequest('/invitations', {
        method: 'POST',
        body: JSON.stringify(invitationData)
      });

      console.log(`✅ 초대 이메일 발송 성공: ${email}, Invitation ID: ${response.id}`);

      return NextResponse.json({
        success: true,
        message: `${email}에게 초대 이메일을 발송했습니다.`,
        invitationId: response.id,
        email: email
      });

    } catch (invitationError) {
      console.error('초대 이메일 발송 실패:', invitationError);
      
      // 이미 초대된 경우 처리
      if (invitationError.message?.includes('already invited') || 
          invitationError.message?.includes('already exists')) {
        return NextResponse.json({
          success: false,
          message: `${email}은 이미 초대되었거나 가입된 사용자입니다.`,
          email: email
        }, { status: 409 });
      }

      return NextResponse.json(
        { error: '초대 이메일 발송에 실패했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('초대 처리 실패:', error);
    return NextResponse.json(
      { error: '초대 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}