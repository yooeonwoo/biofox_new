import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentDate, getPreviousMonth, getMonthsBetween, getCurrentYearMonth } from '@/lib/date-utils';
import { checkAuthSupabase } from '@/lib/auth';
import { DashboardAdapter } from '@/lib/xano-adapters/dashboard-adapter';

// KOL 월별 매출 데이터 API 라우트
export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const { user } = await checkAuthSupabase(['kol', 'admin']);
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    const userId = user.id!;

    // 쿼리 파라미터에서 KOL ID 가져오기
    const url = new URL(request.url);
    const kolIdParam = url.searchParams.get('kolId');
    const months = url.searchParams.get('months') || '6'; // 기본값 6개월
    
    let kolId: number;
    
    // 🚀 Xano 백엔드에서 KOL ID 조회 시도
    try {
      if (!kolIdParam) {
        // Xano에서 userId로 KOL 정보 조회
        const { rows } = await DashboardAdapter.getKolInfo(userId);
        if (rows && rows[0]) {
          kolId = rows[0].id;
          console.log('Xano에서 KOL ID 조회 성공:', kolId);
        } else {
          throw new Error('Xano에서 KOL 정보를 찾을 수 없습니다.');
        }
      } else {
        kolId = parseInt(kolIdParam);
      }

      // Xano에서 월별 수당 데이터 조회
      const monthlyAllowanceData = await DashboardAdapter.getMonthlyAllowanceData(
        kolId, 
        parseInt(months)
      );

      // 응답 형식 변환 (프론트엔드 호환성)
      const formattedData = monthlyAllowanceData.map(item => ({
        month: item.month.substring(5) + '월', // 'YYYY-MM' → 'MM월'
        allowance: item.commission
      }));

      console.log('Xano 월별 수당 데이터 조회 성공');
      return NextResponse.json(formattedData);

    } catch (xanoError) {
      console.error('Xano 데이터 조회 실패, Supabase fallback 시도:', xanoError);

      // 🔄 Fallback: Xano 실패 시 기존 Supabase 로직 사용
      // KOL ID가 제공되지 않은 경우 로그인한 사용자의 KOL ID 조회
      if (!kolIdParam) {
        // 로그인한 사용자의 KOL ID 가져오기
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .eq('id', userId)
          .single();

        if (userError || !userData) {
          console.error('월별 수당 API - 사용자 조회 실패:', { userId, userError });
          return NextResponse.json(
            { error: '사용자 정보를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        console.log('월별 수당 API - 사용자 정보:', userData);

        const { data: kolData, error: kolError } = await supabaseAdmin
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
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('id', userId)
            .single();
          
          if (!userError && userData) {
            // 관리자가 아니고, 본인 KOL 데이터가 아닌 경우 접근 거부
            if (userData.role !== 'admin') {
              const { data: kolData, error: kolError } = await supabaseAdmin
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
      monthsAgo.setMonth(monthsAgo.getMonth() - (parseInt(months || '6') - 1));
      const startDate = monthsAgo.toISOString().split('T')[0] as string;
      
      // 최근 N개월 범위 생성 (YYYY-MM 형식)
      const monthRange = getMonthsBetween(startDate, currentDate);
      
      console.log('월별 수당 API - 조회 범위:', {
        startDate,
        currentDate,
        monthRange,
        kolId
      });

      // KOL 월별 요약 데이터 조회 - 표준 YYYY-MM 형식 우선 검색
      console.log('월별 수당 API - 검색 범위:', {
        kolId,
        monthRange,
        startDate,
        currentDate
      });
      
      // 1차: 표준 형식(YYYY-MM) 데이터 조회
      const { data: standardData, error: standardError } = await supabaseAdmin
        .from('kol_dashboard_metrics')
        .select('year_month, monthly_commission')
        .eq('kol_id', kolId)
        .in('year_month', monthRange)
        .order('year_month', { ascending: true });

      if (standardError) {
        console.error('KOL 월별 요약 데이터 조회 에러:', standardError);
        return NextResponse.json(
          { error: '월별 데이터를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 2차: 표준 형식에서 찾지 못한 월에 대해 레거시 형식(YYYYMM) 조회
      const foundMonths = new Set(standardData?.map(item => item.year_month) || []);
      const missingMonths = monthRange.filter(month => !foundMonths.has(month));
      const legacyMonths = missingMonths.map(month => month.replace('-', ''));
      
      let legacyData: any[] = [];
      if (legacyMonths.length > 0) {
        const { data: legacyResult, error: legacyError } = await supabaseAdmin
          .from('kol_dashboard_metrics')
          .select('year_month, monthly_commission')
          .eq('kol_id', kolId)
          .in('year_month', legacyMonths)
          .order('year_month', { ascending: true });
        
        if (legacyError) {
          console.error('레거시 형식 데이터 조회 에러:', legacyError);
        } else {
          legacyData = legacyResult || [];
        }
      }

      // 표준 데이터와 레거시 데이터 병합
      const allData = [...(standardData || []), ...legacyData];
      
      console.log('월별 수당 API - DB 조회 결과:', {
        standardCount: standardData?.length || 0,
        legacyCount: legacyData.length,
        totalCount: allData.length,
        standardData,
        legacyData
      });

      // 결과 데이터 가공
      const monthlyData = monthRange.map(yearMonth => {
        // 표준 형식 우선 검색
        let selectedData = standardData?.find(item => item.year_month === yearMonth);
        
        // 표준 형식에 없으면 레거시 형식에서 검색
        if (!selectedData) {
          const yearMonthCompact = yearMonth.replace('-', '');
          selectedData = legacyData.find(item => item.year_month === yearMonthCompact);
          
          if (selectedData) {
            console.log(`월별 수당 - 레거시 형식 사용: ${yearMonth} -> ${yearMonthCompact}`);
          }
        } else {
          console.log(`월별 수당 - 표준 형식 사용: ${yearMonth}`);
        }
        
        return {
          month: yearMonth.substring(5) + '월', // 'MM월' 형식으로 변환
          allowance: selectedData?.monthly_commission || 0
        };
      });

      console.log('월별 수당 API - 최종 응답 (Supabase fallback):', monthlyData);

      return NextResponse.json(monthlyData);
    }
  } catch (error) {
    console.error('KOL 월별 매출 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
