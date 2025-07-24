import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 디바이스 통계 조회 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Device Statistics API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const group_by = searchParams.get('group_by') || 'date';

    console.log('Statistics query params:', { period, start_date, end_date, group_by });

    try {
      // Convex 통계 쿼리 실행
      const statistics = await convex.query(api.devices.getDeviceStatistics, {
        start_date: start_date || undefined,
        end_date: end_date || undefined,
      });

      // KOL 누적 현황 조회
      const kolAccumulators = await convex.query(api.devices.getKolDeviceAccumulator, {});

      // 기존 API 형식에 맞춘 응답
      return NextResponse.json({
        summary: statistics.summary,
        chart_data: [], // 추후 구현 필요 (복잡한 그룹화 로직)
        top_performers: statistics.top_performers.map(performer => ({
          id: performer.id,
          name: performer.name,
          role: performer.role,
          devices_sold: performer.devices_sold,
          current_tier: performer.current_tier,
          commission_earned: 0, // 추후 계산 필요
        })),
      });
    } catch (convexError) {
      console.error('Convex statistics query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to fetch device statistics from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Device Statistics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
