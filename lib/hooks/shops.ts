"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GetShopsParams {
  search?: string;
  kolId?: string;
  status?: string;
  page?: number; // reserved for future pagination
}

export interface Shop {
  id: number;
  shop_name: string;
  region: string | null;
  status: string;
  kol_id: number;
  contract_date: string | null;
  kols: { name: string } | null;
  device_count: number;
  latest_allocation: string | null;
}

function buildQueryString(params: GetShopsParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export async function getShops(params: GetShopsParams = {}): Promise<Shop[]> {
  const qs = buildQueryString(params);
  const res = await fetch(`/api/admin/shops${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to fetch shops");
  }
  const json = await res.json();
  return json.shops as Shop[];
}

export function useShops(params: GetShopsParams = {}) {
  return useQuery({
    queryKey: ["shops", params],
    queryFn: () => getShops(params),
  });
}

// 신규 전문점 생성
interface CreateShopInput {
  kolId: number;
  ownerName: string;
  shopName: string;
  region?: string;
  contractDate?: string;
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateShopInput) => {
      const res = await fetch("/api/admin/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kolId: input.kolId,
          ownerName: input.ownerName,
          shopName: input.shopName,
          createdBy: 1, // TODO: replace with clerk userId or admin id
          region: input.region,
          contractDate: input.contractDate,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to create shop");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });
}
