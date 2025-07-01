/**
 * TODO(shop): 백엔드 구현 시
 *  - Supabase RLS 정책 확인 (shop 권한 대응)
 *  - 테이블/스토리지 버킷 실 접속 테스트
 *  - KOL 관련 함수명을 Shop으로 변경 (getKolIdForUser → getShopIdForUser)
 *  - 나머지 테이블 이름들 _shop 접미사로 변경 완료 필요
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAuthSupabase } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// KOL ID를 가져오는 함수 (Supabase 클라이언트 사용)
async function getKolIdForUser(userId: number): Promise<number> {
  try {
    
    // users 테이블에서 KOL ID 찾기
    const { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (kolError) {
      console.error('KOL query error:', kolError);
      throw kolError;
    }
    
    if (!kolData) {
      throw new Error('KOL 정보를 찾을 수 없습니다.');
    }
    
    return kolData.id;
  } catch (error) {
    console.error('Error fetching KOL ID:', error);
    throw new Error('KOL ID 조회에 실패했습니다.');
  }
}

// POST: 이미지 파일 업로드
export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    
    const authResult = await checkAuthSupabase();
    const userId = authResult.user?.id;
    if (!userId) {
      console.log("Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("User ID:", userId);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const type = formData.get("type") as string; // 'photo' or 'consent'
    const roundNumber = formData.get("roundNumber") as string;
    const angle = formData.get("angle") as string;

    console.log("Upload params:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      caseId,
      type,
      roundNumber,
      angle
    });

    if (!file || !caseId) {
      console.log("Missing required fields");
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

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("Uploading to Supabase Storage...", {
      fileName,
      bufferSize: buffer.length,
      bucketName: "clinical-photos"
    });

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("clinical-photos")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error details:", {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.status,
        fileName,
        fileSize: file.size,
        fileType: file.type
      });
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Upload successful:", uploadData);

    // 파일 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from("clinical-photos")
      .getPublicUrl(fileName);

    // 사진인 경우 clinical_photos_shop 테이블에 메타데이터 저장 (upsert 사용)
    if (type === "photo") {
      // KOL ID 가져오기
      const kolId = await getKolIdForUser(userId);
      
      // 기존 사진이 있는지 확인하고 삭제
      const { data: existingPhotos, error: fetchError } = await supabase
        .from("clinical_photos_shop")
        .select("file_url")
        .eq("case_id", parseInt(caseId))
        .eq("round_number", parseInt(roundNumber))
        .eq("angle", angle);
      
      if (fetchError) {
        console.error("Existing photo fetch error:", fetchError);
      }
      
      // 기존 사진이 있으면 Storage에서 삭제
      if (existingPhotos && existingPhotos.length > 0) {
        for (const photo of existingPhotos) {
          try {
            // URL에서 파일 경로 추출
            const url = new URL(photo.file_url);
            const pathParts = url.pathname.split("/");
            const bucketIndex = pathParts.indexOf("clinical-photos");
            if (bucketIndex !== -1) {
              const filePath = pathParts.slice(bucketIndex + 1).join("/");
              await supabase.storage.from("clinical-photos").remove([filePath]);
            }
          } catch (deleteError) {
            console.error("Old file deletion error:", deleteError);
            // 삭제 실패해도 계속 진행
          }
        }
      }
      
      // upsert로 데이터 저장 (기존 레코드 업데이트 또는 새로 삽입)
      const { error: dbError } = await supabase
        .from("clinical_photos_shop")
        .upsert({
          case_id: parseInt(caseId),
          kol_id: kolId,
          round_number: parseInt(roundNumber),
          angle: angle,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        }, {
          onConflict: "case_id,round_number,angle"
        });

      if (dbError) {
        console.error("Photo DB upsert error:", dbError);
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: "Failed to save photo metadata" },
          { status: 500 }
        );
      }
    }

    // 동의서인 경우 동의서 파일 테이블에 저장하고 케이스 상태 업데이트
    if (type === "consent") {
      console.log("Saving consent file for case:", caseId, "with URL:", publicUrl);
      
      // 기존 동의서 파일이 있으면 삭제
      const { data: existingFiles, error: fetchError } = await supabase
        .from("clinical_consent_files_shop")
        .select("*")
        .eq("case_id", parseInt(caseId));
      
      if (fetchError) {
        console.error("Failed to fetch existing consent files:", fetchError);
      }
      
      // 기존 파일들 삭제 (Storage와 DB 모두)
      if (existingFiles && existingFiles.length > 0) {
        for (const file of existingFiles) {
          try {
            // Storage에서 파일 삭제
            const url = new URL(file.file_url);
            const pathParts = url.pathname.split("/");
            const bucketIndex = pathParts.indexOf("clinical-photos");
            if (bucketIndex !== -1) {
              const filePath = pathParts.slice(bucketIndex + 1).join("/");
              await supabase.storage.from("clinical-photos").remove([filePath]);
            }
          } catch (deleteError) {
            console.error("Failed to delete old consent file from storage:", deleteError);
          }
        }
        
        // DB에서 기존 레코드 삭제
        await supabase
          .from("clinical_consent_files_shop")
          .delete()
          .eq("case_id", parseInt(caseId));
      }
      
      // 새 동의서 파일 정보 저장
      const { data: consentData, error: consentError } = await supabase
        .from("clinical_consent_files_shop")
        .insert({
          case_id: parseInt(caseId),
          file_url: publicUrl
        })
        .select();

      if (consentError) {
        console.error("Consent file DB insert error:", {
          error: consentError,
          caseId: caseId,
          publicUrl: publicUrl
        });
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: `Failed to save consent file: ${consentError.message}` },
          { status: 500 }
        );
      }
      
      // 케이스의 동의 상태 및 이미지 URL 업데이트
      const { data: caseUpdateData, error: caseUpdateError } = await supabase
        .from("clinical_cases_shop")
        .update({
          consent_received: true,
          consent_image_url: publicUrl
        })
        .eq("id", parseInt(caseId))
        .select();

      if (caseUpdateError) {
        console.error("Case consent status update error:", caseUpdateError);
        // 동의서 파일 레코드 삭제
        await supabase
          .from("clinical_consent_files_shop")
          .delete()
          .eq("case_id", parseInt(caseId));
        // 업로드된 파일 삭제
        await supabase.storage.from("clinical-photos").remove([fileName]);
        return NextResponse.json(
          { error: `Failed to update case consent status: ${caseUpdateError.message}` },
          { status: 500 }
        );
      }
      
      console.log("Consent file saved successfully:", consentData);
      console.log("Case consent status updated:", caseUpdateData);
    }

    console.log("Returning response:", {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

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