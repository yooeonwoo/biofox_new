/**
 * 매출 및 수당 요약 API
 * 
 * KOL의 월별 매출, 수당, 전월 대비 비교 데이터 조회
 * 
 * GET /api/sales/monthly-summary
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, desc } from 'drizzle-orm';
import { kolMonthlySummary } from '@/db/schema';
import { getCurrentYearMonth } from '@/lib/sales-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    // kolId 필수 체크
    if (!kolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 월별 요약 데이터 조회
    const summary = await db
      .select()
      .from(kolMonthlySummary)
      .where(
        and(
          eq(kolMonthlySummary.kolId, parseInt(kolId)),
          eq(kolMonthlySummary.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (summary.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          data: {
            kolId: parseInt(kolId),
            yearMonth,
            monthlySales: 0,
            monthlyCommission: 0,
            avgMonthlySales: "0",
            cumulativeCommission: 0,
            previousMonthSales: 0,
            previousMonthCommission: 0,
            activeShopsCount: 0,
            totalShopsCount: 0
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        kolId: parseInt(kolId),
        yearMonth,
        monthlySales: summary[0].monthlySales,
        monthlyCommission: summary[0].monthlyCommission,
        avgMonthlySales: summary[0].avgMonthlySales,
        cumulativeCommission: summary[0].cumulativeCommission,
        previousMonthSales: summary[0].previousMonthSales,
        previousMonthCommission: summary[0].previousMonthCommission,
        activeShopsCount: summary[0].activeShopsCount,
        totalShopsCount: summary[0].totalShopsCount
      }
    });
  } catch (error) {
    console.error('매출 및 수당 요약 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '매출 및 수당 요약을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 