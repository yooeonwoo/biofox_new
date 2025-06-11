"use client";

import { useQuery } from "@tanstack/react-query";

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

function buildQueryString(params: Record<string, string | number | undefined>) {
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
