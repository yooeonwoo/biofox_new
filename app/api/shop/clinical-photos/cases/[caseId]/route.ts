import { NextRequest, NextResponse } from "next/server";
import { checkAuthSupabase } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 특정 케이스 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const authResult = await checkAuthSupabase();
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authResult.user.id;

    const caseId = parseInt(params.caseId);

    // 케이스 정보 조회
    const { data: caseData, error: caseError } = await supabase
      .from("clinical_cases")
      .select(`
        *,
        customer:clinical_customers(*),
        consent_files:clinical_consent_files(*)
      `)
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 사진 정보 조회
    const { data: photos, error: photosError } = await supabase
      .from("clinical_photos")
      .select("*")
      .eq("case_id", caseId)
      .order("round_number", { ascending: true })
      .order("angle", { ascending: true });

    if (photosError) {
      console.error("Photos fetch error:", photosError);
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    // 회차별 정보 조회
    const { data: roundInfos, error: roundInfosError } = await supabase
      .from("clinical_round_info")
      .select("*")
      .eq("case_id", caseId)
      .order("round_number", { ascending: true });

    if (roundInfosError) {
      console.error("Round infos fetch error:", roundInfosError);
    }

    return NextResponse.json({
      ...caseData,
      photos,
      roundInfos: roundInfos || [],
      consentImageUrl: caseData.consent_files?.[0]?.file_url || null,
    });
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: 케이스 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const authResult = await checkAuthSupabase();
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authResult.user.id;

    const caseId = parseInt(params.caseId);
    const body = await request.json();

    // 케이스 업데이트
    const { data: updatedCase, error: updateError } = await supabase
      .from("clinical_cases")
      .update({
        case_name: body.caseName,
        concern_area: body.concernArea,
        treatment_plan: body.treatmentPlan,
        consent_received: body.consentReceived,
        consent_date: body.consentDate,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId)
      .select()
      .single();

    if (updateError) {
      console.error("Case update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 케이스 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const authResult = await checkAuthSupabase();
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authResult.user.id;

    const caseId = parseInt(params.caseId);

    // 케이스 삭제 (관련 사진, 회차 정보, 동의서는 CASCADE로 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("clinical_cases")
      .delete()
      .eq("id", caseId);

    if (deleteError) {
      console.error("Case deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}