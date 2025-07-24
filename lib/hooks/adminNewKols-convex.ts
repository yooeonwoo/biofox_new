/**
 * Admin New KOLs 관리 훅 - Convex 기반 전환
 * 기존 fetch 호출을 Convex 실시간 동기화로 대체
 */

'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 타입 정의
export interface AdminKol {
  id: string; // Convex ID는 문자열
  kolId: string;
  name: string;
  kolShopName: string;
  shopName: string;
  shopId: string;
  region?: string;
  status: string;
  createdAt: string;
  totalSubordinates: number;
  activeSubordinates: number;
}

/**
 * KOL 목록 조회 훅 (실시간 동기화)
 */
export function useAdminNewKols() {
  const kolProfiles = useQuery(api.profiles.getProfilesByRole, {
    role: 'kol',
  });

  // Loading 상태 처리
  if (kolProfiles === undefined) {
    return {
      data: undefined,
      isLoading: true,
      isError: false,
    };
  }

  // 데이터 변환
  const transformedData: AdminKol[] = kolProfiles.map(profile => ({
    id: profile._id,
    kolId: profile._id,
    name: profile.name,
    kolShopName: profile.shop_name || '',
    shopName: profile.shop_name || profile.name,
    shopId: profile._id,
    region: profile.region,
    status: profile.status || 'active',
    createdAt: new Date(profile._creationTime).toISOString(),
    totalSubordinates: profile.total_subordinates || 0,
    activeSubordinates: profile.active_subordinates || 0,
  }));

  return {
    data: transformedData,
    isLoading: false,
    isError: false,
  };
}

/**
 * 특정 KOL 상세 정보 조회 훅
 */
export function useAdminKolDetail(kolId: string | null) {
  const kolProfile = useQuery(
    api.profiles.getProfileById,
    kolId ? { profileId: kolId as any } : 'skip'
  );

  // Loading 상태 처리
  if (kolId && kolProfile === undefined) {
    return {
      data: undefined,
      isLoading: true,
      isError: false,
    };
  }

  if (!kolId || !kolProfile) {
    return {
      data: null,
      isLoading: false,
      isError: false,
    };
  }

  // 데이터 변환
  const transformedData: AdminKol = {
    id: kolProfile._id,
    kolId: kolProfile._id,
    name: kolProfile.name,
    kolShopName: kolProfile.shop_name || '',
    shopName: kolProfile.shop_name || kolProfile.name,
    shopId: kolProfile._id,
    region: kolProfile.region,
    status: kolProfile.status || 'active',
    createdAt: new Date(kolProfile._creationTime).toISOString(),
    totalSubordinates: kolProfile.total_subordinates || 0,
    activeSubordinates: kolProfile.active_subordinates || 0,
  };

  return {
    data: transformedData,
    isLoading: false,
    isError: false,
  };
}

/**
 * KOL 통계 조회 훅
 */
export function useAdminKolStats() {
  const allKols = useQuery(api.profiles.getProfilesByRole, {
    role: 'kol',
  });

  // Loading 상태 처리
  if (allKols === undefined) {
    return {
      data: undefined,
      isLoading: true,
    };
  }

  // 통계 계산 (실제 Convex 스키마 타입 사용)
  const stats = {
    total: allKols.length,
    approved: allKols.filter(kol => kol.status === 'approved').length,
    pending: allKols.filter(kol => kol.status === 'pending').length,
    rejected: allKols.filter(kol => kol.status === 'rejected').length,
    totalSubordinates: allKols.reduce((sum, kol) => sum + (kol.total_subordinates || 0), 0),
    activeSubordinates: allKols.reduce((sum, kol) => sum + (kol.active_subordinates || 0), 0),
  };

  return {
    data: stats,
    isLoading: false,
  };
}
