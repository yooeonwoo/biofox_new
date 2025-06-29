import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentYearMonth } from '@/lib/date-utils';

export async function GET() {
  try {
    console.log('============ 전문점 API 요청 시작 ============');

    // 로컬 개발환경용 임시 KOL 정보
    const tempKol = {
      id: 1,
      name: '테스트 사용자',
      shopName: '테스트 샵',
      userId: 'temp-user-id'
    };

    // 현재 월 계산 - YYYY-MM 형식으로 통일
    const currentMonth = getCurrentYearMonth(); // "2025-05"
    const currentMonthCompact = currentMonth.replace('-', ''); // "202505"

    console.log(`📅 현재 월 정보:`, {
      currentMonth,
      currentMonthCompact,
      kolId: tempKol.id,
      kolName: tempKol.name
    });
    
    // KOL이 관리하는 전문점 정보 조회 (shops 테이블 직접 사용)
    console.log(`🏪 전문점 조회 시작: KOL ID=${tempKol.id} (${tempKol.name})`);
    
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
          year_month
        )
      `)
      .eq('kol_id', tempKol.id);

    console.log(`🏪 전문점 조회 응답:`, {
      shopCount: shops?.length || 0,
      hasError: !!shopsError,
      errorMessage: shopsError?.message
    });

    if (shopsError) {
      console.error(`❌ 전문점 조회 오류(kol_id=${tempKol.id}):`, shopsError);
      return NextResponse.json(
        { error: `전문점 정보를 조회하는 중 오류가 발생했습니다: ${shopsError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 전문점 조회 성공: KOL ID=${tempKol.id}, 전문점 수=${shops?.length || 0}`);

    if (!shops || shops.length === 0) {
      console.log(`⚠️ 전문점 데이터 없음(kol_id=${tempKol.id})`);
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
          hasOrdered
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

    console.log('============ 전문점 API 응답 완료 ============');
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