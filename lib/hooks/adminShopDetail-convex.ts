/**
 * Admin Shop Detail 관리 훅 - Convex 기반 실시간 동기화
 * ShopDetailDrawer 컴포넌트를 위한 관계형 데이터 조회 시스템
 */

'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMemo, useState, useCallback } from 'react';
import {
  mapShopDetailData,
  mapAllocationsBatch,
  safeMapShopDetailData,
  safeMapAllocationsBatch,
  ConvexShopDetail,
  ConvexAllocation,
  UIShopDetail,
  UIAllocationRow,
} from '@/lib/utils/data-mappers';

// ================================
// 타입 정의
// ================================

// 매장 상세 정보 조회 결과
export interface AdminShopDetailResult {
  shop: UIShopDetail | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

// 할당 데이터 조회 결과 (페이지네이션)
export interface ShopAllocationsResult {
  data?: {
    pages: Array<{
      rows: UIAllocationRow[];
      nextPage?: number;
    }>;
  };
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

// ================================
// ID 변환 유틸리티
// ================================

/**
 * number ID를 Convex 호환 string ID로 변환
 */
const convertToConvexId = (shopId: number | null): Id<'profiles'> | null => {
  if (!shopId) return null;

  // 임시 변환 로직 - 실제로는 ID 매핑 테이블이 필요
  // 현재는 'k' 접두사를 붙여서 변환
  return `k${shopId}` as Id<'profiles'>;
};

// ================================
// 매장 상세 정보 조회 훅
// ================================

/**
 * 매장 상세 정보를 실시간으로 조회하는 훅
 * 관계형 데이터 (KOL 정보, 디바이스 통계 등) 포함
 */
export function useAdminShopDetail(shopId: number | null): AdminShopDetailResult {
  // ID 변환
  const convexShopId = useMemo(() => convertToConvexId(shopId), [shopId]);

  // Convex 쿼리로 매장 상세 정보 조회
  const shopData = useQuery(
    api.shops.getShopDetailWithRelations,
    convexShopId ? { shopId: convexShopId } : 'skip'
  );

  // 데이터 매핑 및 안전성 처리
  const mappedShop = useMemo(() => {
    if (!shopData) return null;
    return safeMapShopDetailData(shopData);
  }, [shopData]);

  // 로딩 및 에러 상태 관리
  const isLoading = shopData === undefined && !!convexShopId;
  const isError = shopData === null && !!convexShopId;

  return {
    shop: mappedShop,
    isLoading,
    isError,
    ...(isError && { error: new Error('Failed to fetch shop detail') }),
  };
}

// ================================
// 매장 할당 데이터 조회 훅 (페이지네이션)
// ================================

/**
 * 매장의 할당(디바이스 판매) 데이터를 페이지네이션으로 조회하는 훅
 */
export function useShopAllocations(shopId: number | null): ShopAllocationsResult {
  // ID 변환
  const convexShopId = useMemo(() => convertToConvexId(shopId), [shopId]);

  // 기본 데이터 조회 (첫 페이지만)
  const allocationData = useQuery(
    api.shops.getShopAllocations,
    convexShopId ? { shopId: convexShopId } : 'skip'
  );

  // 데이터 매핑
  const mappedData = useMemo(() => {
    if (!allocationData) {
      return {
        pages: [],
      };
    }

    const mappedRows = safeMapAllocationsBatch(allocationData);
    return {
      pages: [
        {
          rows: mappedRows,
          nextPage: mappedRows.length >= 20 ? 2 : undefined,
        },
      ],
    };
  }, [allocationData]);

  // 상태 관리
  const isLoading = allocationData === undefined && !!convexShopId;
  const isError = allocationData === null && !!convexShopId;
  const hasNextPage = mappedData.pages[0]?.nextPage !== undefined;

  // 다음 페이지 로드 함수 (현재는 플레이스홀더)
  const fetchNextPage = useCallback(() => {
    // TODO: 향후 실제 페이지네이션 구현
    console.log('fetchNextPage called - not implemented yet');
  }, []);

  return {
    data: mappedData,
    isLoading,
    isError,
    ...(isError && { error: new Error('Failed to fetch shop allocations') }),
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: false,
  };
}

// ================================
// 매장 디바이스 통계 조회 훅
// ================================

/**
 * 매장의 디바이스 통계를 조회하는 훅
 */
export function useShopDeviceStats(shopId: number | null) {
  const convexShopId = useMemo(() => convertToConvexId(shopId), [shopId]);

  const deviceStats = useQuery(
    api.shops.getShopDeviceStats,
    convexShopId ? { shopId: convexShopId } : 'skip'
  );

  return {
    data: deviceStats || {
      totalDevices: 0,
      activeDevices: 0,
      totalSales: 0,
      totalCommission: 0,
      tier1_4Count: 0,
      tier5PlusCount: 0,
      lastSaleDate: null,
    },
    isLoading: deviceStats === undefined && !!convexShopId,
    isError: deviceStats === null && !!convexShopId,
  };
}

// ================================
// 통합 매장 정보 조회 훅
// ================================

/**
 * 매장 상세 정보, 할당 데이터, 디바이스 통계를 한 번에 조회하는 통합 훅
 * 성능 최적화를 위해 필요한 데이터만 선택적으로 로드
 */
export function useShopDetailComplete(
  shopId: number | null,
  options: {
    includeAllocations?: boolean;
    includeDeviceStats?: boolean;
    allocationPageSize?: number;
  } = {}
) {
  const { includeAllocations = true, includeDeviceStats = true, allocationPageSize = 20 } = options;

  // 기본 매장 정보
  const shopDetail = useAdminShopDetail(shopId);

  // 할당 데이터 (선택사항)
  const allocations = useShopAllocations(includeAllocations ? shopId : null);

  // 디바이스 통계 (선택사항)
  const deviceStats = useShopDeviceStats(includeDeviceStats ? shopId : null);

  return {
    shop: shopDetail.shop,
    allocations: includeAllocations ? allocations : null,
    deviceStats: includeDeviceStats ? deviceStats : null,

    // 통합 로딩 상태
    isLoading:
      shopDetail.isLoading ||
      (includeAllocations && allocations.isLoading) ||
      (includeDeviceStats && deviceStats.isLoading),

    // 통합 에러 상태
    isError:
      shopDetail.isError ||
      (includeAllocations && allocations.isError) ||
      (includeDeviceStats && deviceStats.isError),

    // 개별 상태
    shopLoading: shopDetail.isLoading,
    allocationsLoading: allocations.isLoading,
    deviceStatsLoading: deviceStats.isLoading,

    shopError: shopDetail.isError,
    allocationsError: allocations.isError,
    deviceStatsError: deviceStats.isError,
  };
}

// ================================
// 레거시 호환성 래퍼
// ================================

/**
 * 기존 useAdminShopDetail 훅과의 호환성을 위한 래퍼
 * 점진적 마이그레이션을 위해 제공
 */
export const useAdminShopDetailLegacy = useAdminShopDetail;

/**
 * 기존 useShopAllocations 훅과의 호환성을 위한 래퍼
 */
export const useShopAllocationsLegacy = useShopAllocations;
