import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkAuth } from "@/lib/auth";

/**
 * 제품 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 추가: 통합 인증 검증
    const authResponse = await checkAuth(request);
    if (authResponse) {
      return authResponse;
    }

    // 로그 추가: API 호출 기록
    console.log("제품 목록 API 호출됨");
    
    // Supabase를 사용하여 제품 목록 조회
    const { data: productList, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("제품 목록 조회 오류:", error);
      return NextResponse.json(
        { error: "제품 목록을 조회하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    // 추가: 성공 로그
    console.log(`제품 목록 조회 성공: ${productList.length}개 항목`);
    
    // 응답 데이터 카멜케이스로 변환
    const formattedProducts = productList.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      isDevice: product.is_device,
      description: product.description,
      image: product.image,
      category: product.category,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));
    
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("제품 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "제품 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 