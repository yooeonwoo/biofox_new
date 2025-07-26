'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// 🚀 완전히 새로운 Convex 기반 Dashboard 데이터 관리

interface DashboardData {
  kol: {
    id: string;
    name: string;
    shopName: string;
    email: string;
    role: string;
  };
  stats: {
    currentMonth: {
      sales: number;
      commission: number;
      orderCount: number;
    };
    previousMonth: {
      sales: number;
      commission: number;
      orderCount: number;
    };
    growth: {
      sales: number;
      commission: number;
    };
  };
  shops: {
    total: number;
    ordering: number;
    notOrdering: number;
    list: Array<{
      id: string;
      ownerName: string;
      shopName: string;
      region: string;
      status: string;
      createdAt: string;
      sales: {
        total: number;
        hasOrdered: boolean;
      };
    }>;
  };
  activities: Array<{
    id: string;
    type: 'order' | 'journal' | 'relationship';
    title: string;
    content: string;
    shopName?: string;
    date: string;
    timeAgo: string;
  }>;
}

/**
 * 완전히 새로운 Dashboard 데이터 훅 - Convex 실시간 동기화
 * @param kolId KOL 프로필 ID (Convex ID)
 */
export const useDashboardData = (kolId?: string | Id<'profiles'>) => {
  // KOL 기본 정보
  const kolProfile = useQuery(
    api.profiles.getProfileById,
    kolId ? { profileId: kolId as Id<'profiles'> } : 'skip'
  );

  // Dashboard 통계 (매출, 수수료, 성장률)
  const dashboardStats = useQuery(
    api.orders.getDashboardStats,
    kolId ? { kolId: kolId as Id<'profiles'> } : 'skip'
  );

  // 하위 매장 목록
  const subordinateShops = useQuery(
    api.relationships.getSubordinateShops,
    kolId ? { parentId: kolId as Id<'profiles'> } : 'skip'
  );

  // 최근 주문 (활동 피드용)
  const recentOrders = useQuery(
    api.relationships.getAllRelatedOrders,
    kolId
      ? {
          profileId: kolId as Id<'profiles'>,
          includeSubordinates: true,
        }
      : 'skip'
  );

  // 로딩 상태
  const isLoading =
    kolProfile === undefined ||
    dashboardStats === undefined ||
    subordinateShops === undefined ||
    recentOrders === undefined;

  // 에러 상태 (Convex는 자동으로 에러를 throw하므로 일반적으로 false)
  const isError = false;

  // 데이터 변환 및 조합
  const data: DashboardData | undefined = isLoading
    ? undefined
    : {
        // KOL 기본 정보
        kol: {
          id: kolProfile?._id || '',
          name: kolProfile?.name || 'Unknown',
          shopName: kolProfile?.shop_name || 'Unknown Shop',
          email: kolProfile?.email || '',
          role: kolProfile?.role || 'kol',
        },

        // 통계 정보
        stats: dashboardStats || {
          currentMonth: { sales: 0, commission: 0, orderCount: 0 },
          previousMonth: { sales: 0, commission: 0, orderCount: 0 },
          growth: { sales: 0, commission: 0 },
        },

        // 매장 정보
        shops: {
          total: subordinateShops?.length || 0,
          ordering: calculateOrderingShops(subordinateShops || [], recentOrders || []),
          notOrdering: calculateNotOrderingShops(subordinateShops || [], recentOrders || []),
          list: transformShopsData(subordinateShops || [], recentOrders || []),
        },

        // 활동 피드
        activities: combineActivities(recentOrders || []),
      };

  return {
    data,
    isLoading,
    isError,
    error: null,
    // Convex는 자동으로 실시간 업데이트하므로 refetch는 no-op
    refetch: () => Promise.resolve(),
  };
};

// === 헬퍼 함수들 ===

/**
 * 이번 달 주문한 매장 수 계산
 */
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

/**
 * 이번 달 주문하지 않은 매장 수 계산
 */
function calculateNotOrderingShops(shops: any[], orders: any[]): number {
  const total = shops.length;
  const ordering = calculateOrderingShops(shops, orders);
  return total - ordering;
}

/**
 * 매장 데이터 변환
 */
function transformShopsData(shops: any[], orders: any[]): any[] {
  return shops.map(shop => {
    const shopOrders = orders.filter(order => order.shop_id === shop._id);
    const totalSales = shopOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      id: shop._id,
      ownerName: shop.name || 'Unknown',
      shopName: shop.shop_name || 'Unknown Shop',
      region: shop.region || '',
      status: shop.status || 'pending',
      createdAt: new Date(shop._creationTime || Date.now()).toISOString(),
      sales: {
        total: totalSales,
        hasOrdered: shopOrders.length > 0,
      },
    };
  });
}

/**
 * 영업일지와 주문 데이터를 결합하여 활동 피드 생성
 */
function combineActivities(orders: any[]): any[] {
  const activities: any[] = [];

  // 최근 주문 활동 추가
  orders.slice(0, 8).forEach((order, index) => {
    activities.push({
      id: `order-${order._id}`,
      type: 'order' as const,
      title: '새 주문 접수',
      content: `주문번호: ${order.order_number || '미정'} (${formatCurrency(order.total_amount || 0)})`,
      shopName: order.shop_name,
      date: new Date(order.order_date || order.created_at).toISOString(),
      timeAgo: getTimeAgo(order.order_date || order.created_at),
    });
  });

  // 날짜순 정렬 (최신 순)
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8); // 최대 8개 활동만 표시
}

/**
 * 상대적 시간 표시 (예: "2시간 전")
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * 통화 포맷팅
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 타입 정의 export
export type { DashboardData };
