'use client';

import { Suspense } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ClientDashboard from './ClientDashboard';

// 🚀 클라이언트 컴포넌트에서 Convex 쿼리 사용 - 실시간 데이터

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

// 로딩 컴포넌트
function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-lg font-semibold">Convex에서 데이터 로딩 중...</div>
          <div className="mt-2 text-sm text-muted-foreground">
            실시간 데이터를 준비하고 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 클라이언트 컴포넌트
export default function ServerDashboard() {
  // Convex 쿼리를 사용하여 실시간 대시보드 데이터 조회
  const dashboardStats = useQuery(api.realtime.getKolDashboardStats, {});
  const shopsData = useQuery(api.shops.getShopsWithFilters, {});
  const salesJournalData = useQuery(api.salesJournal.getSalesJournals, {
    paginationOpts: { numItems: 10, cursor: null },
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // 로딩 중이면 로딩 컴포넌트 표시
  if (dashboardStats === undefined || shopsData === undefined || salesJournalData === undefined) {
    return <DashboardLoading />;
  }

  // 에러가 발생한 경우 fallback
  if (!dashboardStats || !shopsData) {
    return (
      <Suspense fallback={<DashboardLoading />}>
        <ClientDashboard initialData={null} />
      </Suspense>
    );
  }

  // Convex 데이터를 기존 인터페이스에 맞게 변환
  const transformedData: ServerDashboardData = {
    sales: {
      currentMonth: dashboardStats.sales.currentMonth || 0,
      previousMonth: dashboardStats.sales.lastMonth || 0,
      growth: dashboardStats.sales.growth || 0,
    },
    allowance: {
      currentMonth: dashboardStats.commission.currentMonth || 0,
      previousMonth: 0, // 이전 달 커미션은 별도 조회 필요
      growth: 0, // 성장률은 별도 계산 필요
    },
    shops: {
      total: dashboardStats.shops.total || 0,
      ordering: dashboardStats.shops.ordering || 0,
      notOrdering: dashboardStats.shops.notOrdering || 0,
    },
    recentActivities: salesJournalData?.page || [],
    shops_list: shopsData || [],
  };

  return (
    <Suspense fallback={<DashboardLoading />}>
      <ClientDashboard initialData={transformedData} />
    </Suspense>
  );
}
