import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// KOL 대시보드 API 라우트 
export async function GET() {
  try {
    // 로컬 개발환경용 임시 KOL 정보
    const kolData = {
      id: 1,
      name: '테스트 사용자',
      shop_name: '테스트 샵',
      userId: 'temp-user-id'
    };

    // 현재 월 계산 (YYYY-MM 형식)
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // 대시보드 메트릭 데이터 조회
    const { data, error } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('대시보드 메트릭 조회 오류:', error);
      throw error;
    }

    // 기본값 설정
    const dashboardData = {
      kol: {
        id: kolData.id,
        name: kolData.name,
        shopName: kolData.shop_name
      },
      sales: {
        currentMonth: data?.monthly_sales || 0,
        growth: data?.monthly_sales_growth || 0
      },
      allowance: {
        currentMonth: data?.monthly_commission || 0,
        growth: data?.monthly_commission_growth || 0
      },
      shops: {
        total: data?.total_shops_count || 0,
        ordering: data?.active_shops_count || 0,
        notOrdering: (data?.total_shops_count || 0) - (data?.active_shops_count || 0)
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('대시보드 데이터 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 