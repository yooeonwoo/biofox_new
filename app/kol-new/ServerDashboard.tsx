import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentDate, getPreviousMonth, getCurrentYearMonth } from '@/lib/date-utils';
import ClientDashboard from './ClientDashboard';

// 🚀 서버 컴포넌트에서 데이터 페칭 - SSR 성능 최적화

interface ServerDashboardData {
  sales: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  allowance: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  shops: {
    total: number;
    ordering: number;
    notOrdering: number;
  };
  recentActivities: any[];
  shops_list: any[];
}

async function fetchDashboardDataOnServer(): Promise<ServerDashboardData | null> {
  try {
    // 로컬 개발환경용 임시 KOL 정보
    const tempKol = {
      id: 1,
      name: '테스트 사용자',
      shopName: '테스트 샵',
      userId: 'temp-user-id'
    };

    console.log('서버 컴포넌트: 대시보드 데이터 페칭 시작');

    // 현재 월과 이전 월 계산
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentYearMonth();
    const previousMonth = getPreviousMonth(currentDate);

    // 레거시 호환성을 위한 YYYYMM 형식
    const currentMonthCompact = currentMonth.replace('-', '');
    const previousMonthCompact = previousMonth.replace('-', '');

    // 병렬 데이터 페칭
    const [
      { data: shops, error: shopsError },
      { data: journalData, error: journalError },
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
        .eq('kol_id', tempKol.id),
      
      // 영업 일지 데이터
      supabase
        .from('sales_journal')
        .select(`
          id,
          shop_name,
          activity_type,
          activity_content,
          activity_date,
          created_at
        `)
        .eq('kol_id', tempKol.id)
        .order('activity_date', { ascending: false })
        .limit(10)
    ]);

    // 우선순위 로직으로 대시보드 메트릭 조회 - 표준 형식 우선
    let dashboardMetrics = null;
    
    // 1단계: 표준 형식(YYYY-MM) 먼저 시도
    const { data: standardCurrentData, error: standardCurrentError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', tempKol.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (standardCurrentError && standardCurrentError.code !== 'PGRST116') {
      console.error('표준 형식 대시보드 메트릭 조회 오류:', standardCurrentError);
    }

    if (standardCurrentData) {
      dashboardMetrics = standardCurrentData;
      console.log(`서버: 표준 형식 데이터 사용: ${currentMonth} for KOL ${tempKol.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyCurrentData, error: legacyCurrentError } = await supabase
        .from('kol_dashboard_metrics')
        .select('*')
        .eq('kol_id', tempKol.id)
        .eq('year_month', currentMonthCompact)
        .maybeSingle();

      if (legacyCurrentError && legacyCurrentError.code !== 'PGRST116') {
        console.error('레거시 형식 대시보드 메트릭 조회 오류:', legacyCurrentError);
      }

      if (legacyCurrentData) {
        dashboardMetrics = legacyCurrentData;
        console.log(`서버: 레거시 형식 데이터 사용: ${currentMonthCompact} for KOL ${tempKol.id}`);
      } else {
        console.log(`서버: 대시보드 메트릭 데이터 없음: ${currentMonth}/${currentMonthCompact} for KOL ${tempKol.id}`);
      }
    }

    // 우선순위 로직으로 이전 월 데이터 조회 - 표준 형식 우선
    let previousMonthData = null;
    
    // 1단계: 표준 형식(YYYY-MM) 먼저 시도
    const { data: standardPrevData, error: standardPrevError } = await supabase
      .from('kol_dashboard_metrics')
      .select('monthly_sales, monthly_commission')
      .eq('kol_id', tempKol.id)
      .eq('year_month', previousMonth)
      .maybeSingle();

    if (standardPrevError && standardPrevError.code !== 'PGRST116') {
      console.error('표준 형식 이전 월 데이터 조회 오류:', standardPrevError);
    }

    if (standardPrevData) {
      previousMonthData = standardPrevData;
      console.log(`서버: 표준 형식 이전 월 데이터 사용: ${previousMonth} for KOL ${tempKol.id}`);
    } else {
      // 2단계: 레거시 형식(YYYYMM) 시도
      const { data: legacyPrevData, error: legacyPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .select('monthly_sales, monthly_commission')
        .eq('kol_id', tempKol.id)
        .eq('year_month', previousMonthCompact)
        .maybeSingle();

      if (legacyPrevError && legacyPrevError.code !== 'PGRST116') {
        console.error('레거시 형식 이전 월 데이터 조회 오류:', legacyPrevError);
      }

      if (legacyPrevData) {
        previousMonthData = legacyPrevData;
        console.log(`서버: 레거시 형식 이전 월 데이터 사용: ${previousMonthCompact} for KOL ${tempKol.id}`);
      } else {
        console.log(`서버: 이전 월 데이터 없음: ${previousMonth}/${previousMonthCompact} for KOL ${tempKol.id}`);
      }
    }

    // 오류 처리
    if (shopsError) {
      console.error('전문점 데이터 조회 오류:', shopsError);
    }
    if (journalError) {
      console.error('영업 일지 데이터 조회 오류:', journalError);
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics?.monthly_commission || 0;
    const previousMonthSales = previousMonthData?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData?.monthly_commission || 0;
    const totalShops = dashboardMetrics?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics?.active_shops_count || 0;

    const serverData: ServerDashboardData = {
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
      },
      recentActivities: journalData || [],
      shops_list: shops || []
    };

    console.log('서버 컴포넌트: 대시보드 데이터 페칭 완료');
    return serverData;

  } catch (error) {
    console.error('서버 대시보드 데이터 페칭 오류:', error);
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
  const initialData = await fetchDashboardDataOnServer();

  if (!initialData) {
    // 서버에서 데이터를 가져올 수 없는 경우 클라이언트 전용 모드로 fallback
    return (
      <Suspense fallback={<DashboardLoading />}>
        <ClientDashboard initialData={null} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ClientDashboard initialData={initialData} />
    </Suspense>
  );
}