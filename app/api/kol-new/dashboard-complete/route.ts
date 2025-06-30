import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentDate, getPreviousMonth, getCurrentYearMonth } from '@/lib/date-utils';
import { checkAuthSupabase } from '@/lib/auth';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-client';

// 🚀 통합 대시보드 API - 모든 데이터를 한 번에 로드하여 성능 최적화
export async function GET() {
  try {
    console.log('통합 대시보드 API 요청 시작');

    // 1. 인증 체크
    const { user } = await checkAuthSupabase(['kol', 'admin']);
    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }

    console.log('Dashboard Complete API - 현재 사용자:', {
      id: user.id,
      name: user.name,
      role: user.role
    });

    // 2. Supabase 연결
    const cookieStore = await cookies();
    const supabaseClient = supabaseServer(cookieStore);

    // 3. 실제 KOL 데이터 조회
    let kolData = null;
    const { data: kolInfo, error: kolError } = await supabaseClient
      .from('kols')
      .select('id, name, shop_name, user_id')
      .eq('user_id', user.id)
      .single();

    if (!kolError && kolInfo) {
      kolData = {
        id: kolInfo.id,
        name: kolInfo.name || user.name,
        shop_name: kolInfo.shop_name || '미지정',
        userId: kolInfo.user_id
      };
      console.log('조회된 KOL 데이터:', kolData);
    } else {
      console.warn(`사용자 ${user.id}(${user.name})의 KOL 데이터가 없습니다:`, kolError);
      kolData = {
        id: null,
        name: user.name,
        shop_name: 'KOL 정보 없음',
        userId: user.id
      };
    }

    const userData = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // 현재 월과 이전 월 계산 - YYYY-MM 형식으로 통일
    const currentDate = getCurrentDate();
    const currentMonth = getCurrentYearMonth(); // "2025-05"
    const previousMonth = getPreviousMonth(currentDate); // "2025-04"

    // 레거시 호환성을 위한 YYYYMM 형식
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"
    const previousMonthCompact = previousMonth.replace('-', ''); // "202504"

    console.log(`통합 대시보드 - 월 정보:`, {
      currentMonth,
      previousMonth,
      currentMonthCompact,
      previousMonthCompact,
      kolId: kolData.id
    });

    // 🚀 전문점 데이터 조회 (KOL ID가 있는 경우만)
    let shopsData;
    if (kolData.id) {
      shopsData = await supabase
        .from('shops')
        .select(`
          id,
          owner_name,
          shop_name,
          region,
          status,
          created_at,
          is_owner_kol,
          is_self_shop,
          shop_sales_metrics (
            total_sales,
            product_sales,
            device_sales,
            year_month
          )
        `)
        .eq('kol_id', kolData.id)
        .eq('is_self_shop', false); // 본인 샵 제외
    } else {
      shopsData = { data: [], error: null };
    }

    // 우선순위 로직으로 대시보드 메트릭 조회 - 표준 형식 우선 (KOL ID가 있는 경우만)
    let dashboardMetrics = null;
    let previousMonthData = null;
    
    if (kolData.id) {
      // 1단계: 표준 형식(YYYY-MM) 먼저 시도
      const { data: standardCurrentData, error: standardCurrentError } = await supabase
        .from('kol_dashboard_metrics')
        .select('*')
        .eq('kol_id', kolData.id)
        .eq('year_month', currentMonth)
        .maybeSingle();

      if (standardCurrentError && standardCurrentError.code !== 'PGRST116') {
        console.error('표준 형식 대시보드 메트릭 조회 오류:', standardCurrentError);
      }

      if (standardCurrentData) {
        dashboardMetrics = standardCurrentData;
        console.log(`표준 형식 데이터 사용: ${currentMonth} for KOL ${kolData.id}`);
      } else {
        // 2단계: 레거시 형식(YYYYMM) 시도
        const { data: legacyCurrentData, error: legacyCurrentError } = await supabase
          .from('kol_dashboard_metrics')
          .select('*')
          .eq('kol_id', kolData.id)
          .eq('year_month', currentMonthCompact)
          .maybeSingle();

        if (legacyCurrentError && legacyCurrentError.code !== 'PGRST116') {
          console.error('레거시 형식 대시보드 메트릭 조회 오류:', legacyCurrentError);
        }

        if (legacyCurrentData) {
          dashboardMetrics = legacyCurrentData;
          console.log(`레거시 형식 데이터 사용: ${currentMonthCompact} for KOL ${kolData.id}`);
        } else {
          console.log(`대시보드 메트릭 데이터 없음: ${currentMonth}/${currentMonthCompact} for KOL ${kolData.id}`);
        }
      }

      // 우선순위 로직으로 이전 월 데이터 조회 - 표준 형식 우선
      // 1단계: 표준 형식(YYYY-MM) 먼저 시도
      const { data: standardPrevData, error: standardPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .select('monthly_sales, monthly_commission')
        .eq('kol_id', kolData.id)
        .eq('year_month', previousMonth)
        .maybeSingle();

      if (standardPrevError && standardPrevError.code !== 'PGRST116') {
        console.error('표준 형식 이전 월 데이터 조회 오류:', standardPrevError);
      }

      if (standardPrevData) {
        previousMonthData = standardPrevData;
        console.log(`표준 형식 이전 월 데이터 사용: ${previousMonth} for KOL ${kolData.id}`);
      } else {
        // 2단계: 레거시 형식(YYYYMM) 시도
        const { data: legacyPrevData, error: legacyPrevError } = await supabase
          .from('kol_dashboard_metrics')
          .select('monthly_sales, monthly_commission')
          .eq('kol_id', kolData.id)
          .eq('year_month', previousMonthCompact)
          .maybeSingle();

        if (legacyPrevError && legacyPrevError.code !== 'PGRST116') {
          console.error('레거시 형식 이전 월 데이터 조회 오류:', legacyPrevError);
        }

        if (legacyPrevData) {
          previousMonthData = legacyPrevData;
          console.log(`레거시 형식 이전 월 데이터 사용: ${previousMonthCompact} for KOL ${kolData.id}`);
        } else {
          console.log(`이전 월 데이터 없음: ${previousMonth}/${previousMonthCompact} for KOL ${kolData.id}`);
        }
      }
    }

    // 오류 처리
    if (shopsData.error) {
      console.error('전문점 데이터 조회 오류:', shopsData.error);
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics?.monthly_commission || 0;
    const previousMonthSales = previousMonthData?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData?.monthly_commission || 0;
    const totalShops = dashboardMetrics?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics?.active_shops_count || 0;

    // 전문점 데이터 가공 - 우선순위 로직으로 현재 월 매출 데이터 선택
    const formattedShops = (shopsData.data || []).map((shop: any) => {
      // 현재 월 매출 데이터 찾기 - 표준 형식 우선, 레거시 형식 호환
      let currentMonthSales = null;
      
      if (shop.shop_sales_metrics && shop.shop_sales_metrics.length > 0) {
        // 1단계: 표준 형식(YYYY-MM) 우선 검색
        currentMonthSales = shop.shop_sales_metrics.find((metric: any) => 
          metric.year_month === currentMonth
        );
        
        // 2단계: 레거시 형식(YYYYMM) 검색 (표준 형식이 없는 경우)
        if (!currentMonthSales) {
          currentMonthSales = shop.shop_sales_metrics.find((metric: any) => 
            metric.year_month === currentMonthCompact
          );
        }
      }
      
      return {
        id: shop.id,
        ownerName: shop.owner_name,
        shop_name: shop.shop_name || shop.owner_name,
        region: shop.region,
        status: shop.status,
        createdAt: shop.created_at,
        is_owner_kol: shop.is_owner_kol,
        sales: {
          total: currentMonthSales?.total_sales || 0,
          product: currentMonthSales?.product_sales || 0,
          device: currentMonthSales?.device_sales || 0,
          hasOrdered: (currentMonthSales?.total_sales || 0) > 0
        }
      };
    });

    // 통합 응답 데이터 구성
    const completeData = {
      dashboard: {
        kol: {
          id: kolData.id,
          name: kolData.name,
          shopName: kolData.shop_name
        },
        sales: {
          currentMonth: monthlySales,
          previousMonth: previousMonthSales,
          growth: monthlySales - previousMonthSales
        },
        allowance: {
          currentMonth: monthlyCommission,
          previousMonth: previousMonthCommission,
          growth: monthlyCommission - previousMonthCommission
        },
        shops: {
          total: totalShops,
          ordering: activeOrderingShops,
          notOrdering: totalShops - activeOrderingShops
        }
      },
      shops: {
        shops: formattedShops,
        meta: {
          totalShopsCount: totalShops,
          activeShopsCount: activeOrderingShops
        }
      }
    };

    console.log(`통합 대시보드 데이터 생성 완료: KOL ID=${kolData.id}`);
    return NextResponse.json(completeData);

  } catch (error) {
    console.error('통합 대시보드 데이터 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}