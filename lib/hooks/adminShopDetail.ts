/**
 * ⚠️ DEPRECATED: 이 파일은 Convex로 전환되었습니다
 *
 * 새로운 파일을 사용하세요:
 * - /lib/hooks/adminShopDetail-convex.ts
 * - 실시간 동기화 지원
 * - 더 나은 타입 안전성
 * - 향상된 성능
 *
 * 기존 호환성을 위해 잠시 유지됩니다.
 */

'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

export function useAdminShopDetail(shopId: number | null) {
  return useQuery({
    enabled: !!shopId,
    queryKey: ['adminShop', shopId],
    queryFn: async () => {
      const res = await fetch(`/api/admin-new/shops/${shopId}`);
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      return json.data;
    },
  });
}

interface AllocationRow {
  id: number;
  allocated_at: string;
  tier_fixed_amount: number;
  user_input_deduct: number;
  pay_to_kol: number;
  note: string | null;
}

export function useShopAllocations(shopId: number | null) {
  return useInfiniteQuery({
    enabled: !!shopId,
    initialPageParam: 1,
    queryKey: ['allocations', shopId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/admin-new/shops/${shopId}/allocations?page=${pageParam}`);
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      const rows: AllocationRow[] = json.data;
      return { rows, nextPage: rows.length === 20 ? pageParam + 1 : undefined };
    },
    getNextPageParam: last => last?.nextPage,
  });
}
