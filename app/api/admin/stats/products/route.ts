/**
 * 제품별 매출 통계 API
 * 제품별 매출 비율 및 성장률 등의 통계 데이터를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정
export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

/**
 * GET 요청 처리 - 제품별 매출 통계 정보 조회
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
    const yearMonth = url.searchParams.get("yearMonth");
    const type = url.searchParams.get("type") || "ranking"; // 기본값은 매출 순위
    const limit = parseInt(url.searchParams.get("limit") || "10"); // 상위 몇 개 제품 표시
    const productId = url.searchParams.get("productId");
    const months = parseInt(url.searchParams.get("months") || "6"); // 트렌드 조회 시 개월 수

    // yearMonth 검증
    if ((type === "ranking" || type === "category") && !yearMonth) {
      return NextResponse.json(
        { error: "yearMonth 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // API 호출 타입에 따라 적절한 함수 호출
    switch (type) {
      case "ranking":
        return await getProductRanking(yearMonth!, limit);
        
      case "trends":
        if (!productId) {
          return NextResponse.json(
            { error: "productId 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        return await getProductTrends(productId, months);
        
      case "category":
        return await getProductCategoryStats(yearMonth!);
        
      case "details":
        if (!productId || !yearMonth) {
          return NextResponse.json(
            { error: "productId와 yearMonth 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        return await getProductDetails(productId, yearMonth);
        
      default:
        return NextResponse.json(
          { error: "유효하지 않은 통계 타입입니다." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("제품 통계 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "제품 통계를 조회하는 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

/**
 * 제품 매출 순위 통계 조회
 */
async function getProductRanking(yearMonth: string, limit: number) {
  // product_total_sales_stats 테이블에서 제품별 매출 순위 조회
  const { data: productRanking, error } = await serverSupabase
    .from('product_total_sales_stats')
    .select(`
      id,
      year_month,
      product_id,
      total_sales_amount,
      sales_ratio,
      sales_growth_rate,
      order_count,
      products(id, name, category, is_device, price, image)
    `)
    .eq('year_month', yearMonth)
    .order('total_sales_amount', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("제품 매출 순위 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "제품 매출 순위를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 데이터 변환 및 포맷팅
  const formattedData = productRanking.map((item: any, index: number) => {
    const product = item.products || {};
    return {
      id: item.id,
      rank: index + 1,
      yearMonth: item.year_month,
      productId: item.product_id,
      totalSalesAmount: item.total_sales_amount,
      salesRatio: item.sales_ratio,
      salesGrowthRate: item.sales_growth_rate || '0.00',
      orderCount: item.order_count,
      productName: product.name || '알 수 없는 제품',
      productCategory: product.category || '기타',
      isDevice: product.is_device || false,
      price: product.price || 0,
      image: product.image || null
    };
  });
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * 제품 매출 트렌드 조회
 */
async function getProductTrends(productId: string, months: number) {
  // product_total_sales_stats 테이블에서 특정 제품의 매출 트렌드 조회
  const { data: productTrends, error } = await serverSupabase
    .from('product_total_sales_stats')
    .select(`
      id,
      year_month,
      product_id,
      total_sales_amount,
      sales_ratio,
      sales_growth_rate,
      order_count
    `)
    .eq('product_id', productId)
    .order('year_month', { ascending: false })
    .limit(months);

  if (error) {
    console.error("제품 매출 트렌드 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "제품 매출 트렌드를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 제품 정보 조회
  const { data: productInfo, error: productError } = await serverSupabase
    .from('products')
    .select('id, name, category, is_device, price')
    .eq('id', productId)
    .single();

  if (productError) {
    console.error("제품 정보 조회 실패:", productError);
    return NextResponse.json(
      { 
        success: false,
        error: "제품 정보를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 월 순서대로 정렬 (오래된 달부터 최신 달 순으로)
  const trendsData = snakeToCamel(productTrends).reverse();
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: {
      product: snakeToCamel(productInfo),
      trends: trendsData
    }
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * 카테고리별 제품 매출 통계 조회
 */
async function getProductCategoryStats(yearMonth: string) {
  // SQL 직접 실행 - 카테고리별 매출 합계 및 비율 계산
  const { data, error } = await serverSupabase.rpc('get_product_category_stats', { 
    p_year_month: yearMonth 
  });

  if (error) {
    console.error("카테고리별 매출 통계 조회 실패:", error);
    
    // 대체 방법: 직접 조인 쿼리 실행
    const { data: categoryData, error: categoryError } = await serverSupabase
      .from('product_total_sales_stats')
      .select(`
        year_month,
        total_sales_amount,
        products(category)
      `)
      .eq('year_month', yearMonth);
      
    if (categoryError) {
      return NextResponse.json(
        { 
          success: false,
          error: "카테고리별 매출 통계를 조회하는 중 오류가 발생했습니다." 
        },
        { status: 500 }
      );
    }
    
    // 카테고리별 합계 계산
    const categories: Record<string, number> = {};
    let totalAmount = 0;
    
    categoryData.forEach((item: any) => {
      const category = item.products?.category || '기타';
      const amount = item.total_sales_amount || 0;
      
      categories[category] = (categories[category] || 0) + amount;
      totalAmount += amount;
    });
    
    // 비율 계산 및 결과 포맷팅
    const formattedData = Object.entries(categories).map(([category, amount]) => ({
      category,
      totalSalesAmount: amount,
      salesRatio: totalAmount > 0 ? Number((amount / totalAmount).toFixed(4)) : 0
    })).sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);
    
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

/**
 * 제품 상세 매출 정보 조회
 */
async function getProductDetails(productId: string, yearMonth: string) {
  // 제품 기본 정보와 매출 통계 동시 조회
  const [productInfoResult, productStatsResult] = await Promise.all([
    serverSupabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single(),
    
    serverSupabase
      .from('product_total_sales_stats')
      .select('*')
      .eq('product_id', productId)
      .eq('year_month', yearMonth)
      .single()
  ]);

  if (productInfoResult.error) {
    console.error("제품 정보 조회 실패:", productInfoResult.error);
    return NextResponse.json(
      { 
        success: false,
        error: "제품 정보를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  const productInfo = productInfoResult.data;
  let productStats = null;
  
  // 통계 데이터가 없는 경우 빈 객체 생성
  if (productStatsResult.error && productStatsResult.error.code === 'PGRST116') {
    productStats = {
      id: null,
      year_month: yearMonth,
      product_id: parseInt(productId),
      total_sales_amount: 0,
      sales_ratio: 0,
      sales_growth_rate: 0,
      order_count: 0
    };
  } else if (productStatsResult.error) {
    console.error("제품 통계 조회 실패:", productStatsResult.error);
    return NextResponse.json(
      { 
        success: false,
        error: "제품 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  } else {
    productStats = productStatsResult.data;
  }

  // KOL별 제품 판매 비율 - 상위 5명 조회
  const { data: kolSalesData, error: kolSalesError } = await serverSupabase
    .from('product_sales_ratios')
    .select(`
      kol_id,
      sales_amount,
      kols(id, name, shop_name)
    `)
    .eq('product_id', productId)
    .eq('year_month', yearMonth)
    .order('sales_amount', { ascending: false })
    .limit(5);

  if (kolSalesError) {
    console.error("KOL별 제품 판매 비율 조회 실패:", kolSalesError);
  }

  // 응답 데이터 구성
  const responseData = {
    product: snakeToCamel(productInfo),
    stats: snakeToCamel(productStats),
    topKols: kolSalesData ? snakeToCamel(kolSalesData) : []
  };
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: responseData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
} 