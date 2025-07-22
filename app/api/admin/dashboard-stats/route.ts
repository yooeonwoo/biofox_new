import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 현재 날짜 기준 계산
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 병렬로 모든 통계 데이터 수집
    const [
      kolsCount,
      activeShopsResult,
      monthlyOrdersResult,
      totalSalesResult,
      lastMonthOrdersResult,
      salesChartData
    ] = await Promise.all([
      // KOL/OL 수
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .in('role', ['kol', 'ol'])
        .eq('status', 'approved'),

      // 활성 매장 수
      supabase
        .from('shop_relationships')
        .select('shop_owner_id', { count: 'exact' })
        .eq('is_active', true),

      // 이번 달 주문 수
      supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('order_date', currentMonth.toISOString()),

      // 이번 달 총 매출
      supabase
        .from('orders')
        .select('total_amount')
        .gte('order_date', currentMonth.toISOString()),

      // 지난 달 주문 수 (비교용)
      supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('order_date', lastMonth.toISOString())
        .lt('order_date', currentMonth.toISOString()),

      // 최근 7일 매출 차트 데이터
      supabase
        .from('orders')
        .select('order_date, total_amount')
        .gte('order_date', last7Days.toISOString())
        .order('order_date', { ascending: true })
    ]);

    // 매출 계산
    const totalSales = totalSalesResult.data?.reduce((sum: number, order: any) => {
      return sum + (order.total_amount || 0);
    }, 0) || 0;

    // 차트 데이터 처리
    const chartData = salesChartData.data || [];
    const salesByDate: Record<string, number> = {};
    
    chartData.forEach((order: any) => {
      if (order?.order_date && typeof order.order_date === 'string') {
        try {
          const dateStr = new Date(order.order_date).toISOString().split('T')[0];
          if (dateStr) {
            salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (order.total_amount || 0);
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    // 최근 7일 날짜 배열 생성
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      if (dateStr) {
        salesChart.push({
          date: formattedDate,
          sales: salesByDate[dateStr] || 0
        });
      }
    }

    // 응답 데이터
    const stats = {
      kolsCount: kolsCount.count || 0,
      activeShops: activeShopsResult.count || 0,
      monthlyOrders: monthlyOrdersResult.count || 0,
      lastMonthOrders: lastMonthOrdersResult.count || 0,
      totalSales,
      salesChart,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 