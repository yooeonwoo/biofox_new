import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate, getPreviousMonth, getMonthsBetween, getCurrentYearMonth } from '@/lib/date-utils';

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
        .select('id, name, email')
        .eq('clerk_id', userId)
        .single();

      if (userError || !userData) {
        console.error('월별 수당 API - 사용자 조회 실패:', { userId, userError });
        return NextResponse.json(
          { error: '사용자 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      console.log('월별 수당 API - 사용자 정보:', userData);

      const { data: kolData, error: kolError } = await supabase
        .from('kols')
        .select('id, name, shop_name')
        .eq('user_id', userData.id)
        .single();

      if (kolError || !kolData) {
        console.error('월별 수당 API - KOL 조회 실패:', { userId: userData.id, kolError });
        return NextResponse.json(
          { error: 'KOL 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      console.log('월별 수당 API - KOL 정보:', kolData);
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

    // 현재 날짜와 이전 날짜 계산 - YYYY-MM 형식으로 통일
    const currentDate = getCurrentDate();
    const monthsAgo = new Date(currentDate);
    monthsAgo.setMonth(monthsAgo.getMonth() - (parseInt(months) - 1));
    const startDate = monthsAgo.toISOString().split('T')[0];
    
    // 최근 N개월 범위 생성 (YYYY-MM 형식)
    const monthRange = getMonthsBetween(startDate, currentDate);
    
    console.log('월별 수당 API - 조회 범위:', {
      startDate,
      currentDate,
      monthRange,
      kolId
    });

    // KOL 월별 요약 데이터 조회 - 표준 YYYY-MM 형식 우선, 레거시 YYYYMM 형식 호환
    const monthRangeCompact = monthRange.map(month => month.replace('-', ''));
    
    console.log('월별 수당 API - 검색 형식:', {
      standardFormat: monthRange,
      legacyFormat: monthRangeCompact
    });
    
    // 표준 형식과 레거시 형식 모두 조회하여 우선순위에 따라 처리
    const { data: summaryData, error: summaryError } = await supabase
      .from('kol_dashboard_metrics')
      .select('year_month, monthly_commission')
      .eq('kol_id', kolId)
      .or(`year_month.in.(${monthRange.join(',')}),year_month.in.(${monthRangeCompact.join(',')})`)
      .order('year_month', { ascending: true });

    if (summaryError) {
      console.error('KOL 월별 요약 데이터 조회 에러:', summaryError);
      return NextResponse.json(
        { error: '월별 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('월별 수당 API - DB 조회 결과:', {
      resultCount: summaryData?.length || 0,
      summaryData
    });

    // 데이터가 없는 경우 빈 배열이지만 월별 구조는 유지
    if (!summaryData || summaryData.length === 0) {
      console.log('월별 수당 API - 데이터 없음, 빈 월별 구조 생성');
      
      // 빈 월별 데이터 구조 생성
      const emptyMonthlyData = monthRange.map(yearMonth => ({
        month: yearMonth.substring(5) + '월', // 'MM월' 형식으로 변환
        allowance: 0
      }));
      
      console.log('월별 수당 API - 빈 데이터 응답:', emptyMonthlyData);
      return NextResponse.json(emptyMonthlyData);
    }

    // 결과 데이터 가공 - 중복 데이터 처리 및 우선순위 적용
    const monthlyData = monthRange.map(yearMonth => {
      // 표준 형식과 레거시 형식 모두 검색하여 우선순위 적용
      const yearMonthCompact = yearMonth.replace('-', '');
      
      // 같은 월의 데이터가 여러 형식으로 있을 경우 표준 형식 우선
      const standardData = summaryData.find(item => item.year_month === yearMonth);
      const legacyData = summaryData.find(item => item.year_month === yearMonthCompact);
      
      let selectedData = null;
      if (standardData) {
        selectedData = standardData;
        console.log(`월별 수당 - 표준 형식 사용: ${yearMonth}`);
      } else if (legacyData) {
        selectedData = legacyData;
        console.log(`월별 수당 - 레거시 형식 사용: ${yearMonthCompact}`);
      }
      
      return {
        month: yearMonth.substring(5) + '월', // 'MM월' 형식으로 변환
        allowance: selectedData?.monthly_commission || 0
      };
    });

    console.log('월별 수당 API - 최종 응답:', monthlyData);

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('KOL 월별 매출 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 