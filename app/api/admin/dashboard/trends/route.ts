/**
 * KOL 월별 트렌드 API
 * 전체 KOL의 월별 매출 및 수당 트렌드 데이터를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정 - Next.js 15의 새로운 방식으로 변경
export const dynamic = 'force-dynamic'; // 또는 'auto'

/**
 * GET 요청 처리 - 월별 트렌드 데이터 조회
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

    // URL 쿼리 파라미터에서 개월 수 추출
    const url = new URL(req.url);
    const months = parseInt(url.searchParams.get("months") || "6");

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
  } catch (error) {
    console.error("월별 트렌드 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "월별 트렌드 데이터를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
} 