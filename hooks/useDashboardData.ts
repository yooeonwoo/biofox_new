'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 🚀 Convex를 활용한 실시간 대시보드 데이터 관리

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
      is_self_shop: boolean;
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

export const useDashboardData = (kolId?: string) => {
  // 현재 월과 이전 월 계산
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  // Convex 쿼리들
  const currentMonthlySales = useQuery(api.orders.getMonthlySales, {
    shop_id: kolId as any,
    year: currentYear,
    month: currentMonth,
  });

  const previousMonthlySales = useQuery(api.orders.getMonthlySales, {
    shop_id: kolId as any,
    year: previousYear,
    month: previousMonth,
  });

  const subordinateShops = useQuery(api.relationships.getSubordinateShops, {
    parentId: kolId as any,
  });

  const allRelatedOrders = useQuery(api.relationships.getAllRelatedOrders, {
    profileId: kolId as any,
    includeSubordinates: true,
  });

  // 로딩 상태 체크
  const isLoading =
    currentMonthlySales === undefined ||
    previousMonthlySales === undefined ||
    subordinateShops === undefined ||
    allRelatedOrders === undefined;

  // 에러 상태 체크 (Convex는 자동으로 에러를 throw함)
  const isError = false;

  // 데이터 변환
  const data: DashboardData | undefined = isLoading
    ? undefined
    : {
        dashboard: {
          kol: {
            id: parseInt(kolId || '0'),
            name: 'KOL 이름', // TODO: 실제 KOL 정보에서 가져오기
            shopName: 'KOL 매장명',
          },
          sales: {
            currentMonth: currentMonthlySales?.totalSales || 0,
            previousMonth: previousMonthlySales?.totalSales || 0,
            growth: calculateGrowth(
              currentMonthlySales?.totalSales || 0,
              previousMonthlySales?.totalSales || 0
            ),
          },
          allowance: {
            currentMonth: currentMonthlySales?.totalCommission || 0,
            previousMonth: previousMonthlySales?.totalCommission || 0,
            growth: calculateGrowth(
              currentMonthlySales?.totalCommission || 0,
              previousMonthlySales?.totalCommission || 0
            ),
          },
          shops: {
            total: subordinateShops?.length || 0,
            ordering: calculateOrderingShops(subordinateShops || [], allRelatedOrders || []),
            notOrdering: calculateNotOrderingShops(subordinateShops || [], allRelatedOrders || []),
          },
        },
        shops: {
          shops: transformShopsData(subordinateShops || [], allRelatedOrders || []),
          meta: {
            totalShopsCount: subordinateShops?.length || 0,
            activeShopsCount: calculateActiveShops(subordinateShops || []),
          },
        },
        activities: transformActivitiesData(allRelatedOrders || []),
      };

  return {
    data,
    isLoading,
    isError,
    error: null,
    refetch: () => {}, // Convex automatically refetches, so this is a no-op
  };
};

// 헬퍼 함수들
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function calculateOrderingShops(shops: any[], orders: any[]): number {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthStart = new Date(currentYear, currentMonth - 1, 1).getTime();
  const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999).getTime();

  const shopsWithOrders = new Set(
    orders
      .filter(order => order.order_date >= currentMonthStart && order.order_date <= currentMonthEnd)
      .map(order => order.shop_id)
  );

  return shops.filter(shop => shopsWithOrders.has(shop._id)).length;
}

function calculateNotOrderingShops(shops: any[], orders: any[]): number {
  const total = shops.length;
  const ordering = calculateOrderingShops(shops, orders);
  return total - ordering;
}

function calculateActiveShops(shops: any[]): number {
  return shops.filter(shop => shop.status === 'approved').length;
}

function transformShopsData(shops: any[], orders: any[]): any[] {
  return shops.map(shop => {
    const shopOrders = orders.filter(order => order.shop_id === shop._id);
    const totalSales = shopOrders.reduce((sum, order) => sum + order.total_amount, 0);

    return {
      id: parseInt(shop._id.replace(/[^0-9]/g, '') || '0'),
      ownerName: shop.name,
      shop_name: shop.shop_name,
      region: shop.region || '',
      status: shop.status,
      createdAt: new Date(shop._creationTime).toISOString(),
      is_self_shop: false, // TODO: 실제 로직으로 판단
      sales: {
        total: totalSales,
        product: totalSales, // TODO: 상품별 분리 필요시
        device: 0, // TODO: 디바이스 매출 분리 필요시
        hasOrdered: shopOrders.length > 0,
      },
    };
  });
}

function transformActivitiesData(orders: any[]): any[] {
  return orders
    .slice(0, 10) // 최신 10개만
    .map((order, index) => ({
      id: index + 1,
      shopId: parseInt(order.shop_id.replace(/[^0-9]/g, '') || '0'),
      shopName: order.shop_name || '매장명 없음',
      activityDate: new Date(order.order_date).toISOString(),
      content: `주문 생성: ${order.order_number || 'N/A'}`,
      createdAt: new Date(order.created_at).toISOString(),
      timeAgo: getTimeAgo(order.created_at),
    }));
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}
