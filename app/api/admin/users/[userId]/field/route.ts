/**
 * 사용자 개별 필드 업데이트 API
 * 인라인 편집을 위한 개별 필드 업데이트 기능을 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

interface UpdateFieldRequest {
  field: string;
  value: string;
  table: 'users' | 'kols';
}

/**
 * PATCH 요청 처리 - 사용자의 개별 필드를 업데이트합니다.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log("=== 사용자 필드 업데이트 API 시작 ===");
    
    // 관리자 권한 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자 ID입니다." },
        { status: 400 }
      );
    }

    // 요청 본문 파싱
    const { field, value, table }: UpdateFieldRequest = await req.json();
    console.log("필드 업데이트 요청:", { userId, field, value, table });

    // 필수 필드 검증
    if (!field || value === undefined || !table) {
      return NextResponse.json(
        { error: "field, value, table 필드는 필수입니다." },
        { status: 400 }
      );
    }

    // 허용된 필드 검증
    const allowedUserFields = ['name', 'email', 'role'];
    const allowedKolFields = ['name', 'shop_name', 'region', 'status'];
    
    if (table === 'users' && !allowedUserFields.includes(field)) {
      return NextResponse.json(
        { error: `허용되지 않은 users 필드입니다: ${field}` },
        { status: 400 }
      );
    }
    
    if (table === 'kols' && !allowedKolFields.includes(field)) {
      return NextResponse.json(
        { error: `허용되지 않은 kols 필드입니다: ${field}` },
        { status: 400 }
      );
    }

    const { supabase } = await import("../../../../../../db/index");

    if (table === 'users') {
      // users 테이블 업데이트
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error("사용자 정보 업데이트 오류:", updateError);
        throw updateError;
      }

      if (!updatedUser) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // Clerk 사용자 정보도 업데이트 (이메일이나 이름 변경시)
      if ((field === 'email' || field === 'name') && !updatedUser.clerk_id.startsWith('pending_')) {
        try {
          const { updateUser: clerkUpdateUser } = await import("../../../../../../lib/clerk/admin");
          
          const updateData: any = {};
          if (field === 'email') {
            updateData.email_address = [value];
          } else if (field === 'name') {
            updateData.first_name = value;
          }

          await clerkUpdateUser(updatedUser.clerk_id, updateData);
          console.log(`Clerk 사용자 ${field} 업데이트 성공:`, updatedUser.clerk_id);
        } catch (clerkError) {
          console.error(`Clerk 사용자 ${field} 업데이트 실패:`, clerkError);
          // Clerk 업데이트 실패해도 DB 업데이트는 유지
        }
      }

      console.log("사용자 정보 업데이트 성공:", updatedUser);

      return NextResponse.json({
        success: true,
        message: `${field} 필드가 업데이트되었습니다.`,
        data: {
          field,
          value,
          table
        }
      });

    } else if (table === 'kols') {
      // 먼저 해당 사용자의 KOL 정보 존재 여부 확인
      const { data: kolData, error: getKolError } = await supabase
        .from('kols')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (getKolError || !kolData) {
        return NextResponse.json(
          { error: "해당 사용자의 KOL 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // kols 테이블 업데이트
      const { data: updatedKol, error: updateKolError } = await supabase
        .from('kols')
        .update({ [field]: value })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateKolError) {
        console.error("KOL 정보 업데이트 오류:", updateKolError);
        throw updateKolError;
      }

      if (!updatedKol) {
        return NextResponse.json(
          { error: "KOL 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      console.log("KOL 정보 업데이트 성공:", updatedKol);

      return NextResponse.json({
        success: true,
        message: `${field} 필드가 업데이트되었습니다.`,
        data: {
          field,
          value,
          table
        }
      });
    }

  } catch (error) {
    console.error("=== 사용자 필드 업데이트 실패 ===");
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "필드 업데이트 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}