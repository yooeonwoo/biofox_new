'use client';

import { useQuery } from '@tanstack/react-query';

// 🚀 React Query를 활용한 대시보드 데이터 캐싱 및 상태 관리

interface DashboardData {
  dashboard: {
    kol: {
      id: number;
      name: string;
      shopName: string;
    };
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
  };
  shops: {
    shops: Array<{
      id: number;
      ownerName: string;
      shop_name: string;
      region: string;
      status: string;
      createdAt: string;
      is_owner_kol: boolean;
      sales: {
        total: number;
        product: number;
        device: number;
        hasOrdered: boolean;
      };
    }>;
    meta: {
      totalShopsCount: number;
      activeShopsCount: number;
    };
  };
  activities: Array<{
    id: number;
    shopId: number | null;
    shopName: string | null;
    activityDate: string;
    content: string;
    createdAt: string;
    timeAgo: string;
  }>;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch('/api/kol-new/dashboard-complete', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`대시보드 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
};

export const useDashboardData = (initialData?: DashboardData | null) => {
  return useQuery({
    queryKey: ['dashboard-complete'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    retry: 2, // 대시보드는 중요하므로 2번 재시도
    refetchOnWindowFocus: true, // 창 포커스시 최신 데이터 확인
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
    initialData: initialData || undefined, // 서버에서 전달받은 초기 데이터 활용
    enabled: true, // 항상 활성화 (서버 데이터가 있어도 클라이언트에서 최신 데이터 확인)
  });
};