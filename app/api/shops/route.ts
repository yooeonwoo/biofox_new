import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export interface IShop {
  id?: number;
  kolId: number;
  ownerName: string;
  region: string;
  smartPlaceLink?: string;
  status?: string;
}

// 전문점 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("전문점 목록 API 호출됨, 유저 ID:", userId);
    
    // 사용자 정보 및 역할 확인 - 직접 쿼리로 변경
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .limit(1);
    
    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
    
    if (!userData || userData.length === 0) {
      console.error("사용자 조회 실패:", "사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    const user = userData[0];
    const role = user?.role || '';

    if (role === "본사관리자") {
      // Supabase에서 모든 전문점 목록 조회 (관리자용)
      const { data: shopList, error } = await supabase
        .from('shops')
        .select('*, kols(id, name, shop_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase 조회 오류:", error);
        return NextResponse.json(
          { error: "전문점 목록을 조회하는 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }

      // 응답 형식 변환
      const formattedShops = shopList.map(shop => ({
        id: shop.id,
        kolId: shop.kol_id,
        ownerName: shop.owner_name,
        region: shop.region,
        smartPlaceLink: shop.smart_place_link,
        status: shop.status,
        createdAt: shop.created_at,
        updatedAt: shop.updated_at,
        kol: shop.kols ? {
          id: shop.kols.id,
          name: shop.kols.name,
          shopName: shop.kols.shop_name
        } : null
      }));

      console.log(`전문점 목록 조회 성공(관리자): ${formattedShops.length}개 항목`);
      return NextResponse.json(formattedShops);
    } else {
      // 사용자의 KOL ID 조회
      const { data: kolData } = await supabase
        .from('kols')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!kolData) {
        console.error(`KOL 정보를 찾을 수 없음: 사용자 ID ${userId}`);
        return NextResponse.json(
          { error: "KOL 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // Supabase에서 특정 KOL의 전문점 목록 조회
      const { data: shopList, error } = await supabase
        .from('shops')
        .select('*')
        .eq('kol_id', kolData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase 조회 오류:", error);
        return NextResponse.json(
          { error: "전문점 목록을 조회하는 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }

      // 응답 형식 변환
      const formattedShops = shopList.map(shop => ({
        id: shop.id,
        kolId: shop.kol_id,
        ownerName: shop.owner_name,
        region: shop.region,
        smartPlaceLink: shop.smart_place_link,
        status: shop.status,
        createdAt: shop.created_at,
        updatedAt: shop.updated_at
      }));

      console.log(`전문점 목록 조회 성공(KOL): ${formattedShops.length}개 항목`);
      return NextResponse.json(formattedShops);
    }
  } catch (error) {
    console.error("전문점 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "전문점 목록을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 전문점 등록
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("전문점 등록 API 호출됨, 유저 ID:", userId);
    
    // 사용자 정보 및 역할 확인 - 직접 쿼리로 변경
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .limit(1);
    
    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
    
    if (!userData || userData.length === 0) {
      console.error("사용자 조회 실패:", "사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    const user = userData[0];
    const role = user?.role || '';

    const data = await req.json();
    const { kolId, ownerName, region, smartPlaceLink } = data;

    if (!kolId || !ownerName || !region) {
      return NextResponse.json(
        { error: "KOL ID, 원장님 이름, 지역은 필수 항목입니다" },
        { status: 400 }
      );
    }

    // KOL 존재 여부 확인
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('id', kolId)
      .single();

    if (kolError || !kol) {
      console.error(`존재하지 않는 KOL ID: ${kolId}`);
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본사관리자가 아닌 경우 권한 확인
    if (role !== "본사관리자") {
      // 사용자의 KOL ID 조회
      const { data: userKolData } = await supabase
        .from('kols')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      const userKolId = userKolData?.id;
      
      if (!userKolId || userKolId !== kolId) {
        console.error(`권한 없는 전문점 등록 시도: 요청 KOL ID ${kolId}, 사용자 KOL ID ${userKolId}`);
        return NextResponse.json(
          { error: "자신의 전문점만 등록할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // Supabase에 전문점 등록
    const { data: newShop, error } = await supabase
      .from('shops')
      .insert({
        kol_id: kolId,
        owner_name: ownerName,
        region,
        smart_place_link: smartPlaceLink || "",
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase 등록 오류:", error);
      return NextResponse.json(
        { error: "전문점을 등록하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    const formattedShop = {
      id: newShop.id,
      kolId: newShop.kol_id,
      ownerName: newShop.owner_name,
      region: newShop.region,
      smartPlaceLink: newShop.smart_place_link,
      status: newShop.status,
      createdAt: newShop.created_at,
      updatedAt: newShop.updated_at
    };

    console.log(`전문점 등록 성공: ID ${newShop.id}, 원장명 ${newShop.owner_name}`);
    
    return NextResponse.json(formattedShop, { status: 201 });
  } catch (error) {
    console.error("전문점 등록 오류:", error);
    return NextResponse.json(
      { error: "전문점을 등록하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 