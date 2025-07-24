import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  try {
    console.log('Clinical Cases GET API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['shop_owner', 'kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Clinical Cases - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const subject_type = searchParams.get('subject_type');

    // Convex 쿼리 파라미터 구성
    const queryArgs: any = {
      paginationOpts: {
        numItems: Math.min(limit, 100), // 최대 100개로 제한
        cursor: null, // 첫 페이지는 null, 향후 커서 기반 처리 구현 필요
      },
    };

    // 필터 적용
    if (status && ['in_progress', 'completed', 'paused', 'cancelled'].includes(status)) {
      queryArgs.status = status as 'in_progress' | 'completed' | 'paused' | 'cancelled';
    }
    if (subject_type && ['self', 'customer'].includes(subject_type)) {
      queryArgs.subject_type = subject_type as 'self' | 'customer';
    }

    console.log('Convex query args:', queryArgs);

    // Convex 쿼리 실행
    const result = await convex.query(api.clinical.listClinicalCases, queryArgs);

    console.log('Convex query result:', result);

    // 기존 API 응답 형식과 호환되도록 변환
    const responseData = {
      data: result.page,
      pagination: {
        total: result.page.length, // 현재 페이지 아이템 수 (향후 개선 필요)
        page,
        limit,
        totalPages: result.isDone ? page : page + 1, // 임시 구현
        hasNext: !result.isDone,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Clinical cases fetch error (Convex):', error);

    // 에러 타입에 따른 상세 메시지 제공
    let errorMessage = 'Failed to fetch clinical cases';
    let statusCode = 500;

    if (error.message?.includes('Authentication')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    } else if (error.message?.includes('permissions')) {
      errorMessage = 'Access denied';
      statusCode = 403;
    } else if (error instanceof Error) {
      errorMessage = `Failed to fetch clinical cases: ${error.message}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Clinical Cases POST API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['shop_owner', 'kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Clinical Case Creation - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    const body = await request.json();
    const {
      subject_type,
      name,
      gender,
      age,
      treatment_item,
      consent_status,
      marketing_consent,
      notes,
      tags,
    } = body;

    // 입력 데이터 검증
    if (!subject_type || !['self', 'customer'].includes(subject_type)) {
      return NextResponse.json(
        { error: 'Invalid subject_type. Must be "self" or "customer"' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!consent_status || !['no_consent', 'consented', 'pending'].includes(consent_status)) {
      return NextResponse.json(
        { error: 'Invalid consent_status. Must be "no_consent", "consented", or "pending"' },
        { status: 400 }
      );
    }

    // Convex 뮤테이션 실행
    const mutationArgs: any = {
      subject_type: subject_type as 'self' | 'customer',
      name: name.trim(),
      consent_status: consent_status as 'no_consent' | 'consented' | 'pending',
    };

    // 선택적 필드들 추가
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      mutationArgs.gender = gender as 'male' | 'female' | 'other';
    }
    if (age !== undefined && age >= 0 && age <= 150) {
      mutationArgs.age = age;
    }
    if (treatment_item) {
      mutationArgs.treatment_item = treatment_item;
    }
    if (marketing_consent !== undefined) {
      mutationArgs.marketing_consent = marketing_consent;
    }
    if (notes) {
      mutationArgs.notes = notes;
    }
    if (tags && Array.isArray(tags)) {
      mutationArgs.tags = tags;
    }

    console.log('Convex mutation args:', mutationArgs);

    const clinicalCase = await convex.mutation(api.clinical.createClinicalCase, mutationArgs);

    console.log('Clinical case created:', clinicalCase);

    return NextResponse.json({ data: clinicalCase });
  } catch (error: any) {
    console.error('Clinical case creation error (Convex):', error);

    // 에러 타입에 따른 상세 메시지 제공
    let errorMessage = 'Failed to create clinical case';
    let statusCode = 500;

    if (error.message?.includes('Authentication')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    } else if (error.message?.includes('permissions')) {
      errorMessage = 'Access denied';
      statusCode = 403;
    } else if (error.message?.includes('validation') || error.message?.includes('must be')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = `Failed to create clinical case: ${error.message}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: statusCode }
    );
  }
}
