import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 수수료 계산 목록 조회 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Commissions GET API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('Commissions - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const kol_id = searchParams.get('kol_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    console.log('Commissions query params:', { month, kol_id, status, page, limit });

    try {
      // Convex 쿼리 실행
      const queryArgs: any = {
        paginationOpts: {
          numItems: limit,
          cursor: null, // 향후 cursor 기반 페이지네이션 구현 예정
        },
      };

      if (month) queryArgs.month = month;
      if (kol_id) queryArgs.kol_id = kol_id as any;
      if (status) queryArgs.status = status as any;

      // 수수료 계산 목록 조회
      const commissionsResult = await convex.query(
        api.commissions.getCommissionCalculations,
        queryArgs
      );

      // 요약 통계 조회
      const summaryArgs: any = {};
      if (month) summaryArgs.month = month;

      const summary = await convex.query(api.commissions.getCommissionSummary, summaryArgs);

      console.log('Convex query results:', {
        commissions_count: commissionsResult.page.length,
        summary: summary,
      });

      // 기존 API 응답 형식에 맞춘 응답
      return NextResponse.json({
        data: commissionsResult.page || [],
        pagination: {
          total: commissionsResult.page.length, // 정확한 total count는 향후 구현
          page,
          limit,
          totalPages: Math.ceil(commissionsResult.page.length / limit),
          hasNext: !commissionsResult.isDone,
          hasPrev: page > 1,
        },
        summary: summary,
      });
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to fetch commission calculations from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Commission fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

// 월별 수수료 계산 실행 (Convex 기반)
export async function POST(request: NextRequest) {
  try {
    console.log('Commissions POST API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { month } = body; // YYYY-MM

    console.log('Calculating commissions for month:', month);

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    // 월 형식 검증
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    try {
      // Convex 뮤테이션 실행
      const result = await convex.mutation(api.commissions.calculateMonthlyCommissions, {
        month: month,
      });

      console.log('Commission calculation result:', result);

      return NextResponse.json(result);
    } catch (convexError) {
      console.error('Convex commission calculation error:', convexError);
      return NextResponse.json(
        { error: 'Failed to calculate commissions in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Commission calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate commissions' }, { status: 500 });
  }
}
