import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentYearMonth, getPreviousYearMonth, getCurrentDate } from '@/lib/date-utils';
import { getAuthenticatedKol } from '@/lib/auth-cache';

// KOL 대시보드 API 라우트 
export async function GET() {
  try {
    console.log('대시보드 API 요청 시작');

    // 🚀 캐시된 인증 확인
    const { user: userData, kol: kolData } = await getAuthenticatedKol();

    // 현재 월과 이전 월 계산 - YYYYMM 형식 (데이터베이스 형식과 일치)
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentYearMonth(); // "202505"
    const previousMonth = getPreviousYearMonth(currentDate); // "202504"

    console.log(`대시보드 API - 월 정보:`, {
      currentDate,
      currentMonth,
      previousMonth,
      kolId: kolData.id
    });

    // KOL 월별 요약 정보 조회 (kol_dashboard_metrics 테이블만 사용)
    const { data: dashboardMetrics, error: dashboardError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (dashboardError) {
      console.error(`대시보드 메트릭 조회 오류(kol_id=${kolData.id}, month=${currentMonth}):`, dashboardError);
      // 오류가 있어도 계속 진행 (기본값 사용)
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
      
      // 새 메트릭 데이터 생성
      const newMetricsData = {
        kol_id: kolData.id,
        year_month: currentMonth, // YYYYMM 형식으로 저장 (예: "202505")
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

    // 이전 월 데이터 조회
    const { data: previousMonthData, error: previousMonthError } = await supabase
      .from('kol_dashboard_metrics')
      .select('monthly_sales, monthly_commission')
      .eq('kol_id', kolData.id)
      .eq('year_month', previousMonth)
      .maybeSingle();

    if (previousMonthError) {
      console.log(`이전 월 데이터 조회 오류(kol_id=${kolData.id}, month=${previousMonth}):`, previousMonthError);
      // 오류가 있어도 계속 진행 (기본값 사용)
    }

    // 이전 월 데이터가 없으면 새로 생성
    if (!previousMonthData) {
      console.log(`이전 월 데이터 없음, 새로 생성 시도 (kol_id=${kolData.id}, month=${previousMonth})`);
      
      // 새 메트릭 데이터 생성
      const newPrevMetricsData = {
        kol_id: kolData.id,
        year_month: previousMonth, // "2025-04" 형식으로 저장
        monthly_sales: 0,
        monthly_commission: 0,
        active_shops_count: 0,
        total_shops_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { error: insertPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .insert(newPrevMetricsData);
        
      if (insertPrevError) {
        console.error(`이전 월 메트릭 생성 실패(kol_id=${kolData.id}, month=${previousMonth}):`, insertPrevError);
      } else {
        console.log(`이전 월 메트릭 생성 성공(kol_id=${kolData.id}, month=${previousMonth})`);
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