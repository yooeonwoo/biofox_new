/**
 * 월별 매출 요약 목록 API
 * 
 * KOL의 여러 달에 걸친 매출, 수당 요약 데이터 조회
 * 
 * GET /api/sales/monthly-summary/list
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - limit: 조회할 개월 수 (기본값: 12)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, desc } from 'drizzle-orm';
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
    
    // 월별 요약 데이터 목록 조회 (최근 순으로 정렬)
    const summaryList = await db
      .select({
        yearMonth: kolMonthlySummary.yearMonth,
        monthlySales: kolMonthlySummary.monthlySales,
        monthlyCommission: kolMonthlySummary.monthlyCommission
      })
      .from(kolMonthlySummary)
      .where(eq(kolMonthlySummary.kolId, parseInt(kolId)))
      .orderBy(desc(kolMonthlySummary.yearMonth))
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: summaryList
    });
  } catch (error) {
    console.error('월별 매출 요약 목록 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '월별 매출 요약 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 