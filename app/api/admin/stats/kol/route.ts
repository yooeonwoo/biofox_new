/**
 * KOL 세부 통계 API
 * 특정 KOL의 매출, 수당, 전문점 정보 등에 대한 세부 통계 데이터를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정
export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

/**
 * GET 요청 처리 - KOL 세부 통계 정보 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await checkAuthSupabase(["본사관리자"]);
    
    if (authResult instanceof NextResponse) {
      // 인증 또는 권한 오류 - 응답 그대로 반환
      return authResult;
    }
    
    if (!authResult) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // URL 쿼리 파라미터 처리
    const url = new URL(req.url);
    const kolId = url.searchParams.get("kolId");
    const yearMonth = url.searchParams.get("yearMonth");
    const type = url.searchParams.get("type") || "summary"; // 기본값은 요약 통계
    const months = parseInt(url.searchParams.get("months") || "6"); // 트렌드 조회 시 개월 수

    // 필수 파라미터 검증
    if (!kolId) {
      return NextResponse.json(
        { error: "kolId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // type에 따라 적절한 함수 호출
    switch (type) {
      case "summary":
        if (!yearMonth) {
          return NextResponse.json(
            { error: "yearMonth 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        return await getKolSummary(kolId, yearMonth);
        
      case "trends":
        return await getKolTrends(kolId, months);
        
      case "shops":
        if (!yearMonth) {
          return NextResponse.json(
            { error: "yearMonth 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        return await getKolShops(kolId, yearMonth);
        
      case "products":
        if (!yearMonth) {
          return NextResponse.json(
            { error: "yearMonth 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        return await getKolProducts(kolId, yearMonth);
        
      default:
        return NextResponse.json(
          { error: "유효하지 않은 통계 타입입니다." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("KOL 세부 통계 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "KOL 세부 통계를 조회하는 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

/**
 * KOL 요약 통계 조회
 */
async function getKolSummary(kolId: string, yearMonth: string) {
  // kol_monthly_summary 테이블에서 KOL의 월별 요약 통계 조회
  const { data: summary, error } = await serverSupabase
    .from('kol_monthly_summary')
    .select(`
      *,
      kols(id, name, shop_name, profile_image)
    `)
    .eq('kol_id', kolId)
    .eq('year_month', yearMonth)
    .single();

  if (error) {
    // 데이터가 없는 경우
    if (error.code === 'PGRST116') {
      // KOL 정보만 조회하여 기본 데이터 구조 만들기
      const { data: kolInfo, error: kolError } = await serverSupabase
        .from('kols')
        .select('id, name, shop_name, profile_image')
        .eq('id', kolId)
        .single();

      if (kolError) {
        return NextResponse.json(
          { error: "KOL 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const emptyData = {
        id: null,
        kolId: parseInt(kolId),
        yearMonth,
        monthlySales: 0,
        monthlyCommission: 0,
        avgMonthlySales: "0.00",
        cumulativeCommission: 0,
        previousMonthSales: 0,
        previousMonthCommission: 0,
        activeShopsCount: 0,
        totalShopsCount: 0,
        kols: kolInfo
      };

      const response = NextResponse.json({
        success: true,
        data: snakeToCamel(emptyData)
      });
      response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
      return response;
    }

    console.error("KOL 요약 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "KOL 요약 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(summary);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * KOL 트렌드 통계 조회
 */
async function getKolTrends(kolId: string, months: number) {
  // kol_total_monthly_sales 테이블에서 KOL의 월별 트렌드 통계 조회
  const { data: trends, error } = await serverSupabase
    .from('kol_total_monthly_sales')
    .select(`
      id,
      kol_id,
      year_month,
      total_sales,
      product_sales,
      device_sales,
      total_commission,
      total_active_shops,
      direct_sales_ratio
    `)
    .eq('kol_id', kolId)
    .order('year_month', { ascending: false })
    .limit(months);

  if (error) {
    console.error("KOL 트렌드 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "KOL 트렌드 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 월 순서대로 정렬 (오래된 달부터 최신 달 순으로)
  const formattedData = snakeToCamel(trends).reverse();
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * KOL 소속 전문점 통계 조회
 */
async function getKolShops(kolId: string, yearMonth: string) {
  // monthly_sales 테이블에서 KOL 소속 전문점별 매출 통계 조회
  const { data: shopStats, error } = await serverSupabase
    .from('monthly_sales')
    .select(`
      *,
      shops(id, name, owner_name, region, image)
    `)
    .eq('kol_id', kolId)
    .eq('year_month', yearMonth)
    .order('total_sales', { ascending: false });

  if (error) {
    console.error("KOL 전문점 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "KOL 전문점 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(shopStats);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * KOL 제품별 매출 비율 조회
 */
async function getKolProducts(kolId: string, yearMonth: string) {
  // SQL 직접 실행 - KOL의 제품별 매출 비율 집계하여 조회
  const { data, error } = await serverSupabase.rpc('get_kol_product_sales', { 
    p_kol_id: parseInt(kolId), 
    p_year_month: yearMonth 
  });

  if (error) {
    console.error("KOL 제품별 매출 통계 조회 실패:", error);
    
    // 대체 방법: product_sales_ratios 테이블에서 KOL 데이터 직접 조회
    const { data: productData, error: productError } = await serverSupabase
      .from('product_sales_ratios')
      .select(`
        id,
        kol_id,
        year_month,
        product_id,
        sales_amount,
        sales_ratio,
        products(id, name, category, is_device)
      `)
      .eq('kol_id', kolId)
      .eq('year_month', yearMonth)
      .order('sales_ratio', { ascending: false });
      
    if (productError) {
      return NextResponse.json(
        { 
          success: false,
          error: "KOL 제품별 매출 통계를 조회하는 중 오류가 발생했습니다." 
        },
        { status: 500 }
      );
    }
    
    // 데이터 변환
    const formattedData = productData.map((item: any) => {
      const product = item.products || {};
      return {
        id: item.id,
        kolId: item.kol_id,
        yearMonth: item.year_month,
        productId: item.product_id,
        salesAmount: item.sales_amount,
        salesRatio: item.sales_ratio,
        productName: product.name || '알 수 없는 제품',
        productCategory: product.category || '기타',
        isDevice: product.is_device || false
      };
    });
    
    const response = NextResponse.json({
      success: true,
      data: formattedData
    });
    response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
    return response;
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(data || []);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
} 