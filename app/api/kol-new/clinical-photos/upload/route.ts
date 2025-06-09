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
    const roundNumber = formData.get("roundNumber") as string;
    const angle = formData.get("angle") as string;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "File and caseId are required" },
        { status: 400 }
      );
    }

    if (type === "photo" && (!roundNumber || !angle)) {
      return NextResponse.json(
        { error: "roundNumber and angle are required for photo uploads" },
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

    // 안전한 파일명 생성 (한글 파일명 문제 해결)
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || 'jpg';
    
    // 원본 파일명에서 확장자를 제외한 부분을 안전하게 변환
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
    const safeName = baseName
      .replace(/[^\w\-_]/g, '_')  // 특수문자를 언더스코어로 변경
      .replace(/_{2,}/g, '_')     // 연속된 언더스코어를 하나로 변경
      .substring(0, 50);          // 최대 50자로 제한
    
    const fileName = `${userId}/${caseId}/${type}/${timestamp}_${safeName}.${fileExt}`;

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

    // 사진인 경우 clinical_photos 테이블에 메타데이터 저장
    if (type === "photo") {
      const { error: dbError } = await supabase
        .from("clinical_photos")
        .insert({
          case_id: parseInt(caseId),
          round_number: parseInt(roundNumber),
          angle: angle,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) {
        console.error("Photo DB insert error:", dbError);
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: "Failed to save photo metadata" },
          { status: 500 }
        );
      }
    }

    // 동의서인 경우 케이스 정보 업데이트
    if (type === "consent") {
      const { error: dbError } = await supabase
        .from("clinical_cases")
        .update({
          consent_image_url: publicUrl,
          consent_received: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(caseId));

      if (dbError) {
        console.error("Consent DB update error:", dbError);
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: "Failed to update consent information" },
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