import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 티어 변경 시뮬레이션 (Convex 기반)
export async function POST(request: NextRequest) {
  try {
    console.log('Tier Simulation API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { kol_id, additional_devices } = body;

    console.log('Simulating tier change:', { kol_id, additional_devices });

    // 유효성 검사
    if (!kol_id || additional_devices === undefined) {
      return NextResponse.json(
        { error: 'KOL ID와 추가 디바이스 수량이 필요합니다.' },
        { status: 400 }
      );
    }

    try {
      // Convex 시뮬레이션 쿼리 실행
      const simulation = await convex.query(api.devices.simulateTierChange, {
        kol_id,
        additional_devices,
      });

      return NextResponse.json(simulation);
    } catch (convexError) {
      console.error('Convex simulation query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to simulate tier change in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Tier simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
