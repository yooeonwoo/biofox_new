import { createClient } from "@/lib/supabase/server";
import CustomerListShad from "./components/CustomerListShad";
import { getCurrentKol } from "@/lib/auth/get-current-kol";

export const revalidate = 0;

export default async function CustomerManagerPage() {
  const supabase = createClient();
  const kol = await getCurrentKol();

  if (!kol) return <p>담당 KOL 정보를 찾을 수 없습니다.</p>;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*, customer_progress(*)")
    .eq("kol_id", kol.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return <p>고객 목록을 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <CustomerListShad initialData={customers || []} kolId={kol.id} />
    </div>
  );
} 