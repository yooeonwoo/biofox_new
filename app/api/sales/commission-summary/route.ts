/**
 * 월별 수당 요약 API
 * 
 * KOL의 월별 수당 요약 데이터 조회
 * 
 * GET /api/sales/commission-summary
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - limit: 조회할 개월 수 (기본값: 12)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { kolMonthlySummary } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // kolId 필수 체크
    if (!kolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 실제 API 구현 시 아래 코드를 사용하세요
    /*
    // 월별 수당 요약 데이터 조회
    const summaryData = await db
      .select({
        yearMonth: kolMonthlySummary.yearMonth,
        totalCommission: kolMonthlySummary.monthlyCommission,
        settledCommission: kolMonthlySummary.settledCommission,
        pendingCommission: kolMonthlySummary.pendingCommission,
      })
      .from(kolMonthlySummary)
      .where(eq(kolMonthlySummary.kolId, parseInt(kolId)))
      .orderBy(desc(kolMonthlySummary.yearMonth))
      .limit(limit);
    */
    
    // 임시 데이터 (실제 구현 시 위 쿼리 결과로 대체)
    const mockSummaryData = [
      {
        yearMonth: "2023-08",
        totalCommission: 1500000,
        settledCommission: 900000,
        pendingCommission: 600000
      },
      {
        yearMonth: "2023-07",
        totalCommission: 1200000,
        settledCommission: 1200000,
        pendingCommission: 0
      },
      {
        yearMonth: "2023-06",
        totalCommission: 1350000,
        settledCommission: 1350000,
        pendingCommission: 0
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockSummaryData
    });
  } catch (error) {
    console.error('월별 수당 요약 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '월별 수당 요약을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 