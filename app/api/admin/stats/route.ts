/**
 * 관리자 통계 API
 * 전체 매출, KOL, 전문점 등에 대한 통계 정보를 제공합니다.
 * 미리 계산된 통계 테이블(admin_dashboard_stats, kol_total_monthly_sales 등)을 활용합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정
export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

/**
 * GET 요청 처리 - 통계 정보 조회
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
    const type = url.searchParams.get("type") || "dashboard"; // 기본값은 대시보드 통계
    const yearMonth = url.searchParams.get("yearMonth");
    const kolId = url.searchParams.get("kolId");
    const months = parseInt(url.searchParams.get("months") || "6"); // 트렌드 조회 시 개월 수
    const limit = parseInt(url.searchParams.get("limit") || "10"); // 제품 데이터 제한

    // yearMonth가 필요한 쿼리에 대해 검증
    if ((type === "dashboard" || type === "kol" || type === "products") && !yearMonth) {
      return NextResponse.json(
        { error: "yearMonth 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // API 호출 타입에 따라 적절한 데이터 조회
    switch (type) {
      case "dashboard":
        return await getDashboardStats(yearMonth!, req);
      case "trends":
        return await getTrendsStats(months, req);
      case "kol":
        return await getKolStats(yearMonth!, kolId, req);
      case "kol-list":
        return await getKolListStats(yearMonth!, req);
      case "products":
        return await getProductStats(yearMonth!, limit, req);
      default:
        return NextResponse.json(
          { error: "유효하지 않은 통계 타입입니다." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("통계 정보 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "통계 정보를 조회하는 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

/**
 * 대시보드 요약 통계 정보 조회 함수
 */
async function getDashboardStats(yearMonth: string, req: NextRequest) {
  // Supabase를 사용하여 대시보드 통계 데이터 조회
  const { data: stats, error } = await serverSupabase
    .from('admin_dashboard_stats')
    .select('*')
    .eq('year_month', yearMonth)
    .limit(1)
    .single();

  if (error) {
    // 데이터가 없는 경우 (PGRST116 = not found)
    if (error.code === 'PGRST116') {
      // 빈 데이터 구조 반환
      const emptyData = {
        yearMonth,
        totalKolsCount: 0,
        totalShopsCount: 0,
        activeKolsCount: 0,
        activeShopsCount: 0,
        totalSales: 0,
        productSales: 0,
        deviceSales: 0,
        totalCommission: 0,
        previousMonthSales: 0,
        previousMonthCommission: 0,
        salesGrowthRate: "0.00",
        commissionGrowthRate: "0.00"
      };

      // 캐싱 헤더 적용
      const response = NextResponse.json({
        success: true,
        data: emptyData
      });
      response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
      return response;
    }

    console.error("대시보드 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "대시보드 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(stats);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * 트렌드 통계 정보 조회 함수
 */
async function getTrendsStats(months: number, req: NextRequest) {
  // Supabase를 사용하여 월별 통계 데이터 최근 n개월치 조회
  const { data: trendData, error } = await serverSupabase
    .from('admin_dashboard_stats')
    .select(`
      year_month,
      total_sales,
      product_sales,
      device_sales,
      total_commission,
      active_kols_count,
      total_kols_count
    `)
    .order('year_month', { ascending: false })
    .limit(months);

  if (error) {
    console.error("월별 트렌드 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "월별 트렌드 데이터를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 월 순서대로 정렬 (오래된 달부터 최신 달 순으로)
  const formattedData = snakeToCamel(trendData).reverse();

  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * KOL별 통계 정보 조회 함수
 */
async function getKolStats(yearMonth: string, kolId: string | null, req: NextRequest) {
  if (!kolId) {
    return NextResponse.json(
      { error: "KOL ID가 필요합니다." },
      { status: 400 }
    );
  }

  // Supabase를 사용하여 특정 KOL의 월별 통계 데이터 조회
  const { data: kolStats, error } = await serverSupabase
    .from('kol_total_monthly_sales')
    .select(`
      *,
      kols(id, name, shop_name)
    `)
    .eq('year_month', yearMonth)
    .eq('kol_id', kolId)
    .single();

  if (error) {
    // 데이터가 없는 경우
    if (error.code === 'PGRST116') {
      // KOL 정보만 조회하여 기본 데이터 구조 만들기
      const { data: kolInfo, error: kolError } = await serverSupabase
        .from('kols')
        .select('id, name, shop_name')
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
        totalSales: 0,
        productSales: 0,
        deviceSales: 0,
        totalCommission: 0,
        totalActiveShops: 0,
        totalShops: 0,
        directSalesRatio: "0.00",
        indirectSalesRatio: "0.00",
        kols: kolInfo
      };

      const response = NextResponse.json({
        success: true,
        data: snakeToCamel(emptyData)
      });
      response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
      return response;
    }

    console.error("KOL 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "KOL 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(kolStats);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * KOL 목록과 해당 월 매출 통계 조회 함수
 */
async function getKolListStats(yearMonth: string, req: NextRequest) {
  // Supabase를 사용하여 전체 KOL 매출 통계 데이터 조회
  const { data: kolStats, error } = await serverSupabase
    .from('kol_total_monthly_sales')
    .select(`
      *,
      kols(id, name, shop_name)
    `)
    .eq('year_month', yearMonth)
    .order('total_sales', { ascending: false });

  if (error) {
    console.error("KOL 목록 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "KOL 목록 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }

  // 스네이크 케이스를 카멜 케이스로 변환
  const formattedData = snakeToCamel(kolStats);
  
  // 캐싱 헤더 적용
  const response = NextResponse.json({
    success: true,
    data: formattedData
  });
  response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
  return response;
}

/**
 * 제품별 통계 정보 조회 함수
 */
async function getProductStats(yearMonth: string, limit: number, req: NextRequest) {
  // Supabase를 사용하여 제품별 매출 비율 데이터 조회
  const { data: productSalesData, error } = await serverSupabase
    .from('product_total_sales_stats')
    .select(`
      id, 
      year_month,
      product_id,
      total_sales_amount,
      sales_ratio,
      sales_growth_rate,
      order_count,
      products (
        id,
        name,
        category,
        is_device
      )
    `)
    .eq('year_month', yearMonth)
    .order('sales_ratio', { ascending: false })
    .limit(limit);

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

  // 스네이크 케이스를 카멜 케이스로 변환 및 데이터 포맷팅
  const formattedData = productSalesData.map((item: any) => {
    const productInfo = item.products;
    return {
      id: item.id,
      yearMonth: item.year_month,
      productId: item.product_id,
      totalSalesAmount: item.total_sales_amount,
      salesRatio: item.sales_ratio,
      salesGrowthRate: item.sales_growth_rate || '0.00',
      orderCount: item.order_count,
      productName: productInfo?.name || '알 수 없는 제품',
      productCategory: productInfo?.category || '기타',
      isDevice: productInfo?.is_device || false
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