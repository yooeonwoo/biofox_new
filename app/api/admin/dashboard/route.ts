/**
 * 관리자 대시보드 API
 * 전체 매출 및 KOL 현황 정보를 제공하는 API
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { checkAuthSupabase } from "@/lib/auth";

// 응답 캐싱 설정 - Next.js 15의 새로운 방식으로 변경
export const dynamic = 'force-dynamic'; // 또는 'auto'
// 이전 방식: export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

/**
 * GET 요청 처리 - 대시보드 요약 통계 정보 조회
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

    // URL 쿼리 파라미터에서 yearMonth 추출
    const url = new URL(req.url);
    const yearMonth = url.searchParams.get("yearMonth");

    if (!yearMonth) {
      return NextResponse.json(
        { error: "yearMonth 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error("대시보드 통계 조회 실패:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "대시보드 통계를 조회하는 중 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
} 