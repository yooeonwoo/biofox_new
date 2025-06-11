"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export function useAdminShopDetail(shopId: number | null) {
  return useQuery({
    enabled: !!shopId,
    queryKey: ["adminShop", shopId],
    queryFn: async () => {
      const res = await fetch(`/api/admin-new/shops/${shopId}`);
      if (!res.ok) throw new Error("failed");
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
  return useInfiniteQuery(
    {
      enabled: !!shopId,
      initialPageParam: 1,
      queryKey: ["allocations", shopId],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(`/api/admin-new/shops/${shopId}/allocations?page=${pageParam}`);
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        const rows: AllocationRow[] = json.data;
        return { rows, nextPage: rows.length === 20 ? pageParam + 1 : undefined };
      },
      getNextPageParam: (last) => last?.nextPage,
    }
  );
} 