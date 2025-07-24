import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 개별 디바이스 판매 기록 조회 (Convex 기반)
export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log('Device GET API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('Fetching device:', params.deviceId);

    try {
      // Convex 쿼리 실행
      const deviceSaleWithDetails = await convex.query(api.devices.getDeviceSale, {
        device_id: params.deviceId as any,
      });

      return NextResponse.json({ data: deviceSaleWithDetails });
    } catch (convexError) {
      console.error('Convex query error:', convexError);

      const errorMessage = convexError instanceof Error ? convexError.message : String(convexError);
      if (errorMessage?.includes('Device sale not found')) {
        return NextResponse.json({ error: 'Device sale not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch device sale from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Device GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT과 DELETE는 아직 구현되지 않았으므로 기본 응답 반환
export async function PUT(request: NextRequest, { params }: { params: { deviceId: string } }) {
  return NextResponse.json(
    { error: 'PUT operation not yet implemented in Convex migration' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  return NextResponse.json(
    { error: 'DELETE operation not yet implemented in Convex migration' },
    { status: 501 }
  );
}
