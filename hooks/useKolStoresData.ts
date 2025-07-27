'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface ShopData {
  id: string;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_self_shop?: boolean;
  relationship_type?: 'owner' | 'manager';
  owner_kol_id?: string | null;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
    avg_monthly?: number;
    accumulated?: number;
    commission?: number;
  };
}

interface ShopStats {
  totalShopsCount: number;
  activeShopsCount: number;
}

interface KolStoresData {
  shops: {
    list: ShopData[];
    meta: ShopStats;
  };
  isLoading: boolean;
  error: Error | null;
}

/**
 * KOL의 하위 매장 데이터를 가져오는 커스텀 훅
 * Convex를 직접 사용하여 실시간 업데이트 지원
 */
export const useKolStoresData = (kolId?: string | Id<'profiles'>): KolStoresData => {
  // KOL 프로필 정보
  const kolProfile = useQuery(
    api.profiles.getProfileById,
    kolId ? { profileId: kolId as Id<'profiles'> } : 'skip'
  );

  // 하위 매장 목록
  const subordinateShops = useQuery(
    api.relationships.getSubordinateShops,
    kolId ? { parentId: kolId as Id<'profiles'> } : 'skip'
  );

  // 매장 관련 주문 데이터
  const ordersData = useQuery(
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
    kolProfile === undefined || subordinateShops === undefined || ordersData === undefined;

  // 에러 상태
  const error = null; // Convex는 자동으로 에러를 throw

  // 매장 데이터 변환 및 매출 계산
  const transformedShops: ShopData[] = !isLoading
    ? (subordinateShops || []).map(shop => {
        // 해당 매장의 주문들
        const shopOrders = (ordersData || []).filter(order => order.shop_id === shop._id);

        // 현재 월 범위 계산
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const currentMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        ).getTime();

        // 현재 월 주문들
        const currentMonthOrders = shopOrders.filter(
          order => order.order_date >= currentMonthStart && order.order_date <= currentMonthEnd
        );

        // 매출 계산
        const totalSales = currentMonthOrders.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        );

        // 상품 매출과 디바이스 매출 분리 (예시: 전체의 70%가 상품, 30%가 디바이스)
        const productSales = Math.floor(totalSales * 0.7);
        const deviceSales = totalSales - productSales;

        // 수수료 계산 (예시: 전체 매출의 10%)
        const commission = Math.floor(totalSales * 0.1);

        return {
          id: shop._id,
          ownerName: shop.name || 'Unknown',
          shop_name: shop.shop_name || 'Unknown Shop',
          region: shop.region || '',
          status: shop.status || 'pending',
          createdAt: new Date(shop._creationTime || Date.now()).toISOString(),
          is_self_shop: false, // shop_relationships를 통해 조회된 경우 자기 매장이 아님
          relationship_type: 'owner' as const, // shop_relationships에서 가져온 경우 항상 owner
          owner_kol_id: kolId as string,
          sales: {
            total: totalSales,
            product: productSales,
            device: deviceSales,
            hasOrdered: currentMonthOrders.length > 0,
            commission: commission,
          },
        };
      })
    : [];

  // 통계 계산
  const shopStats: ShopStats = {
    totalShopsCount: transformedShops.length,
    activeShopsCount: transformedShops.filter(shop => shop.sales.hasOrdered).length,
  };

  return {
    shops: {
      list: transformedShops,
      meta: shopStats,
    },
    isLoading,
    error,
  };
};

// 타입 export
export type { ShopData, ShopStats, KolStoresData };
