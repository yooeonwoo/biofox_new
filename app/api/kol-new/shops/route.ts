import { NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-client';
import { getCurrentYearMonth } from '@/lib/date-utils';

export async function GET() {
  try {
    console.log('=== Shops API 시작 ===');
    
    // 1. 인증 체크
    const { user } = await checkAuthSupabase(['kol', 'admin']);
    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    
    console.log('현재 사용자:', {
      id: user.id,
      name: user.name,
      role: user.role
    });
    
    // 2. Supabase 연결
    const cookieStore = await cookies();
    const supabase = supabaseServer(cookieStore);
    
    // 3. 실제 KOL 정보 조회
    const { data: kolInfo, error: kolError } = await supabase
      .from('kols')
      .select('id, name, shop_name, user_id')
      .eq('user_id', user.id)
      .single();
    
    if (kolError || !kolInfo) {
      console.error('KOL 정보 조회 실패:', kolError);
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    console.log('조회된 KOL 정보:', {
      id: kolInfo.id,
      name: kolInfo.name,
      shop_name: kolInfo.shop_name
    });

    // 현재 월 계산 - YYYY-MM 형식으로 통일
    const currentMonth = getCurrentYearMonth(); // "2025-05"
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"

    console.log(`📅 현재 월 정보:`, {
      currentMonth,
      currentMonthCompact,
      kolId: kolInfo.id,
      kolName: kolInfo.name
    });
    
    // 4. 해당 KOL의 전문점 목록 조회
    console.log(`🏪 전문점 조회 시작: KOL ID=${kolInfo.id} (${kolInfo.name})`);
    
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select(`
        id,
        owner_name,
        shop_name,
        region,
        status,
        created_at,
        is_owner_kol,
        shop_sales_metrics (
          total_sales,
          product_sales,
          device_sales,
          commission,
          year_month
        )
      `)
      .eq('kol_id', kolInfo.id)
      .order('created_at', { ascending: false });

    console.log(`🏪 전문점 조회 응답:`, {
      shopCount: shops?.length || 0,
      hasError: !!shopsError,
      errorMessage: shopsError?.message
    });

    if (shopsError) {
      console.error(`❌ 전문점 조회 오류(kol_id=${kolInfo.id}):`, shopsError);
      return NextResponse.json(
        { error: `전문점 정보를 조회하는 중 오류가 발생했습니다: ${shopsError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 전문점 조회 성공: KOL ID=${kolInfo.id}, 전문점 수=${shops?.length || 0}`);

    if (!shops || shops.length === 0) {
      console.log(`⚠️ 전문점 데이터 없음(kol_id=${kolInfo.id})`);
      return NextResponse.json({ shops: [], meta: { totalShopsCount: 0, activeShopsCount: 0 } });
    }

    // 전문점 데이터를 응답 형식으로 가공
    const formattedShops = shops.map((shop: any) => {
      // 현재 월 매출 데이터 찾기 - 우선순위 로직 적용
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
      
      const hasOrdered = (currentMonthSales?.total_sales || 0) > 0;
      
      console.log(`📊 ${shop.shop_name || shop.owner_name} 매출 정보:`, {
        shopId: shop.id,
        currentMonthSales: currentMonthSales?.total_sales || 0,
        hasOrdered,
        metricsCount: shop.shop_sales_metrics?.length || 0
      });
      
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
          hasOrdered,
          commission: currentMonthSales?.commission || 0
        }
      };
    });

    // 주문한 전문점과 주문하지 않은 전문점 개수 계산
    const activeShopsCount = formattedShops.filter(shop => shop.sales.hasOrdered).length;
    const totalShopsCount = formattedShops.length;

    console.log(`📈 전문점 통계:`, {
      totalShopsCount,
      activeShopsCount,
      inactiveShopsCount: totalShopsCount - activeShopsCount
    });

    const responseData = {
      shops: formattedShops,
      meta: {
        totalShopsCount,
        activeShopsCount
      }
    };

    console.log('=== Shops API 응답 완료 ===');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ 전문점 데이터 조회 중 예외 발생:', error);
    const errorMessage = error instanceof Error 
      ? `전문점 데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '전문점 데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}