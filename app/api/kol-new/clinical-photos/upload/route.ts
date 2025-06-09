import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: 이미지 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const type = formData.get("type") as string; // 'photo' or 'consent'

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "File and caseId are required" },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // 파일명 생성
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${caseId}/${type}/${timestamp}.${fileExt}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("clinical-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // 파일 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from("clinical-photos")
      .getPublicUrl(fileName);

    // 동의서 파일인 경우 DB에 저장
    if (type === "consent") {
      const { error: dbError } = await supabase
        .from("clinical_consent_files")
        .insert({
          case_id: parseInt(caseId),
          file_url: publicUrl,
        });

      if (dbError) {
        console.error("DB insert error:", dbError);
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: "Failed to save file information" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 이미지 파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "fileUrl is required" },
        { status: 400 }
      );
    }

    // Storage URL에서 파일 경로 추출
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf("clinical-photos");
    if (bucketIndex === -1) {
      return NextResponse.json(
        { error: "Invalid file URL" },
        { status: 400 }
      );
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    // Supabase Storage에서 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from("clinical-photos")
      .remove([filePath]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}