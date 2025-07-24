import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// KOL 대시보드 API 라우트 (Convex 기반)
export async function GET() {
  try {
    console.log('KOL Dashboard API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - KOL access required' }, { status: 401 });
    }

    // KOL 권한 체크
    if (!['kol', 'ol', 'admin'].includes(authResult.profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - KOL access required' },
        { status: 403 }
      );
    }

    console.log('KOL Dashboard - Current user:', {
      id: authResult.user._id,
      name: authResult.profile.name,
      role: authResult.profile.role,
      shop_name: authResult.profile.shop_name,
    });

    // Convex 쿼리 실행 (최적화된 버전 사용)
    const dashboardStats = await convex.query(api.realtime_optimized.getCachedKolDashboardStats, {
      kolId: authResult.user._id,
    });

    console.log('Convex query result:', dashboardStats);

    // 기존 API 응답 형식과 호환되도록 변환
    const dashboardData = {
      kol: {
        id: dashboardStats.kol.id,
        name: dashboardStats.kol.name,
        shopName: dashboardStats.kol.shopName,
      },
      sales: {
        currentMonth: dashboardStats.sales.currentMonth,
        growth: dashboardStats.sales.growth,
      },
      allowance: {
        currentMonth: dashboardStats.commission.currentMonth,
        growth: 0, // 향후 구현 예정
      },
      shops: {
        total: dashboardStats.shops.total,
        ordering: dashboardStats.shops.ordering,
        notOrdering: dashboardStats.shops.notOrdering,
      },
      // 추가 정보 (디버깅 및 성능 모니터링용)
      _metadata: {
        lastUpdated: dashboardStats.lastUpdated,
        dataSource: 'convex',
        performance: dashboardStats._performance || null,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('KOL 대시보드 데이터 조회 에러 (Convex):', error);

    // 에러 타입에 따른 상세 메시지 제공
    let errorMessage = '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
    let statusCode = 500;

    if (error.message?.includes('Authentication')) {
      errorMessage = '인증이 필요합니다.';
      statusCode = 401;
    } else if (error.message?.includes('permissions')) {
      errorMessage = '접근 권한이 없습니다.';
      statusCode = 403;
    } else if (error.message?.includes('not found')) {
      errorMessage = 'KOL 정보를 찾을 수 없습니다.';
      statusCode = 404;
    } else if (error instanceof Error) {
      errorMessage = `데이터 조회 중 오류가 발생했습니다: ${error.message}`;
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
