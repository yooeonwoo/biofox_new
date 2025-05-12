import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate, getPreviousMonth, getMonthsBetween } from '@/lib/date-utils';

// KOL 월별 매출 데이터 API 라우트
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 KOL ID 가져오기
    const url = new URL(request.url);
    const kolIdParam = url.searchParams.get('kolId');
    const months = url.searchParams.get('months') || '6'; // 기본값 6개월
    
    let kolId: number;
    
    // KOL ID가 제공되지 않은 경우 로그인한 사용자의 KOL ID 조회
    if (!kolIdParam) {
      // 로그인한 사용자의 KOL ID 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: '사용자 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const { data: kolData, error: kolError } = await supabase
        .from('kols')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (kolError || !kolData) {
        return NextResponse.json(
          { error: 'KOL 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      kolId = kolData.id;
    } else {
      kolId = parseInt(kolIdParam);
      
      // KOL 접근 권한 확인
      if (userId) {
        // 현재 로그인한 사용자가 요청한 KOL ID에 접근 권한이 있는지 확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('clerk_id', userId)
          .single();
        
        if (!userError && userData) {
          // 관리자가 아니고, 본인 KOL 데이터가 아닌 경우 접근 거부
          if (userData.role !== '본사관리자') {
            const { data: kolData, error: kolError } = await supabase
              .from('kols')
              .select('id')
              .eq('user_id', userData.id)
              .single();
            
            if (!kolError && kolData && kolData.id !== kolId) {
              return NextResponse.json(
                { error: '해당 KOL 데이터에 대한 접근 권한이 없습니다.' },
                { status: 403 }
              );
            }
          }
        }
      }
    }

    // 현재 날짜와 이전 날짜 계산
    const currentDate = getCurrentDate();
    const monthsAgo = new Date(currentDate);
    monthsAgo.setMonth(monthsAgo.getMonth() - (parseInt(months) - 1));
    const startDate = monthsAgo.toISOString().split('T')[0];
    
    // 최근 N개월 범위 생성
    const monthRange = getMonthsBetween(startDate, currentDate);

    // KOL 월별 요약 데이터 조회 (새로운 테이블 사용)
    const { data: summaryData, error: summaryError } = await supabase
      .from('kol_dashboard_metrics')
      .select('year_month, monthly_sales, monthly_commission')
      .eq('kol_id', kolId)
      .in('year_month', monthRange)
      .order('year_month', { ascending: true });

    if (summaryError) {
      console.error('KOL 월별 요약 데이터 조회 에러:', summaryError);
      return NextResponse.json(
        { error: '월별 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 결과 데이터 가공
    const monthlyData = summaryData.map(item => ({
      month: item.year_month.substring(5) + '월', // 'MM월' 형식으로 변환
      sales: item.monthly_sales,
      allowance: item.monthly_commission
    }));

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('KOL 월별 매출 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 