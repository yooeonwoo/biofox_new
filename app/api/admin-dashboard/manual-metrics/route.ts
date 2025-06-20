import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client'; 
// import { KolDashboardMetric } from '@/types/supabase'; // 타입 경로 확인 - 임시로 any 사용
type KolDashboardMetric = any; // 임시 타입 정의

// GET 요청 처리: 특정 KOL의 특정 년월 실적 및 소속 전문점 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kolId = searchParams.get('kolId');
  const yearMonth = searchParams.get('yearMonth');

  console.log(`[API] Manual Metrics GET - kolId: ${kolId}, yearMonth: ${yearMonth}`);

  if (!kolId || !yearMonth) {
    console.error('[API] Missing required parameters');
    return NextResponse.json({ error: 'kolId와 yearMonth는 필수입니다.' }, { status: 400 });
  }

  try {
    console.log('[API] Starting database queries...');
    
    // KOL 대시보드 메트릭 조회
    console.log('[API] Querying kol_dashboard_metrics...');
    const { data: kolMetrics, error: kolMetricsError } = await supabaseAdmin
      .from('kol_dashboard_metrics')
      .select('monthly_sales, monthly_commission')
      .eq('kol_id', Number(kolId))
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (kolMetricsError) {
      console.error('[API] KOL metrics error:', kolMetricsError);
      throw kolMetricsError;
    }
    console.log('[API] KOL metrics retrieved:', kolMetrics);

    // KOL에 속한 전문점 목록 조회
    console.log('[API] Querying shops...');
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shops')
      .select('id, shop_name')
      .eq('kol_id', Number(kolId));

    if (shopsError) {
      console.error('[API] Shops error:', shopsError);
      throw shopsError;
    }
    console.log('[API] Shops retrieved:', shops?.length || 0, 'shops');

    // 각 전문점의 해당 년월 매출 조회
    const shopIds = shops?.map(shop => shop.id) || [];
    let shopSalesData: any[] = [];

    if (shopIds.length > 0) {
      console.log('[API] Querying shop_sales_metrics for shop IDs:', shopIds);
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from('shop_sales_metrics')
        .select('shop_id, total_sales')
        .in('shop_id', shopIds)
        .eq('year_month', yearMonth);

      if (salesError) {
        console.error('[API] Shop sales error:', salesError);
        throw salesError;
      }
      shopSalesData = salesData || [];
      console.log('[API] Shop sales data retrieved:', shopSalesData?.length || 0, 'records');
    }

    // 전문점과 매출 데이터를 매핑
    const shopMetrics = shops?.map((shop: { id: number; shop_name: string }) => {
      const salesMetric = shopSalesData.find(sale => sale.shop_id === shop.id);
      return {
        shop_id: shop.id,
        shop_name: shop.shop_name,
        total_sales: salesMetric?.total_sales || 0, // 데이터가 없으면 0으로 처리
      };
    }) || [];

    console.log('[API] Final response data prepared');
    return NextResponse.json({ kolMetrics, shopMetrics });

  } catch (error: any) {
    console.error('[API] Error fetching metrics:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: error.message || '데이터 조회 중 오류 발생',
      details: error.details || null,
      hint: error.hint || null
    }, { status: 500 });
  }
}

// POST 요청 처리: KOL 및 전문점 실적 데이터 업서트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kolMetrics, shopMetrics } = body;

    if (!kolMetrics || !shopMetrics) {
      return NextResponse.json({ error: 'KOL 실적과 전문점 실적 데이터는 필수입니다.' }, { status: 400 });
    }

    // KOL 대시보드 메트릭 업서트
    const { data: upsertedKolMetrics, error: kolError } = await supabaseAdmin
      .from('kol_dashboard_metrics')
      .upsert(kolMetrics, { onConflict: 'kol_id, year_month' })
      .select();

    if (kolError) {
      console.error('[API] KOL metrics upsert error:', kolError);
      return NextResponse.json({ error: `KOL 실적 저장 중 오류: ${kolError.message}` }, { status: 500 });
    }

    // 전문점 매출 메트릭 업서트 (개별적으로 처리)
    const upsertedShopMetrics = [];
    for (const metric of shopMetrics) {
      const { data: upsertedShopMetric, error: shopError } = await supabaseAdmin
        .from('shop_sales_metrics')
        .upsert(metric, { onConflict: 'shop_id, year_month' })
        .select();
      
      if (shopError) {
        console.error('[API] Shop metric upsert error:', shopError);
        return NextResponse.json({ error: `전문점(ID: ${metric.shop_id}) 실적 저장 중 오류: ${shopError.message}` }, { status: 500 });
      }
      upsertedShopMetrics.push(upsertedShopMetric ? upsertedShopMetric[0] : null);
    }

    return NextResponse.json({ 
      message: '데이터가 성공적으로 저장되었습니다.',
      kolData: upsertedKolMetrics ? upsertedKolMetrics[0] : null,
      shopData: upsertedShopMetrics.filter(Boolean)
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API] Error in POST /api/admin-dashboard/manual-metrics:', error);
    return NextResponse.json({ error: error.message || '데이터 처리 중 서버 오류 발생' }, { status: 500 });
  }
}
