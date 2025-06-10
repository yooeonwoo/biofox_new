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
      dashboardMetrics,
      previousMonthData,
      shopsData,
      activitiesData
    ] = await Promise.all([
      // 현재 월 대시보드 메트릭
      supabase
        .from('kol_dashboard_metrics')
        .select('*')
        .eq('kol_id', kolData.id)
        .eq('year_month', currentMonth)
        .maybeSingle(),
      
      // 이전 월 데이터
      supabase
        .from('kol_dashboard_metrics')
        .select('monthly_sales, monthly_commission')
        .eq('kol_id', kolData.id)
        .eq('year_month', previousMonth)
        .maybeSingle(),
      
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

    // 오류 처리
    if (dashboardMetrics.error) {
      console.error('서버 컴포넌트: 대시보드 메트릭 조회 오류:', dashboardMetrics.error);
    }
    if (previousMonthData.error) {
      console.log('서버 컴포넌트: 이전 월 데이터 조회 오류:', previousMonthData.error);
    }
    if (shopsData.error) {
      console.error('서버 컴포넌트: 전문점 데이터 조회 오류:', shopsData.error);
    }
    if (activitiesData.error) {
      console.error('서버 컴포넌트: 영업 일지 조회 오류:', activitiesData.error);
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics.data?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics.data?.monthly_commission || 0;
    const previousMonthSales = previousMonthData.data?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData.data?.monthly_commission || 0;
    const totalShops = dashboardMetrics.data?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics.data?.active_shops_count || 0;

    // 전문점 데이터 가공
    const formattedShops = (shopsData.data || [])
      .filter((shop: any) => !shop.is_self_shop) // 본인 샵 제외
      .map((shop: any) => ({
        id: shop.id,
        ownerName: shop.owner_name,
        shop_name: shop.shop_name || shop.owner_name,
        region: shop.region,
        status: shop.status,
        createdAt: shop.created_at,
        is_owner_kol: shop.is_owner_kol,
        sales: {
          total: 0, // 서버에서는 매출 데이터 제외 (클라이언트에서 추가 로드)
          product: 0,
          device: 0,
          hasOrdered: false
        }
      }));

    // 영업 일지 데이터 가공
    const formattedActivities = (activitiesData.data || []).map((act: any) => ({
      id: act.id,
      shopId: act.shop_id,
      shopName: null, // 서버에서는 간단한 데이터만
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
    const serverData: ServerDashboardData = {
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