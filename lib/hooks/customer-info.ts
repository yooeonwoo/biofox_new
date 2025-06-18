"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase-client";
import type { Customer } from "@/lib/types/customer";
import { toast } from "sonner";

/**
 * 고객 기본 정보 업데이트 입력 값
 */
export interface UpdateCustomerInfoInput {
  customerId: string;
  info: Partial<Pick<Customer, "shopName" | "phone" | "region" | "placeAddress" | "assignee" | "manager">>;
}

/**
 * camelCase -> snake_case 변환 유틸(로컬)
 */
function toSnakeCasePayload(info: UpdateCustomerInfoInput["info"]): Record<string, any> {
  const payload: Record<string, any> = {};
  if (info.shopName !== undefined) payload.shop_name = info.shopName;
  if (info.placeAddress !== undefined) payload.place_address = info.placeAddress;
  if (info.phone !== undefined) payload.phone = info.phone;
  if (info.region !== undefined) payload.region = info.region;
  if (info.assignee !== undefined) payload.assignee = info.assignee;
  if (info.manager !== undefined) payload.manager = info.manager;
  return payload;
}

/**
 * 고객 기본 정보 업데이트 훅
 * Supabase `customers` 테이블에 patch(upsert 아님) 실행
 */
export function useUpdateCustomerInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, info }: UpdateCustomerInfoInput) => {
      const payload = toSnakeCasePayload(info);
      if (Object.keys(payload).length === 0) return; // 변경 없음

      const { error } = await supabaseBrowser()
        .from("customers")
        .update(payload)
        .eq("id", customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast.error("정보 저장 실패: " + error.message);
    },
  });
}
