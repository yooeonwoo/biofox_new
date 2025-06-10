import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentDate, getPreviousMonth, getCurrentYearMonth } from '@/lib/date-utils';
import { getAuthenticatedKol } from '@/lib/auth-cache';

// 🚀 통합 대시보드 API - 모든 데이터를 한 번에 로드하여 성능 최적화
export async function GET() {
  try {
    console.log('통합 대시보드 API 요청 시작');

    // 🚀 캐시된 인증 확인 (중복 인증 로직 제거)
    const { user: userData, kol: kolData } = await getAuthenticatedKol();

    // 현재 월과 이전 월 계산 - YYYY-MM 형식으로 통일
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentYearMonth(); // "2025-05"
    const previousMonth = getPreviousMonth(currentDate); // "2025-04"

    // 레거시 호환성을 위한 YYYYMM 형식
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"
    const previousMonthCompact = previousMonth.replace('-', ''); // "202504"

    console.log(`통합 대시보드 - 월 정보:`, {
      currentMonth,
      previousMonth,
      currentMonthCompact,
      previousMonthCompact,
      kolId: kolData.id
    });

    // 🚀 병렬로 모든 데이터 한 번에 조회
    const [
      shopsData,
      activitiesData
    ] = await Promise.all([
      // 전문점 데이터 (매출 정보 포함) - 레거시 호환성 체크
      supabase
        .from('shops')
        .select(`
          id,
          owner_name,
          shop_name,
          region,
          status,
          created_at,
          is_owner_kol,
          shop_sales_metrics!inner (
            total_sales,
            product_sales,
            device_sales,
            year_month
          )
        `)
        .eq('kol_id', kolData.id)
        .or(`shop_sales_metrics.year_month.eq.${currentMonth},shop_sales_metrics.year_month.eq.${currentMonthCompact}`),
      
      // 영업 일지 데이터
      supabase
        .from('sales_activities')
        .select(`
          id,
          shop_id,
          activity_date,
          content,
          created_at,
          shop_name,
          shops (shop_name)
        `)
        .eq('kol_id', kolData.id)
        .order('activity_date', { ascending: false })
        .limit(10)
    ]);

    // 우선순위 로직으로 대시보드 메트릭 조회 - 표준 형식 우선
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

    // 우선순위 로직으로 이전 월 데이터 조회 - 표준 형식 우선
    let previousMonthData = null;
    
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

    // 오류 처리
    if (shopsData.error) {
      console.error('전문점 데이터 조회 오류:', shopsData.error);
    }

    if (activitiesData.error) {
      console.error('영업 일지 데이터 조회 오류:', activitiesData.error);
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics?.monthly_commission || 0;
    const previousMonthSales = previousMonthData?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData?.monthly_commission || 0;
    const totalShops = dashboardMetrics?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics?.active_shops_count || 0;

    // 전문점 데이터 가공
    const formattedShops = (shopsData.data || []).map((shop: any) => ({
      id: shop.id,
      ownerName: shop.owner_name,
      shop_name: shop.shop_name || shop.owner_name,
      region: shop.region,
      status: shop.status,
      createdAt: shop.created_at,
      is_owner_kol: shop.is_owner_kol,
      sales: {
        total: shop.shop_sales_metrics?.[0]?.total_sales || 0,
        product: shop.shop_sales_metrics?.[0]?.product_sales || 0,
        device: shop.shop_sales_metrics?.[0]?.device_sales || 0,
        hasOrdered: (shop.shop_sales_metrics?.[0]?.total_sales || 0) > 0
      }
    }));

    // 영업 일지 데이터 가공
    const formattedActivities = (activitiesData.data || []).map((act: any) => ({
      id: act.id,
      shopId: act.shop_id,
      shopName: act.shop_name || act.shops?.shop_name,
      activityDate: new Date(act.activity_date).toLocaleDateString('ko-KR'),
      content: act.content,
      createdAt: new Date(act.created_at).toLocaleDateString('ko-KR'),
      timeAgo: (() => {
        const activityDate = new Date(act.activity_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - activityDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? '오늘' : `${diffDays}일 전`;
      })()
    }));

    // 통합 응답 데이터 구성
    const completeData = {
      dashboard: {
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
          notOrdering: totalShops - activeOrderingShops
        }
      },
      shops: {
        shops: formattedShops,
        meta: {
          totalShopsCount: totalShops,
          activeShopsCount: activeOrderingShops
        }
      },
      activities: formattedActivities
    };

    console.log(`통합 대시보드 데이터 생성 완료: KOL ID=${kolData.id}`);
    return NextResponse.json(completeData);

  } catch (error) {
    console.error('통합 대시보드 데이터 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}