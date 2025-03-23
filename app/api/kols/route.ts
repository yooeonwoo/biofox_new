import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export interface IKol {
  id?: number;
  userId: number;
  name: string;
  shopName: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  status?: string;
}

// KOL 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("KOL 목록 조회 API 호출됨, 유저 ID:", userId);

    // Supabase에서 KOL 목록 조회
    const { data: kols, error } = await supabase
      .from('kols')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase 조회 오류:", error);
      return NextResponse.json(
        { error: "KOL 목록을 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    console.log("KOL 목록 조회 성공, 항목 수:", kols?.length || 0);
    return NextResponse.json(kols || []);
  } catch (error) {
    console.error("KOL 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL 목록을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 등록
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, shopName, phone, address, profileImage, description, bankName, accountNumber, accountHolder } = data;

    // 필수 필드 확인
    if (!name || !shopName) {
      return NextResponse.json(
        { error: "이름과 상점명은 필수 항목입니다" },
        { status: 400 }
      );
    }

    // Supabase에 KOL 등록
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const { data: newKol, error } = await supabase
      .from('kols')
      .insert({
        user_id: user.id,
        name,
        shop_name: shopName,
        phone: phone || "",
        address: address || "",
        profile_image: profileImage || "",
        description: description || "",
        bank_name: bankName || "",
        account_number: accountNumber || "",
        account_holder: accountHolder || "",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase 등록 오류:", error);
      return NextResponse.json(
        { error: "KOL을 등록하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(newKol, { status: 201 });
  } catch (error) {
    console.error("KOL 등록 오류:", error);
    return NextResponse.json(
      { error: "KOL을 등록하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 