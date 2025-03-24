/**
 * 제품별 매출 비율 API
 * 
 * 전문점/KOL별 월간 제품 매출 비율 데이터 조회
 * 
 * GET /api/sales/product-ratios
 * 쿼리 파라미터:
 * - kolId: KOL ID
 * - shopId: 전문점 ID
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentYearMonth } from '@/lib/sales-utils';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

// 제품 비율 결과 타입 정의
interface ProductRatio {
  productId: number;
  productName: string | null;
  salesAmount: number;
  salesRatio: string;
}

// Supabase RPC 함수 반환 결과 타입 정의
interface ProductRatioResult {
  product_id: number;
  product_name: string | null;
  sales_amount: number;
  sales_ratio: string;
}

// Supabase 쿼리 반환 결과 타입 정의
interface ProductRatioQueryResult {
  product_id: number;
  products?: {
    id: number;
    name: string | null;
  };
  sales_amount: number;
  sales_ratio: string;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("제품별 매출 비율 API 호출됨");
    
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
    
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const shopId = searchParams.get('shopId');
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    // 권한 확인
    if (role !== '본사관리자') {
      if (role === 'kol') {
        // 사용자의 KOL ID 조회
        const { data: kolData } = await supabase
          .from('kols')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        const userKolId = kolData?.id;
        
        if (kolId && parseInt(kolId) !== userKolId) {
          console.error(`권한 없는 KOL 데이터 접근 시도: 요청 KOL ID ${kolId}, 사용자 KOL ID ${userKolId}`);
          return NextResponse.json(
            { success: false, error: '접근 권한이 없습니다.' },
            { status: 403 }
          );
        }
        
        if (!kolId && userKolId) {
          const updatedParams = new URLSearchParams(searchParams);
          updatedParams.set('kolId', userKolId.toString());
        }
      } else {
        return NextResponse.json(
          { success: false, error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }
    
    if (!kolId && !shopId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID 또는 전문점 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`제품별 매출 비율 조회 시작: KOL ID ${kolId}, 전문점 ID ${shopId}, 연월 ${yearMonth}`);
    
    // Supabase RPC 함수 호출
    const { data: productRatios, error: ratiosError } = await supabase.rpc(
      'get_product_sales_with_details',
      {
        p_kol_id: kolId ? parseInt(kolId) : null,
        p_shop_id: shopId ? parseInt(shopId) : null,
        p_year_month: yearMonth
      }
    ) as { data: ProductRatioResult[] | null, error: any };
    
    if (ratiosError) {
      console.error("제품별 매출 비율 RPC 호출 오류:", ratiosError);
      
      // RPC 함수가 없을 경우 기존 쿼리 사용
      let query = supabase
        .from('product_sales_ratios')
        .select('*, products(id, name)')
        .eq('year_month', yearMonth)
        .order('sales_amount', { ascending: false });
      
      if (kolId) {
        query = query.eq('kol_id', parseInt(kolId));
      }
      
      if (shopId) {
        query = query.eq('shop_id', parseInt(shopId));
      }
      
      // 쿼리 실행
      const { data: fallbackData, error: fallbackError } = await query;
      
      if (fallbackError) {
        console.error("제품별 매출 비율 조회 오류:", fallbackError);
        return NextResponse.json(
          { success: false, error: '제품별 매출 비율을 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      console.log(`제품별 매출 비율 조회 성공(기존 쿼리): ${fallbackData?.length || 0}개 항목`);
      
      if (!fallbackData || fallbackData.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      
      // 결과 형식 변환
      const formattedResults = (fallbackData || []).map((ratio: ProductRatioQueryResult) => ({
        productId: ratio.product_id,
        productName: ratio.products?.name || null,
        salesAmount: ratio.sales_amount || 0,
        salesRatio: ratio.sales_ratio || '0%'
      }));
      
      return NextResponse.json({
        success: true,
        data: formattedResults
      });
    }
    
    console.log(`제품별 매출 비율 조회 성공(RPC): ${productRatios?.length || 0}개 항목`);
    
    if (!productRatios || productRatios.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // 결과 형식 변환 (RPC 함수 반환 형식에 맞게 조정)
    const formattedResults = (productRatios || []).map((ratio: ProductRatioResult) => ({
      productId: ratio.product_id,
      productName: ratio.product_name,
      salesAmount: ratio.sales_amount || 0,
      salesRatio: ratio.sales_ratio || '0%'
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('제품별 매출 비율 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '제품별 매출 비율을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 