import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 임상 케이스 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 KOL 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: kolData, error: kolError } = await supabase
      .from("kols")
      .select("id")
      .eq("user_id", userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json({ error: "KOL not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";

    // 케이스 조회 쿼리
    let query = supabase
      .from("clinical_cases")
      .select(`
        *,
        customer:clinical_customers(*),
        photos:clinical_photos(count),
        consent_files:clinical_consent_files(*)
      `)
      .eq("kol_id", kolData.id)
      .order("created_at", { ascending: false });

    // 상태 필터 적용
    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: cases, error: casesError } = await query;

    if (casesError) {
      console.error("Cases fetch error:", casesError);
      return NextResponse.json({ error: casesError.message }, { status: 500 });
    }

    // 각 케이스의 사진 정보 가져오기
    const casesWithPhotos = await Promise.all(
      cases.map(async (caseItem) => {
        const { data: photos, error: photosError } = await supabase
          .from("clinical_photos")
          .select("*")
          .eq("case_id", caseItem.id)
          .order("round_number", { ascending: true })
          .order("angle", { ascending: true });

        if (photosError) {
          console.error("Photos fetch error:", photosError);
          return { ...caseItem, photos: [] };
        }

        // 총 사진 수 계산
        const totalPhotos = photos.length;

        // 완료된 회차 계산 (정면, 좌측, 우측 모두 업로드된 회차)
        const roundPhotos = photos.reduce((acc, photo) => {
          if (!acc[photo.round_number]) {
            acc[photo.round_number] = { front: false, left: false, right: false };
          }
          acc[photo.round_number][photo.angle] = true;
          return acc;
        }, {} as Record<number, Record<string, boolean>>);

        const completedRounds = Object.values(roundPhotos).filter(
          (round) => round.front && round.left && round.right
        ).length;

        return {
          ...caseItem,
          totalPhotos,
          completedRounds,
          consentImageUrl: caseItem.consent_files?.[0]?.file_url || null,
        };
      })
    );

    return NextResponse.json(casesWithPhotos);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 새 임상 케이스 생성
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 KOL 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: kolData, error: kolError } = await supabase
      .from("kols")
      .select("id")
      .eq("user_id", userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json({ error: "KOL not found" }, { status: 404 });
    }

    const body = await request.json();

    // 고객 정보가 있는 경우 먼저 고객 생성
    let customerId = null;
    if (body.customerName && body.customerName !== "본인") {
      const { data: customer, error: customerError } = await supabase
        .from("clinical_customers")
        .insert({
          kol_id: kolData.id,
          name: body.customerName,
          phone: body.customerPhone || null,
          email: body.customerEmail || null,
          birth_date: body.customerBirthDate || null,
          memo: body.customerMemo || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error("Customer creation error:", customerError);
        return NextResponse.json(
          { error: customerError.message },
          { status: 500 }
        );
      }

      customerId = customer.id;
    }

    // 케이스 생성
    const { data: newCase, error: caseError } = await supabase
      .from("clinical_cases")
      .insert({
        kol_id: kolData.id,
        customer_id: customerId,
        customer_name: body.customerName || "본인",
        case_name: body.caseName,
        concern_area: body.concernArea || null,
        treatment_plan: body.treatmentPlan || null,
        consent_received: body.consentReceived || false,
        consent_date: body.consentDate || null,
        status: "active",
      })
      .select()
      .single();

    if (caseError) {
      console.error("Case creation error:", caseError);
      return NextResponse.json({ error: caseError.message }, { status: 500 });
    }

    return NextResponse.json(newCase);
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}