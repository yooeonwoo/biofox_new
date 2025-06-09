import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE: 동의서 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.caseId;
    
    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting consent files for case:", caseId);

    // 기존 동의서 파일들 조회
    const { data: existingFiles, error: fetchError } = await supabase
      .from("clinical_consent_files")
      .select("*")
      .eq("case_id", parseInt(caseId));

    if (fetchError) {
      console.error("Failed to fetch consent files:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch consent files" },
        { status: 500 }
      );
    }

    // Storage에서 파일들 삭제
    if (existingFiles && existingFiles.length > 0) {
      for (const file of existingFiles) {
        try {
          // URL에서 파일 경로 추출
          const url = new URL(file.file_url);
          const pathParts = url.pathname.split("/");
          const bucketIndex = pathParts.indexOf("clinical-photos");
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join("/");
            console.log("Deleting file from storage:", filePath);
            
            const { error: storageError } = await supabase.storage
              .from("clinical-photos")
              .remove([filePath]);
            
            if (storageError) {
              console.error("Failed to delete file from storage:", storageError);
            }
          }
        } catch (deleteError) {
          console.error("Failed to delete consent file from storage:", deleteError);
        }
      }
    }

    // DB에서 동의서 파일 레코드들 삭제
    const { error: dbDeleteError } = await supabase
      .from("clinical_consent_files")
      .delete()
      .eq("case_id", parseInt(caseId));

    if (dbDeleteError) {
      console.error("Failed to delete consent file records:", dbDeleteError);
      return NextResponse.json(
        { error: "Failed to delete consent file records" },
        { status: 500 }
      );
    }

    // 케이스의 동의 상태를 false로 업데이트하고 이미지 URL 제거
    const { error: caseUpdateError } = await supabase
      .from("clinical_cases")
      .update({ 
        consent_received: false,
        consent_image_url: null 
      })
      .eq("id", parseInt(caseId));

    if (caseUpdateError) {
      console.error("Failed to update case consent status:", caseUpdateError);
      return NextResponse.json(
        { error: "Failed to update case consent status" },
        { status: 500 }
      );
    }

    console.log("Consent files deleted successfully for case:", caseId);

    return NextResponse.json({ 
      success: true,
      message: "Consent files deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting consent files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}