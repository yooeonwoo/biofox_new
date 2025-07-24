/**
 * Shop Creation 통합 훅 - Convex 기반
 * 매장 생성 관련 모든 기능을 단일 인터페이스로 통합
 */

'use client';

import { useQuery, useMutation } from 'convex/react';
import { useMutation as useTanstackMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ConvexError } from 'convex/values';
import { toast } from 'sonner';

// 타입 정의
export interface ShopFormData {
  kolId: number; // UI에서는 number로 받음
  ownerName: string;
  shopName: string;
  region?: string;
  contractDate?: string;
  smartPlaceLink?: string;
  withDevice: boolean;
  deduct?: number;
  createdBy: number;
}

export interface KolOption {
  id: number; // UI 호환성을 위한 number ID
  convexId: string; // 실제 Convex ID
  name: string;
  shopName: string;
  region?: string;
  status: string;
}

export interface ShopCreationResult {
  shopId: string;
  success: boolean;
  message: string;
}

/**
 * 매장 생성 통합 훅
 */
export function useShopCreation() {
  const queryClient = useQueryClient();

  // KOL 목록 조회 (Convex)
  const kolProfilesData = useQuery(api.profiles.getProfilesByRole, {
    role: 'kol',
  });

  // 매장 생성 뮤테이션 (Convex)
  const createShopMutation = useMutation(api.shops.createShop);

  // KOL 데이터 변환 및 로딩 상태 관리
  const kols: KolOption[] | undefined = kolProfilesData
    ? kolProfilesData.map((kol, index) => ({
        id: index + 1, // UI에서 사용할 숫자 ID
        convexId: kol._id,
        name: kol.name,
        shopName: kol.shop_name || kol.name,
        region: kol.region,
        status: kol.status || 'active',
      }))
    : undefined;

  const isKolsLoading = kolProfilesData === undefined;

  // 통합 매장 생성 함수
  const createShopWithRelations = useTanstackMutation({
    mutationFn: async (data: ShopFormData): Promise<ShopCreationResult> => {
      try {
        // 1. KOL ID 변환 (number -> Convex ID)
        const selectedKol = kols?.find(kol => kol.id === data.kolId);
        if (!selectedKol) {
          throw new Error('선택된 KOL을 찾을 수 없습니다.');
        }

        // 2. 매장 데이터 준비
        const shopData = {
          userId: `user_${data.createdBy}` as Id<'users'>, // 임시 사용자 ID 생성
          email: `shop_${Date.now()}@example.com`, // 임시 이메일 생성
          name: data.ownerName,
          shopName: data.shopName,
          region: data.region,
          kolId: selectedKol.convexId as Id<'profiles'>,
        };

        // 3. Convex를 통한 매장 생성
        const shopId = await createShopMutation(shopData);

        // 4. 디바이스 추가 (선택 사항)
        if (data.withDevice && data.deduct !== undefined) {
          // TODO: device_sales 테이블에 초기 할당 데이터 추가
          // 향후 deviceSales 뮤테이션이 필요할 때 구현
          console.log('Initial device allocation:', {
            shopId,
            deduct: data.deduct,
            quantity: 1,
          });
        }

        return {
          shopId: shopId as string,
          success: true,
          message: '매장이 성공적으로 생성되었습니다.',
        };
      } catch (error) {
        console.error('Shop creation failed:', error);

        // 에러 메시지 처리
        let errorMessage = '매장 생성에 실패했습니다.';
        if (error instanceof ConvexError) {
          errorMessage = error.data || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: result => {
      // 성공 시 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['adminNewShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });

      // 성공 토스트
      toast.success(result.message);
    },
    onError: error => {
      // 에러 토스트
      toast.error(error.message);
    },
  });

  // KOL 선택 시 자동 필드 설정을 위한 유틸리티 함수
  const getKolByNumber = (kolId: number): KolOption | undefined => {
    return kols?.find(kol => kol.id === kolId);
  };

  // 매장 이름 중복 검사 (클라이언트 사이드)
  const validateShopName = (shopName: string): boolean => {
    if (!shopName || shopName.length < 2) {
      return false;
    }
    // TODO: 서버 사이드 검증 추가 가능
    return true;
  };

  return {
    // 데이터
    kols,

    // 상태
    isKolsLoading,
    isCreating: createShopWithRelations.isPending,
    isSuccess: createShopWithRelations.isSuccess,
    isError: createShopWithRelations.isError,
    error: createShopWithRelations.error,

    // 함수
    createShopWithRelations: createShopWithRelations.mutate,
    createShopWithRelationsAsync: createShopWithRelations.mutateAsync,
    getKolByNumber,
    validateShopName,

    // 리셋 함수
    reset: createShopWithRelations.reset,
  };
}
