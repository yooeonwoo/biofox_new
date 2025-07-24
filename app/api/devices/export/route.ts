import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 디바이스 판매 데이터 내보내기 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Device Export API called - using Convex');

    // 인증 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    console.log('Export query params:', { format, date_from, date_to });

    try {
      // Convex 쿼리 실행
      const salesWithDetails = await convex.query(api.devices.getDeviceSales, {
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit: 1000, // 내보내기를 위해 큰 수치
      });

      // CSV 포맷으로 변환
      if (format === 'csv') {
        const headers = [
          '판매일',
          '샵명',
          '원장님',
          '이메일',
          '지역',
          'KOL/OL',
          'KOL역할',
          '기기명',
          '수량',
          '티어',
          '대당수수료',
          '총수수료',
          '시리얼번호',
          '비고',
        ];

        const rows = salesWithDetails.map((sale: any) => [
          sale.sale_date,
          sale.shop?.shop_name || '',
          sale.shop?.name || '',
          sale.shop?.email || '',
          sale.shop?.region || '',
          sale.kol?.name || '',
          sale.kol?.role?.toUpperCase() || '',
          sale.device_name || '',
          sale.quantity || 0,
          sale.tier_at_sale === 'tier_5_plus' ? '5대 이상' : '1-4대',
          sale.quantity !== 0 ? sale.standard_commission / Math.abs(sale.quantity) : 0,
          sale.actual_commission || 0,
          sale.serial_numbers?.join(', ') || '',
          sale.notes || '',
        ]);

        // CSV 문자열 생성
        const csvContent = [
          headers.join(','),
          ...rows.map((row: any) =>
            row
              .map((cell: any) =>
                typeof cell === 'string' && cell.includes(',')
                  ? `"${cell.replace(/"/g, '""')}"`
                  : cell
              )
              .join(',')
          ),
        ].join('\n');

        // BOM 추가 (한글 엑셀 호환)
        const bom = '\uFEFF';
        const csvWithBom = bom + csvContent;

        return new NextResponse(csvWithBom, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="device_sales_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }

      // JSON 형식
      return NextResponse.json({ data: salesWithDetails });
    } catch (convexError) {
      console.error('Convex export query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to export device sales from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
