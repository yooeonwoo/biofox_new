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
import { serverSupabase, CACHE_SETTINGS, getCurrentYearMonth, snakeToCamel } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정 - Next.js 15의 새로운 방식으로 변경
export const dynamic = 'force-dynamic'; // 또는 'auto'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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

    // 미리 계산된 Materialized View에서 데이터 조회
    const { data: summary, error } = await serverSupabase
      .from('kol_statistics_mv')  // 미리 계산된 통계 뷰 사용
      .select(`
        kol_id,
        year_month,
        monthly_sales,
        monthly_commission,
        avg_monthly_sales,
        cumulative_commission,
        previous_month_sales,
        previous_month_commission,
        active_shops_count
      `)
      .eq('kol_id', kolId)
      .eq('year_month', yearMonth)
      .limit(1)
      .single();
    
    if (error) {
      console.error("월별 요약 데이터 조회 오류:", error);
      
      // 데이터가 없는 경우
      if (error.code === 'PGRST116') {
        const emptyData = {
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
        };
        
        // 캐싱 헤더 추가
        const response = NextResponse.json({ success: true, data: emptyData });
        response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
        return response;
      }
      
      // 미리 계산된 뷰가 없는 경우 kol_monthly_summary 테이블에서 직접 조회
      const { data: fallbackData, error: fallbackError } = await serverSupabase
        .from('kol_monthly_summary')
        .select(`
          kol_id,
          year_month,
          monthly_sales,
          monthly_commission,
          avg_monthly_sales,
          cumulative_commission,
          previous_month_sales,
          previous_month_commission,
          active_shops_count,
          total_shops_count
        `)
        .eq('kol_id', kolId)
        .eq('year_month', yearMonth)
        .limit(1)
        .single();
        
      if (fallbackError) {
        return NextResponse.json(
          { success: false, error: '매출 및 수당 요약을 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      const formattedFallbackData = {
        kolId: fallbackData.kol_id,
        yearMonth: fallbackData.year_month,
        monthlySales: fallbackData.monthly_sales,
        monthlyCommission: fallbackData.monthly_commission,
        avgMonthlySales: fallbackData.avg_monthly_sales,
        cumulativeCommission: fallbackData.cumulative_commission,
        previousMonthSales: fallbackData.previous_month_sales,
        previousMonthCommission: fallbackData.previous_month_commission,
        activeShopsCount: fallbackData.active_shops_count,
        totalShopsCount: fallbackData.total_shops_count
      };
      
      // 캐싱 헤더 추가
      const response = NextResponse.json({ success: true, data: formattedFallbackData });
      response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
      return response;
    }
    
    // 스네이크 케이스를 카멜 케이스로 변환
    const formattedData = {
      kolId: summary.kol_id,
      yearMonth: summary.year_month,
      monthlySales: summary.monthly_sales,
      monthlyCommission: summary.monthly_commission,
      avgMonthlySales: summary.avg_monthly_sales,
      cumulativeCommission: summary.cumulative_commission,
      previousMonthSales: summary.previous_month_sales,
      previousMonthCommission: summary.previous_month_commission,
      activeShopsCount: summary.active_shops_count,
      totalShopsCount: summary.active_shops_count // active_shops_count로 대체 (kol_statistics_mv에는 total_shops_count가 없음)
    };
    
    // 캐싱 헤더 추가
    const response = NextResponse.json({ success: true, data: formattedData });
    response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
    return response;
  } catch (error) {
    console.error('매출 및 수당 요약 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '매출 및 수당 요약을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 