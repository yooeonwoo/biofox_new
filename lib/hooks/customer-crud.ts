"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase-client";
import type { Customer } from "@/lib/types/customer";
import { toast } from "sonner";

export interface CreateCustomerInput {
  kolId: number;
  name: string;
  shopName?: string;
  phone?: string;
  region?: string;
  placeAddress?: string;
  assignee?: string;
  manager?: string;
}

/**
 * 고객 생성 훅 (Optimistic Update)
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const { kolId, ...rest } = input;
      const { data, error } = await supabaseBrowser()
        .from("customers")
        .insert({
          kol_id: kolId,
          name: rest.name,
          shop_name: rest.shopName,
          phone: rest.phone,
          region: rest.region,
          place_address: rest.placeAddress,
          assignee: rest.assignee,
          manager: rest.manager,
        })
        .select("*, customer_progress(*)")
        .single();

      if (error) throw error;
      return data as Customer & { customer_progress: any[] };
    },
    // Optimistic update – query invalidation handled on success
    onSuccess: (created) => {
      queryClient.setQueryData<any[]>(["customers", created.kolId], (old = []) => [created, ...old]);
      toast.success("고객이 생성되었습니다.");
    },
    onError: (error: any) => {
      toast.error("고객 생성 실패: " + error.message);
    },
  });
}

export interface DeleteCustomerInput {
  customerId: string;
}

/**
 * 고객 삭제 훅 (Optimistic Update)
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId }: DeleteCustomerInput) => {
      const { error } = await supabaseBrowser().from("customers").delete().eq("id", customerId);
      if (error) throw error;
      return { customerId };
    },
    onSuccess: ({ customerId }) => {
      // 모든 customers 캐시에서 해당 항목 제거
      queryClient.getQueriesData(["customers"]).forEach(([key, value]) => {
        if (!Array.isArray(value)) return;
        queryClient.setQueryData<any[]>(key, value.filter((c: any) => c.id !== customerId));
      });
      toast.success("고객이 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error("고객 삭제 실패: " + error.message);
    },
  });
}
