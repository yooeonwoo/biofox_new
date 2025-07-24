/**
 * Shops 관리 훅 - Convex 기반 전환
 * 기존 fetch 호출을 Convex 실시간 동기화로 대체
 */

'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

// 필터링 파라미터 타입
interface GetShopsParams {
  search?: string;
  kolId?: string;
  status?: string;
  page?: number; // 향후 페이지네이션용
}

// Shop 인터페이스 (Convex 버전)
export interface Shop {
  id: string; // Convex ID는 문자열
  shopName: string;
  region: string | null;
  status: string;
  kolId: string;
  contractDate: string | null;
  kols: { name: string } | null;
  deviceCount: number;
  latestAllocation: string | null;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

// 신규 매장 생성 입력 타입
interface CreateShopInput {
  kolId: string;
  ownerName: string;
  shopName: string;
  region?: string;
  contractDate?: string;
}

/**
 * 매장 목록 조회 훅 (실시간 동기화)
 */
export function useShops(params: GetShopsParams = {}) {
  // 모든 shop_owner 역할의 프로필 조회
  const allShopProfiles = useQuery(api.profiles.getProfilesByRole, {
    role: 'shop_owner',
  });

  // Loading 상태 처리
  if (allShopProfiles === undefined) {
    return {
      data: undefined,
      isLoading: true,
      isError: false,
    };
  }

  // 데이터 변환 및 필터링
  let shops: Shop[] = allShopProfiles.map(shop => ({
    id: shop._id,
    shopName: shop.shop_name || shop.name,
    region: shop.region || null,
    status: shop.status || 'pending',
    kolId: shop._id, // 임시로 자기 자신의 ID 사용 (향후 관계 테이블 연동)
    contractDate: null, // metadata에서 추출할 수 있음
    kols: null, // 향후 관계 테이블 연동 필요
    deviceCount: 0, // 향후 devices 테이블 연동 필요
    latestAllocation: null, // 향후 device_allocations 테이블 연동 필요
    ownerName: shop.name,
    createdAt: new Date(shop._creationTime).toISOString(),
    updatedAt: new Date(shop.updated_at || shop._creationTime).toISOString(),
  }));

  // 클라이언트 사이드 필터링 (향후 서버 사이드로 최적화 가능)
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    shops = shops.filter(
      shop =>
        shop.shopName.toLowerCase().includes(searchLower) ||
        shop.ownerName.toLowerCase().includes(searchLower) ||
        shop.region?.toLowerCase().includes(searchLower)
    );
  }

  if (params.status) {
    shops = shops.filter(shop => shop.status === params.status);
  }

  if (params.kolId) {
    shops = shops.filter(shop => shop.kolId === params.kolId);
  }

  return {
    data: shops,
    isLoading: false,
    isError: false,
  };
}

/**
 * 매장 생성 훅 (실시간 동기화)
 */
export function useCreateShop() {
  const createProfile = useMutation(api.profiles.createProfile);

  return {
    mutate: async (input: CreateShopInput) => {
      try {
        // 임시 사용자 ID 생성 또는 기존 시스템과 연동 필요
        // 현재는 KOL의 userId를 재사용하는 방식으로 처리
        const tempUserId = `temp_${Date.now()}` as Id<'users'>;

        const result = await createProfile({
          userId: tempUserId,
          email: `${input.ownerName.toLowerCase().replace(/\s+/g, '')}@temp.com`,
          name: input.ownerName,
          role: 'shop_owner',
          shop_name: input.shopName,
          region: input.region,
        });

        toast.success('매장이 성공적으로 생성되었습니다.');
        return {
          id: result,
          shopName: input.shopName,
          ownerName: input.ownerName,
          region: input.region,
        };
      } catch (error: any) {
        console.error('Shop creation error:', error);
        toast.error(`매장 생성에 실패했습니다: ${error.message}`);
        throw error;
      }
    },
    isLoading: false, // useMutation은 로딩 상태를 자체 관리
  };
}

/**
 * 레거시 함수들 (향후 제거 예정)
 */
export async function getShops(params: GetShopsParams = {}): Promise<Shop[]> {
  console.warn('⚠️ getShops() is deprecated. Use useShops() hook instead.');
  // 임시로 빈 배열 반환 (실제로는 Convex 쿼리 실행 필요)
  return [];
}
