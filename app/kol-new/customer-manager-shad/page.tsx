import CustomerListShad from "./components/CustomerListShad";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-client";

export const revalidate = 0;

export default async function CustomerManagerPage() {
  const { userId } = await auth();
  if (!userId) {
    return <p>로그인이 필요합니다.</p>;
  }

  const supabase = supabaseServer(cookies());

  // 1) Clerk ID -> 내부 users 테이블 ID 조회
  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("id, name")
    .eq("clerk_id", userId)
    .single();

  if (userError || !userRecord) {
    return <p>사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.</p>;
  }

  // 2) users.id → KOL ID 조회
  const { data: kolData, error: kolError } = await supabase
    .from("kols")
    .select("id")
    .eq("user_id", userRecord.id)
    .single();

  let kol = kolData;

  // 3) KOL 레코드가 없으면 자동 생성 (최초 접속 시)
  if (kolError || !kol) {
    const { data: newKol, error: insertError } = await supabase
      .from("kols")
      .insert({
        user_id: userRecord.id,
        name: userRecord.name || userId,
        shop_name: `${userRecord.name || userId}의 매장`,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError || !newKol) {
      return <p>KOL 정보를 생성하는데 실패했습니다.</p>;
    }
    kol = newKol;
  }

  const kolId = kol.id as number;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*, customer_progress(*)")
    .eq("kol_id", kolId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return <p>고객 목록을 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <CustomerListShad initialData={customers || []} kolId={kolId} />
    </div>
  );
} 