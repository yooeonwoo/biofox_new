import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

// 특정 KOL 조회
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const id = parseInt(context.params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Supabase에서 사용자 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 정보 조회
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select(`
        *,
        shops:shops(*)
      `)
      .eq('id', id)
      .single();

    if (kolError || !kol) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자인 경우 모든 KOL 정보에 접근 가능
    // 일반 사용자는 자신의 정보만 접근 가능
    if (userInfo.role === "본사관리자") {
      return NextResponse.json(kol);
    }
    
    // 자신의 정보가 아닌 경우 접근 거부
    if (kol.user_id !== userInfo.id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(kol);
  } catch (error) {
    console.error("KOL 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 수정
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const id = parseInt(context.params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 권한 확인
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (userInfo.role !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await req.json();
    const { name, shopName, phone, address, profileImage, description, bankName, accountNumber, accountHolder, status } = data;

    // 필수 필드 확인
    if (!name || !shopName) {
      return NextResponse.json(
        { error: "이름과 상점명은 필수 항목입니다" },
        { status: 400 }
      );
    }

    // KOL 존재 확인
    const { data: existingKol, error: kolError } = await supabase
      .from('kols')
      .select('status')
      .eq('id', id)
      .single();

    if (kolError || !existingKol) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 정보 업데이트
    const { data: updatedKol, error: updateError } = await supabase
      .from('kols')
      .update({
        name,
        shop_name: shopName,
        phone,
        address,
        profile_image: profileImage,
        description,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        status: status || existingKol.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "KOL을 수정하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedKol);
  } catch (error) {
    console.error("KOL 수정 오류:", error);
    return NextResponse.json(
      { error: "KOL을 수정하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 삭제
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const id = parseInt(context.params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 권한 확인
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (userInfo.role !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // KOL 존재 확인
    const { data: existingKol, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('id', id)
      .single();

    if (kolError || !existingKol) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 삭제
    const { error: deleteError } = await supabase
      .from('kols')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: "KOL을 삭제하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("KOL 삭제 오류:", error);
    return NextResponse.json(
      { error: "KOL을 삭제하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 