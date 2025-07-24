/**
 * Admin New Shops 관리 훅 - Convex 기반 실시간 동기화
 * 기존 adminNewShops.ts를 대체하는 실시간 매장 관리 시스템
 */

'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMemo } from 'react';

// AdminNewShopRow 인터페이스 (기존 호환성 유지)
export interface AdminNewShopRow {
  id: number; // 컴포넌트 호환성을 위해 number 유지
  shopName: string;
  region: string | null;
  status: string;
  kolName: string | null;
  deviceCnt: number;
  contractDate: string | null;
}

// 필터링 파라미터
interface AdminShopsFilters {
  kolId?: string; // Convex ID (string)
  search?: string;
  status?: string;
}

/**
 * ID 변환 유틸리티
 */
class AdminShopsIdAdapter {
  /**
   * Convex string ID를 number로 변환 (임시 해결책)
   * 실제로는 해시나 더 안전한 방법 사용 필요
   */
  static convexIdToNumber(convexId: string): number {
    // Convex ID의 해시값을 number로 변환
    let hash = 0;
    for (let i = 0; i < convexId.length; i++) {
      const char = convexId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * number ID를 Convex string ID로 변환하는 시도
   * 실제로는 ID 매핑 테이블이나 다른 방법 필요
   */
  static numberToConvexId(numberId: number): string | null {
    // 임시로 string 변환 (실제로는 매핑 테이블 필요)
    return `k${Math.abs(numberId)}` as Id<'profiles'>;
  }

  /**
   * KOL ID 변환 (number → string)
   */
  static convertKolId(kolId: number | string | null): string | null {
    if (kolId === null || kolId === undefined) return null;

    if (typeof kolId === 'string') {
      return kolId;
    }

    // number인 경우 변환 시도
    return this.numberToConvexId(kolId);
  }
}

/**
 * 실시간 매장 목록 조회 훅 (KOL ID 필터링 지원)
 */
export function useAdminShops(filters: AdminShopsFilters = {}) {
  // 1. KOL 프로필들 조회 (승인된 KOL/OL만)
  const kolProfiles = useQuery(api.profiles.getProfilesByRole, {
    role: 'kol' as const,
  });

  const olProfiles = useQuery(api.profiles.getProfilesByRole, {
    role: 'ol' as const,
  });

  // 2. 매장 프로필들 조회 (shop_owner 역할)
  const shopProfiles = useQuery(api.profiles.getProfilesByRole, {
    role: 'shop_owner' as const,
  });

  // 3. 활성 매장 관계들 조회
  const shopRelationships = useQuery(api.relationships.getRelationships, {
    active_only: true,
  });

  // 로딩 상태 처리
  const isLoading =
    kolProfiles === undefined ||
    olProfiles === undefined ||
    shopProfiles === undefined ||
    shopRelationships === undefined;

  // 데이터 변환 및 필터링
  const data = useMemo(() => {
    if (isLoading) return [];

    // KOL/OL 프로필들을 하나로 합치기
    const allKols = [...(kolProfiles || []), ...(olProfiles || [])];

    // 매장 데이터 변환
    let shops: AdminNewShopRow[] = (shopProfiles || []).map(shop => {
      // 해당 매장의 활성 관계 찾기
      const activeRelationship = (shopRelationships || []).find(
        rel => rel.shop_owner_id === shop._id && rel.is_active
      );

      // 관련 KOL 찾기
      let kolName: string | null = null;
      if (activeRelationship?.parent_id) {
        const kol = allKols.find(k => k._id === activeRelationship.parent_id);
        kolName = kol?.name || null;
      }

      return {
        id: AdminShopsIdAdapter.convexIdToNumber(shop._id), // number로 변환
        shopName: shop.shop_name || shop.name,
        region: shop.region || null,
        status: shop.status || 'pending',
        kolName,
        deviceCnt: 0, // TODO: 향후 device_sales 테이블과 연동
        contractDate: null, // TODO: 향후 metadata에서 추출
      };
    });

    // 필터링 적용
    if (filters.kolId) {
      // KOL ID로 필터링
      const targetKolId = filters.kolId;
      const relatedShopIds = (shopRelationships || [])
        .filter(rel => rel.parent_id === targetKolId && rel.is_active)
        .map(rel => rel.shop_owner_id);

      shops = shops.filter(shop => {
        const shopConvexId = `k${Math.abs(shop.id)}` as Id<'profiles'>;
        return relatedShopIds.includes(shopConvexId);
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      shops = shops.filter(
        shop =>
          shop.shopName.toLowerCase().includes(searchLower) ||
          (shop.kolName && shop.kolName.toLowerCase().includes(searchLower)) ||
          (shop.region && shop.region.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status) {
      shops = shops.filter(shop => shop.status === filters.status);
    }

    return shops;
  }, [kolProfiles, olProfiles, shopProfiles, shopRelationships, filters, isLoading]);

  return {
    data,
    isLoading,
    isError: false, // TODO: 에러 처리 개선
  };
}

/**
 * 레거시 호환용 기본 내보내기
 */
export function useAdminNewShops(params: { kolId?: string } = {}) {
  console.warn('⚠️ useAdminNewShops는 deprecated입니다. useAdminShops를 사용하세요.');
  return useAdminShops(params);
}
