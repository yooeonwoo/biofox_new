import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { z } from 'zod';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 사용자 생성 데이터 검증 스키마
const createUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다'),
  role: z.enum(['admin', 'kol', 'ol', 'shop_owner'], {
    errorMap: () => ({ message: '유효하지 않은 역할입니다' }),
  }),
  shop_name: z.string().min(2, '상점명은 최소 2글자 이상이어야 합니다'),
  region: z.string().optional(),
  commission_rate: z
    .number()
    .min(0, '수수료율은 0% 이상이어야 합니다')
    .max(100, '수수료율은 100% 이하여야 합니다')
    .optional(),
});

// 입력 데이터 정리 함수 (XSS 방지)
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim(); // 공백 제거
}

// 사용자 목록 조회 API (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Users API GET called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // 관리자 권한 체크
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');

    // 역할 타입 검증 및 변환
    const validRole =
      role && ['admin', 'kol', 'ol', 'shop_owner'].includes(role)
        ? (role as 'admin' | 'kol' | 'ol' | 'shop_owner')
        : undefined;

    const validStatus =
      status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined;

    // Convex 쿼리 파라미터 구성 (커서 기반 페이지네이션)
    const queryArgs = {
      paginationOpts: {
        numItems: Math.min(limit, 100), // 최대 100개로 제한
        cursor: null, // 첫 페이지는 null, 향후 커서 기반 처리 구현 필요
      },
      search: search || undefined,
      role: validRole,
      status: validStatus,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      sortOrder: 'desc' as const,
    };

    console.log('Convex query args:', queryArgs);

    // Convex 쿼리 실행
    const result = await convex.query(api.users.listUsers, queryArgs);

    // 응답 형식 변환 (기존 API와 호환성 유지)
    return NextResponse.json({
      success: true,
      data: result.page || [],
      meta: {
        total: result.page?.length || 0, // 현재 페이지 아이템 수 (향후 개선 필요)
        page,
        limit,
        totalPages: result.isDone ? page : page + 1, // 임시 구현
        hasNextPage: !result.isDone,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('GET API Error (Convex):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// 사용자 생성 API (향후 Convex 뮤테이션으로 구현 예정)
export async function POST(request: NextRequest) {
  try {
    console.log('Users API POST called');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // 관리자 권한 체크
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // 입력 데이터 유효성 검증
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // 입력 데이터 정리 (XSS 방지)
    const sanitizedData = {
      email: validatedData.email.toLowerCase(),
      name: sanitizeInput(validatedData.name),
      role: validatedData.role,
      shop_name: sanitizeInput(validatedData.shop_name),
      region: validatedData.region ? sanitizeInput(validatedData.region) : undefined,
      commission_rate: validatedData.commission_rate || undefined,
    };

    // TODO: 향후 Convex 뮤테이션으로 사용자 생성 구현
    // 현재는 임시로 기능 준비 중 메시지 반환
    return NextResponse.json(
      {
        success: false,
        error: 'User creation via Convex is under development',
        message: 'This feature will be implemented with Convex mutations soon',
      },
      { status: 501 } // Not Implemented
    );

    // 향후 구현될 코드:
    // const newUser = await convex.mutation(api.users.createUser, sanitizedData);
    // return NextResponse.json({
    //   success: true,
    //   data: newUser,
    //   meta: {
    //     createdAt: new Date().toISOString(),
    //     createdBy: authResult.user._id
    //   }
    // }, { status: 201 });
  } catch (error: any) {
    console.error('POST API Error (Convex):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
