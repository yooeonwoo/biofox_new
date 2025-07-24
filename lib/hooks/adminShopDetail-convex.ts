/**
 * Admin Shop Detail 관리 훅 - Convex 기반 전환
 * 기존 fetch 호출을 Convex 실시간 동기화로 대체
 */

'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// 타입 정의
interface ShopDetail {
  id: string;
  shopName: string;
  ownerName: string;
  region?: string;
  status: string;
  contractDate?: string;
  createdAt: string;
  updatedAt: string;
  // KOL 관계 정보
  parentKol?: {
    id: string;
    name: string;
    shopName: string;
  };
  // 디바이스 정보
  deviceInfo?: {
    totalSold: number;
    totalReturned: number;
    netSold: number;
  };
  // 메타데이터
  metadata?: any;
}

interface AllocationRow {
  id: string;
  allocatedAt: string;
  tierFixedAmount: number;
  userInputDeduct: number;
  payToKol: number;
  note: string | null;
}

/**
 * 매장 상세 정보 조회 훅 (실시간 동기화)
 */
export function useAdminShopDetail(shopId: string | null) {
  // 매장 프로필 조회
  const shopProfile = useQuery(
    api.profiles.getProfileById,
    shopId ? { profileId: shopId as Id<'profiles'> } : 'skip'
  );

  // 매장-KOL 관계 조회
  const relationships = useQuery(
    api.relationships.getRelationships,
    shopId ? { shop_id: shopId as Id<'profiles'> } : 'skip'
  );

  // 디바이스 정보 조회 (KOL 누적 통계에서)
  const deviceStats = useQuery(
    api.orders.getMonthlySales, // 임시로 사용, 향후 device 전용 쿼리 필요
    shopId
      ? {
          shop_id: shopId as Id<'profiles'>,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }
      : 'skip'
  );

  // Loading 상태 처리
  if (shopId && (shopProfile === undefined || relationships === undefined)) {
    return {
      data: undefined,
      isLoading: true,
      isError: false,
    };
  }

  if (!shopId || !shopProfile) {
    return {
      data: null,
      isLoading: false,
      isError: false,
    };
  }

  // 상위 KOL 정보 추출
  const parentRelation = relationships?.find(r => r.parent_id);
  let parentKol = undefined;

  if (parentRelation?.parent_id) {
    // 별도 쿼리로 KOL 정보 조회 (실제로는 추가 useQuery 필요)
    parentKol = {
      id: parentRelation.parent_id,
      name: 'KOL Name', // 실제로는 profiles 테이블에서 조회 필요
      shopName: 'KOL Shop', // 실제로는 profiles 테이블에서 조회 필요
    };
  }

  // 데이터 변환
  const shopDetail: ShopDetail = {
    id: shopProfile._id,
    shopName: shopProfile.shop_name || shopProfile.name,
    ownerName: shopProfile.name,
    region: shopProfile.region,
    status: shopProfile.status || 'pending',
    contractDate: undefined, // contract_date 필드가 스키마에 없음
    createdAt: new Date(shopProfile._creationTime).toISOString(),
    updatedAt: new Date(shopProfile.updated_at || shopProfile._creationTime).toISOString(),
    parentKol,
    deviceInfo: {
      totalSold: 0, // 향후 device_sales 테이블에서 집계
      totalReturned: 0,
      netSold: 0,
    },
    metadata: shopProfile.metadata,
  };

  return {
    data: shopDetail,
    isLoading: false,
    isError: false,
  };
}

/**
 * 매장 할당 이력 조회 훅 (실시간 동기화)
 * ⚠️ 현재 Convex에 allocations 테이블이 없어서 플레이스홀더 구현
 */
export function useShopAllocations(shopId: string | null) {
  // TODO: 향후 allocations 테이블 생성 후 실제 구현
  // 현재는 빈 데이터 반환

  if (!shopId) {
    return {
      data: { pages: [] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      fetchNextPage: () => Promise.resolve(),
    };
  }

  // 플레이스홀더 데이터
  const mockAllocations: AllocationRow[] = [
    {
      id: `mock_${shopId}_1`,
      allocatedAt: new Date().toISOString(),
      tierFixedAmount: 0,
      userInputDeduct: 0,
      payToKol: 0,
      note: '⚠️ 실제 할당 데이터는 향후 구현 예정',
    },
  ];

  return {
    data: {
      pages: [{ rows: mockAllocations, nextPage: undefined }],
    },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    fetchNextPage: () => Promise.resolve(),
  };
}

/**
 * 매장별 디바이스 판매 통계 조회 훅
 */
export function useShopDeviceStats(shopId: string | null) {
  // 향후 device_sales 테이블과 연동
  const deviceSales = useQuery(
    api.profiles.getProfileById, // 임시로 사용
    shopId ? { profileId: shopId as Id<'profiles'> } : 'skip'
  );

  if (!shopId || deviceSales === undefined) {
    return {
      data: undefined,
      isLoading: true,
    };
  }

  // 플레이스홀더 통계
  const stats = {
    totalDevicesSold: 0,
    totalDevicesReturned: 0,
    netDevicesSold: 0,
    totalCommission: 0,
    lastSaleDate: null,
    // 향후 실제 device_sales 데이터로 교체
  };

  return {
    data: stats,
    isLoading: false,
  };
}
