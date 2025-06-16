import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-client";
import CustomerList from "./components/CustomerList";

export const revalidate = 0; // 항상 최신 데이터를 가져오기 위해 ISR 끔

export default async function CustomerManagerPage() {
  const { userId } = await auth();
  if (!userId) {
    return <div className="p-6 text-center">로그인이 필요합니다.</div>;
  }

  const supabase = supabaseServer(cookies());

  // Clerk user → KOL ID 조회
  const { data: kol, error: kolError } = await supabase
    .from("kols")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (kolError || !kol) {
    return (
      <div className="p-6 text-center">
        KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.
      </div>
    );
  }

  const kolId = kol.id as number;

  // 초기 고객 데이터 SSR 페치 (선택: 쿼리 훅에서 다시 가져옴)
  const { data: customers } = await supabase
    .from("customers")
    .select("*, customer_progress(*), customer_notes(*)")
    .eq("kol_id", kolId)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto">
      <CustomerList initialData={customers ?? []} kolId={kolId} />
    </div>
  );
} 