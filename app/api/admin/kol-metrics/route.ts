import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 (서비스 역할 키 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action, yearMonth } = await request.json();

    if (!action || !yearMonth) {
      return NextResponse.json(
        { error: 'action과 yearMonth가 필요합니다.' },
        { status: 400 }
      );
    }

    if (action === 'update_metrics') {
      // KOL 메트릭스 업데이트
      const { data, error } = await supabase.rpc('update_kol_metrics_for_month', {
        year_month_param: yearMonth
      });

      if (error) {
        console.error('메트릭스 업데이트 오류:', error);
        return NextResponse.json(
          { error: '메트릭스 업데이트에 실패했습니다.', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: data,
        updatedMonth: yearMonth
      });
    }

    if (action === 'verify_metrics') {
      // 데이터 정확성 검증
      const { data, error } = await supabase.rpc('verify_kol_metrics_accuracy', {
        year_month_param: yearMonth
      });

      if (error) {
        console.error('메트릭스 검증 오류:', error);
        return NextResponse.json(
          { error: '메트릭스 검증에 실패했습니다.', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        verification: data,
        checkedMonth: yearMonth
      });
    }

    return NextResponse.json(
      { error: '유효하지 않은 action입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('KOL 메트릭스 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearMonth = searchParams.get('yearMonth');

    if (!yearMonth) {
      return NextResponse.json(
        { error: 'yearMonth 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 메트릭스 데이터 조회
    const { data, error } = await supabase
      .from('kol_dashboard_metrics')
      .select(`
        kol_id,
        year_month,
        total_shops_count,
        active_shops_count,
        monthly_sales,
        monthly_commission,
        updated_at,
        kols(name, shop_name)
      `)
      .eq('year_month', yearMonth)
      .order('kol_id');

    if (error) {
      console.error('메트릭스 조회 오류:', error);
      return NextResponse.json(
        { error: '메트릭스 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metrics: data,
      month: yearMonth
    });

  } catch (error) {
    console.error('KOL 메트릭스 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}