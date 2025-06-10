import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getCurrentDate, getPreviousMonth } from '@/lib/date-utils';
import { getAuthenticatedKol } from '@/lib/auth-cache';
import ClientDashboard from './ClientDashboard';

// 🚀 서버 컴포넌트에서 데이터 페칭 - SSR 성능 최적화

interface ServerDashboardData {
  dashboard: any;
  shops: any;
  activities: any;
}

async function fetchDashboardDataOnServer(): Promise<ServerDashboardData | null> {
  try {
    // 서버에서 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('서버 컴포넌트: 인증되지 않은 사용자');
      return null;
    }

    console.log('서버 컴포넌트: 대시보드 데이터 페칭 시작');

    // 캐시된 인증 정보 가져오기
    const { user: userData, kol: kolData } = await getAuthenticatedKol();

    // 현재 월과 이전 월 계산
    const currentDate = getCurrentDate();
    const currentMonth = currentDate.substring(0, 7);
    const previousMonth = getPreviousMonth(currentDate);

    // 🚀 서버에서 병렬로 모든 데이터 조회
    const [
      shopsData,
      activitiesData
    ] = await Promise.all([
      // 전문점 데이터
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
          is_self_shop
        `)
        .eq('kol_id', kolData.id),
      
      // 영업 일지 데이터
      supabase
        .from('sales_activities')
        .select(`
          id,
          shop_id,
          activity_date,
          content,
          created_at
        `)
        .eq('kol_id', kolData.id)
        .order('activity_date', { ascending: false })
        .limit(10)
    ]);

    // 우선순위 로직으로 대시보드 메트릭 조회 - 표준 형식 우선
    let dashboardMetrics = null;
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"
    
    // 1단계: 표준 형식(YYYY-MM) 먼저 시도
    const { data: standardCurrentData, error: standardCurrentError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (standardCurrentError && standardCurrentError.code !== 'PGRST116') {
      console.error('서버: 표준 형식 대시보드 메트릭 조회 오류:', standardCurrentError);
    }

    if (standardCurrentData) {
      dashboardMetrics = standardCurrentData;
      console.log(`서버: 표준 형식 데이터 사용: ${currentMonth} for KOL ${kolData.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyCurrentData, error: legacyCurrentError } = await supabase
        .from('kol_dashboard_metrics')
        .select('*')
        .eq('kol_id', kolData.id)
        .eq('year_month', currentMonthCompact)
        .maybeSingle();

      if (legacyCurrentError && legacyCurrentError.code !== 'PGRST116') {
        console.error('서버: 레거시 형식 대시보드 메트릭 조회 오류:', legacyCurrentError);
      }

      if (legacyCurrentData) {
        dashboardMetrics = legacyCurrentData;
        console.log(`서버: 레거시 형식 데이터 사용: ${currentMonthCompact} for KOL ${kolData.id}`);
      } else {
        console.log(`서버: 대시보드 메트릭 데이터 없음: ${currentMonth}/${currentMonthCompact} for KOL ${kolData.id}`);
      }
    }

    // 우선순위 로직으로 이전 월 데이터 조회 - 표준 형식 우선
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
      console.error('서버: 표준 형식 이전 월 데이터 조회 오류:', standardPrevError);
    }

    if (standardPrevData) {
      previousMonthData = standardPrevData;
      console.log(`서버: 표준 형식 이전 월 데이터 사용: ${previousMonth} for KOL ${kolData.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyPrevData, error: legacyPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .select('monthly_sales, monthly_commission')
        .eq('kol_id', kolData.id)
        .eq('year_month', previousMonthCompact)
        .maybeSingle();

      if (legacyPrevError && legacyPrevError.code !== 'PGRST116') {
        console.error('서버: 레거시 형식 이전 월 데이터 조회 오류:', legacyPrevError);
      }

      if (legacyPrevData) {
        previousMonthData = legacyPrevData;
        console.log(`서버: 레거시 형식 이전 월 데이터 사용: ${previousMonthCompact} for KOL ${kolData.id}`);
      } else {
        console.log(`서버: 이전 월 데이터 없음: ${previousMonth}/${previousMonthCompact} for KOL ${kolData.id}`);
      }
    }

    // 오류 처리
    if (shopsData.error) {
      console.error('서버 컴포넌트: 전문점 데이터 조회 오류:', shopsData.error);
    }
    if (activitiesData.error) {
      console.error('서버 컴포넌트: 영업 일지 조회 오류:', activitiesData.error);
    }

    // 대시보드 데이터 구성
    const serverData: ServerDashboardData = {
      kol: {
        id: kolData.id,
        name: kolData.name,
        shopName: kolData.shop_name
      },
      sales: {
        currentMonth: dashboardMetrics?.monthly_sales || 0,
        previousMonth: previousMonthData?.monthly_sales || 0,
        growth: (dashboardMetrics?.monthly_sales || 0) - (previousMonthData?.monthly_sales || 0)
      },
      allowance: {
        currentMonth: dashboardMetrics?.monthly_commission || 0,
        previousMonth: previousMonthData?.monthly_commission || 0,
        growth: (dashboardMetrics?.monthly_commission || 0) - (previousMonthData?.monthly_commission || 0)
      },
      shops: {
        total: dashboardMetrics?.total_shops_count || 0,
        ordering: dashboardMetrics?.active_shops_count || 0,
        notOrdering: (dashboardMetrics?.total_shops_count || 0) - (dashboardMetrics?.active_shops_count || 0)
      },
      shopsData: shopsData.data || [],
      activitiesData: activitiesData.data || []
    };

    console.log('서버 컴포넌트: 데이터 페칭 완료');
    return serverData;

  } catch (error) {
    console.error('서버 컴포넌트: 데이터 페칭 오류:', error);
    return null;
  }
}

// 로딩 컴포넌트
function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-lg font-semibold">서버에서 데이터 로딩 중...</div>
          <div className="text-sm text-muted-foreground mt-2">초기 데이터를 준비하고 있습니다.</div>
        </div>
      </div>
    </div>
  );
}

// 메인 서버 컴포넌트
export default async function ServerDashboard() {
  const serverData = await fetchDashboardDataOnServer();

  if (!serverData) {
    // 서버에서 데이터를 가져올 수 없는 경우 클라이언트 전용 모드로 fallback
    return (
      <Suspense fallback={<DashboardLoading />}>
        <ClientDashboard initialData={null} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ClientDashboard initialData={serverData} />
    </Suspense>
  );
}