import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate, getPreviousMonth } from '@/lib/date-utils';

// KOL 대시보드 API 라우트 
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 현재 월과 이전 월 계산 (YYYY-MM 형식)
    const currentDate = getCurrentDate();
    const currentMonth = currentDate.substring(0, 7);
    const previousMonth = getPreviousMonth(currentDate);

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
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
      .select('id, name, shop_name')
      .eq('user_id', userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // KOL 월별 요약 정보 조회
    const { data: summaryData, error: summaryError } = await supabase
      .from('kol_monthly_summary')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .single();

    // 전문점 정보 조회
    const { data: shopsData, error: shopsError } = await supabase
      .from('shops')
      .select('id')
      .eq('kol_id', kolData.id)
      .eq('status', 'active');

    // 활성 전문점 수와 주문한 전문점 수 계산
    const totalShops = shopsData?.length || 0;
    
    // 이번 달에 주문한 전문점 조회
    const { data: orderingShopsData, error: orderingShopsError } = await supabase
      .from('monthly_sales')
      .select('shop_id')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .gt('total_sales', 0);

    const orderingShops = new Set(orderingShopsData?.map(shop => shop.shop_id) || []);
    const activeOrderingShops = orderingShops.size;

    // 대시보드 데이터 구성
    const dashboardData = {
      kol: {
        id: kolData.id,
        name: kolData.name,
        shopName: kolData.shop_name
      },
      sales: {
        currentMonth: summaryData?.monthly_sales || 0,
        previousMonth: summaryData?.previous_month_sales || 0,
        growth: summaryData?.monthly_sales - (summaryData?.previous_month_sales || 0)
      },
      allowance: {
        currentMonth: summaryData?.monthly_commission || 0,
        previousMonth: summaryData?.previous_month_commission || 0,
        growth: summaryData?.monthly_commission - (summaryData?.previous_month_commission || 0)
      },
      shops: {
        total: totalShops,
        ordering: activeOrderingShops,
        notOrdering: totalShops - activeOrderingShops
      }
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('KOL 대시보드 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 