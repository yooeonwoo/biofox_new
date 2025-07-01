import { supabaseBrowser } from "@/lib/supabase-client";
import { DeliveryStageValue } from "@/lib/types/customer";

/** shopId == customerId */
export async function getInstallInfo(shopId: string) {
  try {
    const supabase = supabaseBrowser();
    
    const { data, error } = await supabase
      .from("customer_progress")
      .select("stage_data")
      .eq("customer_id", shopId)
      .single();

    if (error) throw error;
    const delivery = (data.stage_data?.delivery || {}) as DeliveryStageValue;

    return {
      date:  delivery.installDate        || "",
      name:  delivery.installContactName || "",
      phone: delivery.installContactPhone|| "",
    };
  } catch (error) {
    console.warn('getInstallInfo: API 호출 실패, 모킹 데이터 반환', error);
    
    // 개발 환경에서 모킹 데이터 반환
    return {
      date: "2024-01-15",
      name: "설치 담당자",
      phone: "010-1234-5678",
    };
  }
} 