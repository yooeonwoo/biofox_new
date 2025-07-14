"use client";

import { useQuery } from "@tanstack/react-query";

export interface AdminKol {
  id: number;
  kol_id: number;
  name: string;
  kol_shop_name: string;
  shop_name: string;
  shop_id: number;
}

export function useAdminNewKols() {
  return useQuery({
    queryKey: ["adminNewKols"],
    queryFn: async (): Promise<AdminKol[]> => {
      const res = await fetch("/api/admin-new/kols/list");
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      return json.data as AdminKol[];
    },
  });
}