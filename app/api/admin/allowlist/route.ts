import { NextRequest, NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import clerkApi from '@/lib/clerk-direct-api';

/**
 * Allowlist 관리 API
 * 관리자만 접근 가능
 */

// Allowlist 목록 조회
export async function GET() {
  try {
    // 관리자 권한 확인
    const authResult = await checkAuthSupabase(['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Clerk에서 Allowlist 조회
    const allowlistResponse = await clerkApi.makeRequest('/allowlist_identifiers');
    
    return NextResponse.json({
      success: true,
      data: allowlistResponse.data || allowlistResponse,
      totalCount: allowlistResponse.total_count || allowlistResponse.length
    });

  } catch (error) {
    console.error('Allowlist 조회 실패:', error);
    return NextResponse.json(
      { error: 'Allowlist 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// Allowlist에 이메일/도메인 추가
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await checkAuthSupabase(['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: '이메일 주소 또는 도메인이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 간단 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainRegex = /^@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(identifier) && !domainRegex.test(identifier)) {
      return NextResponse.json(
        { error: '올바른 이메일 주소 또는 도메인 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Clerk Allowlist에 추가 (발송하지 않음)
    const response = await clerkApi.makeRequest('/allowlist_identifiers', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        notify: false  // 항상 false로 설정
      })
    });

    console.log(`Allowlist에 추가됨: ${identifier}`);

    return NextResponse.json({
      success: true,
      message: `${identifier}을(를) Allowlist에 추가했습니다.`,
      data: response
    });

  } catch (error) {
    console.error('Allowlist 추가 실패:', error);
    
    // 중복 에러 처리
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: '이미 Allowlist에 존재하는 항목입니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Allowlist 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// Allowlist에서 제거
export async function DELETE(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await checkAuthSupabase(['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { allowlistId } = await req.json();

    if (!allowlistId) {
      return NextResponse.json(
        { error: 'Allowlist ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Clerk에서 Allowlist 항목 삭제
    await clerkApi.makeRequest(`/allowlist_identifiers/${allowlistId}`, {
      method: 'DELETE'
    });

    console.log(`Allowlist에서 제거됨: ${allowlistId}`);

    return NextResponse.json({
      success: true,
      message: 'Allowlist에서 제거되었습니다.'
    });

  } catch (error) {
    console.error('Allowlist 제거 실패:', error);
    return NextResponse.json(
      { error: 'Allowlist 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}