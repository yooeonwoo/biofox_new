import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-client";
import CustomerList from "./components/CustomerList";
import { checkAuthSupabase } from "@/lib/auth";

export const revalidate = 0; // 항상 최신 데이터를 가져오기 위해 ISR 끔

export default async function CustomerManagerPage() {
  const authResult = await checkAuthSupabase();
  if (!authResult.user) {
    return <div className="p-6 text-center">로그인이 필요합니다.</div>;
  }
  
  const userId = authResult.user.id;

  const cookieStore = await cookies();
  const supabase = supabaseServer(cookieStore);

  // 1) 사용자 정보 조회
  const {
    data: userRecord,
    error: userError,
  } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", userId)
    .single();

  if (userError || !userRecord) {
    return (
      <div className="p-6 text-center">
        사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.
      </div>
    );
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
      return (
        <div className="p-6 text-center">
          KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.
        </div>
      );
    }

    kol = newKol;
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