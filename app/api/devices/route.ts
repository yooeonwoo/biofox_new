import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 디바이스 판매 목록 조회 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Devices GET API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const shop_id = searchParams.get('shop_id');
    const kol_id = searchParams.get('kol_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    console.log('Devices query params:', { page, limit, shop_id, kol_id, date_from, date_to });

    try {
      // Convex 쿼리 실행
      const salesWithDetails = await convex.query(api.devices.getDeviceSales, {
        shop_id: shop_id ? (shop_id as any) : undefined,
        kol_id: kol_id ? (kol_id as any) : undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit: Math.min(limit, 100), // 최대 100개로 제한
      });

      // 통계 조회
      const statistics = await convex.query(api.devices.getDeviceStatistics, {
        start_date: date_from || undefined,
        end_date: date_to || undefined,
      });

      // 기존 API와 호환성 유지
      return NextResponse.json({
        data: salesWithDetails,
        pagination: {
          total: salesWithDetails.length,
          page,
          limit,
          totalPages: Math.ceil(salesWithDetails.length / limit),
          hasNext: salesWithDetails.length === limit,
          hasPrev: page > 1,
        },
        summary: statistics.summary,
      });
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to fetch device sales from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Devices GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 디바이스 판매 기록 생성 (Convex 기반)
export async function POST(request: NextRequest) {
  try {
    console.log('Devices POST API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { shop_id, sale_date, quantity, device_name, serial_numbers, notes } = body;

    console.log('Creating device sale:', { shop_id, sale_date, quantity, device_name });

    // 유효성 검사
    if (!shop_id || !sale_date || quantity === undefined || quantity === 0) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었거나 잘못되었습니다.' },
        { status: 400 }
      );
    }

    try {
      // Convex 뮤테이션 실행
      const deviceSale = await convex.mutation(api.devices.createDeviceSale, {
        shop_id,
        sale_date,
        quantity,
        device_name: device_name || undefined,
        serial_numbers: serial_numbers || undefined,
        notes: notes || undefined,
      });

      console.log('Device sale created successfully:', deviceSale);

      return NextResponse.json({ data: deviceSale });
    } catch (convexError) {
      console.error('Convex mutation error:', convexError);

      // 에러 메시지에 따른 적절한 HTTP 상태 코드 반환
      const errorMessage = convexError instanceof Error ? convexError.message : String(convexError);
      if (errorMessage?.includes('Shop has no active KOL/OL relationship')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Failed to create device sale in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Devices POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
