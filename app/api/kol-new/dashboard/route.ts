import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentYearMonth, getPreviousMonth, getCurrentDate } from '@/lib/date-utils';
import { getAuthenticatedKol } from '@/lib/auth-cache';

// KOL 대시보드 API 라우트 
export async function GET() {
  try {
    console.log('대시보드 API 요청 시작');

    // 🚀 캐시된 인증 확인
    const { user: userData, kol: kolData } = await getAuthenticatedKol();

    // 현재 월과 이전 월 계산 - 모두 YYYY-MM 형식으로 통일
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentYearMonth(); // "2025-05"
    const previousMonth = getPreviousMonth(currentDate); // "2025-04"

    console.log(`대시보드 API - 월 정보:`, {
      currentDate,
      currentMonth,
      previousMonth,
      kolId: kolData.id
    });

    // 레거시 호환성을 위한 YYYYMM 형식
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"

    // KOL 월별 요약 정보 조회 - 우선순위 로직으로 최신 데이터 보장
    let dashboardMetrics = null;
    
    // 1단계: 표준 형식(YYYY-MM) 먼저 시도
    const { data: standardCurrentData, error: standardCurrentError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (standardCurrentError && standardCurrentError.code !== 'PGRST116') {
      console.error('표준 형식 대시보드 메트릭 조회 오류:', standardCurrentError);
    }

    if (standardCurrentData) {
      dashboardMetrics = standardCurrentData;
      console.log(`표준 형식 데이터 사용: ${currentMonth} for KOL ${kolData.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyCurrentData, error: legacyCurrentError } = await supabase
        .from('kol_dashboard_metrics')
        .select('*')
        .eq('kol_id', kolData.id)
        .eq('year_month', currentMonthCompact)
        .maybeSingle();

      if (legacyCurrentError && legacyCurrentError.code !== 'PGRST116') {
        console.error('레거시 형식 대시보드 메트릭 조회 오류:', legacyCurrentError);
      }

      if (legacyCurrentData) {
        dashboardMetrics = legacyCurrentData;
        console.log(`레거시 형식 데이터 사용: ${currentMonthCompact} for KOL ${kolData.id}`);
      } else {
        console.log(`대시보드 메트릭 데이터 없음: ${currentMonth}/${currentMonthCompact} for KOL ${kolData.id}`);
      }
    }

    // 현재 월 데이터가 없으면 새로 생성
    if (!dashboardMetrics) {
      console.log(`대시보드 메트릭 데이터 없음, 새로 생성 시도 (kol_id=${kolData.id}, month=${currentMonth})`);
      
      // 전문점 수 조회
      const { data: shopsCount, error: shopsError, count } = await supabase
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('kol_id', kolData.id);
        
      const totalShops = shopsError ? 0 : count || 0;
      
      // 새 메트릭 데이터 생성 - 표준 YYYY-MM 형식으로 저장
      const newMetricsData = {
        kol_id: kolData.id,
        year_month: currentMonth, // "2025-05" 형식으로 저장
        monthly_sales: 0,
        monthly_commission: 0,
        active_shops_count: 0,
        total_shops_count: totalShops,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data: newMetrics, error: insertError } = await supabase
        .from('kol_dashboard_metrics')
        .insert(newMetricsData)
        .select()
        .single();
        
      if (insertError) {
        console.error(`대시보드 메트릭 생성 실패(kol_id=${kolData.id}, month=${currentMonth}):`, insertError);
      } else {
        console.log(`대시보드 메트릭 생성 성공(kol_id=${kolData.id}, month=${currentMonth})`);
      }
    }

    // 이전 월 데이터 조회 - 우선순위 로직으로 최신 데이터 보장
    let previousMonthData = null;
    const previousMonthCompact = previousMonth.replace('-', ''); // "202504"
    
    // 1단계: 표준 형식(YYYY-MM) 먼저 시도
    const { data: standardPrevData, error: standardPrevError } = await supabase
      .from('kol_dashboard_metrics')
      .select('monthly_sales, monthly_commission')
      .eq('kol_id', kolData.id)
      .eq('year_month', previousMonth)
      .maybeSingle();

    if (standardPrevError && standardPrevError.code !== 'PGRST116') {
      console.error('표준 형식 이전 월 데이터 조회 오류:', standardPrevError);
    }

    if (standardPrevData) {
      previousMonthData = standardPrevData;
      console.log(`표준 형식 이전 월 데이터 사용: ${previousMonth} for KOL ${kolData.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyPrevData, error: legacyPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .select('monthly_sales, monthly_commission')
        .eq('kol_id', kolData.id)
        .eq('year_month', previousMonthCompact)
        .maybeSingle();

      if (legacyPrevError && legacyPrevError.code !== 'PGRST116') {
        console.error('레거시 형식 이전 월 데이터 조회 오류:', legacyPrevError);
      }

      if (legacyPrevData) {
        previousMonthData = legacyPrevData;
        console.log(`레거시 형식 이전 월 데이터 사용: ${previousMonthCompact} for KOL ${kolData.id}`);
      } else {
        console.log(`이전 월 데이터 없음: ${previousMonth}/${previousMonthCompact} for KOL ${kolData.id}`);
      }
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics?.monthly_commission || 0;
    const previousMonthSales = previousMonthData?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData?.monthly_commission || 0;
    const totalShops = dashboardMetrics?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics?.active_shops_count || 0;
    const notOrderingShops = totalShops - activeOrderingShops;

    // 대시보드 데이터 구성
    const dashboardData = {
      kol: {
        id: kolData.id,
        name: kolData.name,
        shopName: kolData.shop_name
      },
      sales: {
        currentMonth: monthlySales,
        previousMonth: previousMonthSales,
        growth: monthlySales - previousMonthSales
      },
      allowance: {
        currentMonth: monthlyCommission,
        previousMonth: previousMonthCommission,
        growth: monthlyCommission - previousMonthCommission
      },
      shops: {
        total: totalShops,
        ordering: activeOrderingShops,
        notOrdering: notOrderingShops
      }
    };
    
    console.log(`대시보드 데이터 생성 완료: KOL ID=${kolData.id}`);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('KOL 대시보드 데이터 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 