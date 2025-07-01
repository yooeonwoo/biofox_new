import { supabaseBrowser } from "@/lib/supabase-client";
import { DeliveryStageValue } from "@/lib/types/customer";

/** shopId == customerId */
export async function getInstallInfo(shopId: string) {
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
} 