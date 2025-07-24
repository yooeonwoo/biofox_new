"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminNewShopRow {
  id: number;
  shopName: string;
  region: string | null;
  status: string;
  kolName: string | null;
  deviceCnt: number;
  contractDate: string | null;
}

interface ListParams {
  search?: string;
  kolId?: string;
  status?: string;
  page?: number;
  size?: number;
}

function buildQueryString(params: Record<string, any>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      usp.append(k, String(v));
    }
  });
  return usp.toString();
}

async function fetchShops(params: ListParams): Promise<AdminNewShopRow[]> {
  const qs = buildQueryString(params);
  const res = await fetch(`/api/admin-new/shops/list${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Failed to fetch shops");
  }
  const json = await res.json();
  return json.data as AdminNewShopRow[];
}

export function useAdminNewShops(params: ListParams = {}) {
  return useQuery({ queryKey: ["adminNewShops", params], queryFn: () => fetchShops(params) });
}

interface CreateShopInput {
  kolId: number;
  ownerName: string;
  shopName: string;
  region?: string;
  contractDate?: string; // YYYY-MM-DD
  withDevice?: boolean;
  deduct?: number; // 0|21|34|55
  createdBy: number; // 관리자 ID
}

export function useCreateAdminNewShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateShopInput) => {
      const res = await fetch("/api/admin-new/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNewShops"] });
    },
  });
} 