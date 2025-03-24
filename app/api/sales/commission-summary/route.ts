/**
 * 월별 수당 요약 API
 * 
 * KOL의 월별 수당 요약 데이터 조회
 * 
 * GET /api/sales/commission-summary
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - limit: 조회할 개월 수 (기본값: 12)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

// 수당 요약 결과 타입 정의
interface CommissionSummaryResult {
  year_month: string;
  total_commission: number;
  settled_commission: number;
  pending_commission: number;
}

// 기존 쿼리 결과 타입 정의
interface KolMonthlySummaryResult {
  year_month: string;
  monthly_commission: number;
  settled_commission: number;
  pending_commission: number;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("월별 수당 요약 API 호출됨, 유저 ID:", userId);
    
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

    // 여기서 필요한 권한 체크를 할 수 있습니다
    // 예: 본사관리자 또는 KOL만 접근 가능 등
    
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // kolId 필수 체크
    if (!kolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`월별 수당 요약 조회 시작: KOL ID ${kolId}, Limit ${limit}`);
    
    // Supabase RPC 함수 호출
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_commission_summary',
      {
        p_kol_id: parseInt(kolId),
        p_limit: limit
      }
    ) as { data: CommissionSummaryResult[] | null, error: any };
    
    if (summaryError) {
      console.error('월별 수당 요약 조회 RPC 오류:', summaryError);
      
      // RPC 함수가 없을 경우 기존 쿼리 사용
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('kol_monthly_summary')
        .select(`
          year_month,
          monthly_commission,
          settled_commission,
          pending_commission
        `)
        .eq('kol_id', parseInt(kolId))
        .order('year_month', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        console.error('월별 수당 요약 조회 기존 쿼리 오류:', fallbackError);
        return NextResponse.json(
          { success: false, error: '월별 수당 요약을 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 결과 형식 변환
      const formattedFallbackData = (fallbackData || []).map((item: KolMonthlySummaryResult) => ({
        yearMonth: item.year_month,
        totalCommission: item.monthly_commission || 0,
        settledCommission: item.settled_commission || 0,
        pendingCommission: item.pending_commission || 0
      }));
      
      console.log(`월별 수당 요약 조회 완료(기존 쿼리): ${formattedFallbackData.length}개 항목`);
      
      return NextResponse.json({
        success: true,
        data: formattedFallbackData
      });
    }
    
    // 결과 형식 변환
    const formattedSummaryData = (summaryData || []).map((item: CommissionSummaryResult) => ({
      yearMonth: item.year_month,
      totalCommission: item.total_commission || 0,
      settledCommission: item.settled_commission || 0,
      pendingCommission: item.pending_commission || 0
    }));
    
    console.log(`월별 수당 요약 조회 완료(RPC): ${formattedSummaryData.length}개 항목`);
    
    return NextResponse.json({
      success: true,
      data: formattedSummaryData
    });
  } catch (error) {
    console.error('월별 수당 요약 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '월별 수당 요약을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 