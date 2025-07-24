import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 수수료 계산 데이터 내보내기 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Commission export API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const format = searchParams.get('format') || 'csv';
    const include_details = searchParams.get('include_details') === 'true';

    console.log('Commission export params:', { month, format, include_details });

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    // 월 형식 검증
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    try {
      // Convex 쿼리 실행
      const commissionsData = await convex.query(api.commissions.getCommissionsForExport, {
        month: month,
      });

      console.log('Commission export data retrieved:', {
        count: commissionsData.data.length,
        format: format,
      });

      if (format === 'csv') {
        // CSV 헤더
        const headers = [
          '정산월',
          'KOL/OL',
          '역할',
          '이메일',
          '소속샵 수수료',
          '본인샵 수수료',
          '기기 수수료',
          '조정금액',
          '총 수수료',
          '상태',
          '은행명',
          '계좌번호',
          '예금주',
        ];

        // CSV 데이터 행 생성
        const rows = commissionsData.data.map((c: any) => {
          const bankInfo = c.kol?.bank_info || {};
          const adjustmentTotal = (c.adjustments || []).reduce(
            (sum: number, adj: any) => sum + (adj.amount || 0),
            0
          );

          return [
            new Date(c.calculation_month).toISOString().substring(0, 7), // YYYY-MM 형식으로 변환
            c.kol?.name || 'Unknown',
            c.kol?.role?.toUpperCase() || 'UNKNOWN',
            c.kol?.email || '',
            c.subordinate_commission || 0,
            c.self_shop_commission || 0,
            c.device_commission || 0,
            adjustmentTotal,
            c.total_commission || 0,
            c.status === 'paid'
              ? '지급완료'
              : c.status === 'adjusted'
                ? '조정됨'
                : c.status === 'approved'
                  ? '승인완료'
                  : c.status === 'reviewed'
                    ? '검토완료'
                    : '계산완료',
            bankInfo.bank_name || '',
            bankInfo.account_number || '',
            bankInfo.account_holder || '',
          ];
        });

        // CSV 문자열 생성
        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) =>
            row
              .map((cell: any) => {
                const cellStr = String(cell);
                // 쉼표가 포함된 경우 따옴표로 감싸기
                return cellStr.includes(',') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
              })
              .join(',')
          ),
        ].join('\n');

        // BOM 추가 (한글 Excel 호환성)
        const bom = '\uFEFF';
        const csvWithBom = bom + csvContent;

        console.log('CSV export completed:', {
          headers_count: headers.length,
          rows_count: rows.length,
          total_size: csvWithBom.length,
        });

        return new NextResponse(csvWithBom, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="commission_${month}.csv"`,
          },
        });
      }

      // JSON 형식 (기본)
      return NextResponse.json({ data: commissionsData.data });
    } catch (convexError: any) {
      console.error('Convex commission export query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to export commission data from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Commission export error:', error);
    return NextResponse.json({ error: 'Failed to export commission data' }, { status: 500 });
  }
}
