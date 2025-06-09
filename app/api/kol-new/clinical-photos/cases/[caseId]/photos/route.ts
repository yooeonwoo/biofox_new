import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 케이스의 사진 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = parseInt(params.caseId);

    const { data: photos, error } = await supabase
      .from("clinical_photos")
      .select("*")
      .eq("case_id", caseId)
      .order("round_number", { ascending: true })
      .order("angle", { ascending: true });

    if (error) {
      console.error("Photos fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // PhotoSlot 형식으로 변환
    const photoSlots = photos.map((photo) => ({
      id: `${photo.case_id}-${photo.round_number}-${photo.angle}`,
      roundDay: photo.round_number,
      angle: photo.angle,
      imageUrl: photo.file_url,
      uploaded: true,
      photoId: photo.id,
    }));

    return NextResponse.json(photoSlots);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 새 사진 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = parseInt(params.caseId);
    const body = await request.json();

    // 사용자의 KOL ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    const { data: kolData } = await supabase
      .from("kols")
      .select("id")
      .eq("user_id", userData?.id)
      .single();

    if (!kolData) {
      return NextResponse.json({ error: "KOL not found" }, { status: 404 });
    }

    // 기존 사진이 있는지 확인
    const { data: existingPhoto } = await supabase
      .from("clinical_photos")
      .select("id")
      .eq("case_id", caseId)
      .eq("round_number", body.roundNumber)
      .eq("angle", body.angle)
      .single();

    let result;

    if (existingPhoto) {
      // 기존 사진 업데이트
      const { data, error } = await supabase
        .from("clinical_photos")
        .update({
          file_url: body.fileUrl,
          thumbnail_url: body.thumbnailUrl,
          file_size: body.fileSize,
          mime_type: body.mimeType,
          photo_date: new Date().toISOString(),
        })
        .eq("id", existingPhoto.id)
        .select()
        .single();

      if (error) {
        console.error("Photo update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // 새 사진 생성
      const { data, error } = await supabase
        .from("clinical_photos")
        .insert({
          case_id: caseId,
          kol_id: kolData.id,
          round_number: body.roundNumber,
          angle: body.angle,
          file_url: body.fileUrl,
          thumbnail_url: body.thumbnailUrl,
          file_size: body.fileSize,
          mime_type: body.mimeType,
        })
        .select()
        .single();

      if (error) {
        console.error("Photo creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 사진 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = parseInt(params.caseId);
    const { searchParams } = new URL(request.url);
    const roundNumber = searchParams.get("roundNumber");
    const angle = searchParams.get("angle");

    if (!roundNumber || !angle) {
      return NextResponse.json(
        { error: "roundNumber and angle are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("clinical_photos")
      .delete()
      .eq("case_id", caseId)
      .eq("round_number", parseInt(roundNumber))
      .eq("angle", angle);

    if (error) {
      console.error("Photo deletion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}