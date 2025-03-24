/**
 * 월별 매출 요약 목록 API
 * 
 * KOL의 여러 달에 걸친 매출, 수당 요약 데이터 조회
 * 
 * GET /api/sales/monthly-summary/list
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - limit: 조회할 개월 수 (기본값: 12)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("월별 매출 요약 목록 API 호출됨, 유저 ID:", userId);
    
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
    const limit = parseInt(searchParams.get('limit') || '12');
    
    let effectiveKolId = kolId;
    
    // KOL ID 확인
    if (role !== '본사관리자') {
      // 관리자가 아닌 경우 자신의 KOL ID만 조회 가능
      const { data: kolData } = await supabase
        .from('kols')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!kolData) {
        return NextResponse.json(
          { error: "KOL 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      
      if (kolId && parseInt(kolId) !== kolData.id) {
        return NextResponse.json(
          { error: "다른 KOL의 정보에 접근할 수 없습니다" },
          { status: 403 }
        );
      }
      
      effectiveKolId = kolData.id.toString();
    }
    
    if (!effectiveKolId) {
      return NextResponse.json(
        { error: "KOL ID가 필요합니다" },
        { status: 400 }
      );
    }
    
    // 월별 매출 데이터 조회
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('monthly_sales')
      .select(`
        year_month,
        product_sales,
        device_sales,
        total_sales,
        commission
      `)
      .eq('kol_id', parseInt(effectiveKolId))
      .order('year_month', { ascending: false })
      .limit(limit);
    
    if (monthlyError) {
      return NextResponse.json(
        { error: "월별 매출 데이터를 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
    
    // 데이터 포맷 변환
    const formattedData = monthlyData.map(item => ({
      yearMonth: item.year_month,
      productSales: item.product_sales,
      deviceSales: item.device_sales,
      totalSales: item.total_sales,
      commission: item.commission
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error("월별 매출 요약 조회 중 오류:", error);
    return NextResponse.json(
      { error: "월별 매출 요약을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 