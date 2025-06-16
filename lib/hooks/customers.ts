"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase-client";
import type { Customer, CustomerProgress } from "@/lib/types/customer";
import { toast } from "sonner";

/**
 * 고객 목록 조회 훅
 * @param kolId KOL 고유 ID
 */
export function useCustomers(kolId: number) {
  return useQuery({
    queryKey: ["customers", kolId],
    queryFn: async () => {
      const { data, error } = await supabaseBrowser()
        .from("customers")
        .select("*, customer_progress(*), customer_notes(*)")
        .eq("kol_id", kolId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Customer & {
        customer_progress: CustomerProgress[];
      })[];
    },
    enabled: typeof kolId === "number" && kolId > 0,
  });
}

interface UpdateCustomerInput {
  customerId: string;
  progress: CustomerProgress;
}

/**
 * 고객 진행 상태 업데이트 훅 (디바운스 호출 예정)
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, progress }: UpdateCustomerInput) => {
      const { error } = await supabaseBrowser()
        .from("customer_progress")
        .upsert(
          {
            customer_id: customerId,
            stage_data: progress.stageData,
            achievements: progress.achievements,
          },
          { onConflict: "customer_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast.error("저장 실패: " + error.message);
    },
  });
} 