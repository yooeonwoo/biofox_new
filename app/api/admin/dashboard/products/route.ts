/**
 * 제품별 매출 비율 API
 * 전체 제품의 매출 비율 데이터를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// 응답 캐싱 설정
export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

/**
 * GET 요청 처리 - 제품별 매출 비율 데이터 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 쿼리 파라미터에서 yearMonth 추출
    const url = new URL(req.url);
    const yearMonth = url.searchParams.get("yearMonth");

    if (!yearMonth) {
      return NextResponse.json(
        { error: "yearMonth 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase를 사용하여 제품별 매출 비율 데이터 조회
    // SQL 쿼리 직접 실행으로 변경
    const { data: productSalesData, error } = await serverSupabase
      .from('product_total_sales_stats')
      .select(`
        id, 
        year_month,
        product_id,
        total_sales_amount,
        sales_ratio,
        sales_growth_rate,
        products (
          id,
          name,
          category
        )
      `)
      .eq('year_month', yearMonth)
      .order('sales_ratio', { ascending: false });

    if (error) {
      console.error("제품별 매출 비율 조회 실패:", error);
      return NextResponse.json(
        { 
          success: false,
          error: "제품별 매출 비율 데이터를 조회하는 중 오류가 발생했습니다." 
        },
        { status: 500 }
      );
    }

    // 스네이크 케이스를 카멜 케이스로 변환
    const formattedData = productSalesData.map((item: any) => {
      const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        id: item.id,
        yearMonth: item.year_month,
        productId: item.product_id,
        totalSalesAmount: item.total_sales_amount,
        salesRatio: item.sales_ratio,
        salesGrowthRate: item.sales_growth_rate || '0.00',
        productName: productInfo?.name || '알 수 없는 제품',
        productCategory: productInfo?.category || '기타'
      };
    });

    // 캐싱 헤더 적용
    const response = NextResponse.json({
      success: true,
      data: formattedData
    });
    
    response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
    return response;
  } catch (error) {
    console.error("제품별 매출 비율 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "제품별 매출 비율 데이터를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
} 