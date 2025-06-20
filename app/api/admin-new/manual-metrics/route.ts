import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient as supabase } from '@/lib/supabase-client'; // supabaseClient를 supabase로 alias하여 사용

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kolId = searchParams.get('kolId');
  const yearMonth = searchParams.get('yearMonth');

  if (!kolId || !yearMonth) {
    return NextResponse.json({ error: 'kolId와 yearMonth는 필수입니다.' }, { status: 400 });
  }

  try {
    // KOL 대시보드 메트릭 조회
    const { data: kolMetrics, error: kolError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolId)
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (kolError) throw new Error(`KOL 실적 조회 실패: ${kolError.message}`);

    // 해당 KOL의 전문점 목록과 각 전문점의 매출 메트릭 조회
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select(`
        id,
        shop_name,
        shop_sales_metrics (
          total_sales
        )
      `)
      .eq('kol_id', kolId)
      .eq('is_self_shop', false)
      .eq('shop_sales_metrics.year_month', yearMonth);

    if (shopsError) throw new Error(`전문점 및 매출 조회 실패: ${shopsError.message}`);

    const shopMetrics = shops.map((shop: { id: number; shop_name: string; shop_sales_metrics: { total_sales: number }[] }) => ({
      shop_id: shop.id,
      shop_name: shop.shop_name,
      total_sales: shop.shop_sales_metrics[0]?.total_sales || 0,
    }));

    return NextResponse.json({ kolMetrics, shopMetrics });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kolMetrics, shopMetrics } = body;

    // TODO: 데이터 유효성 검사

    // KOL 실적 데이터 upsert
    if (kolMetrics) {
      const { data, error } = await supabase
        .from('kol_dashboard_metrics')
        .upsert(kolMetrics, { onConflict: 'kol_id, year_month' })
        .select();

      if (error) throw new Error(`KOL 실적 저장 실패: ${error.message}`);
    }

    // 전문점별 매출 데이터 upsert
    if (shopMetrics && shopMetrics.length > 0) {
      const { data, error } = await supabase
        .from('shop_sales_metrics')
        .upsert(shopMetrics, { onConflict: 'shop_id, year_month' })
        .select();

      if (error) throw new Error(`전문점 매출 저장 실패: ${error.message}`);
    }

    return NextResponse.json({ message: '데이터가 성공적으로 저장되었습니다.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
