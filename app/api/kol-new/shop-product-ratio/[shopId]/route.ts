import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

// 제품 판매 메트릭스 응답 타입
interface ProductSalesMetricsItem {
  product_id: number;
  quantity: number;
  sales_amount: number;
  sales_ratio: number;
  products: {
    name: string;
  };
}

// 상점별 제품 판매 비율 API
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  // params를 await로 처리
  const { shopId } = await Promise.resolve(params);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { error: '상점 ID가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파라미터 가져오기 (YYYY-MM 형식)
    const paramYearMonth = request.nextUrl.searchParams.get('yearMonth') || getCurrentDate().substring(0, 7);
    // 형식 변환: YYYY-MM → YYYYMM (테이블에 저장된 형식으로 변환)
    const yearMonth = paramYearMonth.replace('-', '');

    console.log(`상점 ${shopId}의 제품 비율 조회 월: ${paramYearMonth} (변환됨: ${yearMonth})`);

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
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // product_sales_metrics 테이블에서 특정 상점의 제품별 판매 데이터 조회
    const { data: metricsData, error: metricsError } = await supabase
      .from('product_sales_metrics')
      .select(`
        product_id,
        products (
          name
        ),
        quantity,
        sales_amount,
        sales_ratio
      `)
      .eq('shop_id', shopId)
      .eq('kol_id', kolData.id)
      .eq('year_month', yearMonth)
      .order('sales_ratio', { ascending: false });

    if (metricsError) {
      console.error('product_sales_metrics 조회 오류:', metricsError);
      return NextResponse.json(
        { error: '상점 제품별 판매 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log(`상점 ${shopId}의 제품별 매출 데이터 조회 결과: ${metricsData?.length || 0}개 항목`);

    // 디버깅: 상점 정보 확인
    const { data: shopInfo, error: shopInfoError } = await supabase
      .from('shops')
      .select('shop_name, owner_name')
      .eq('id', shopId)
      .single();
      
    if (!shopInfoError && shopInfo) {
      console.log(`상점 정보: ID=${shopId}, 이름=${shopInfo.shop_name}, 소유자=${shopInfo.owner_name}`);
    }

    // 데이터가 없는 경우 빈 배열 반환
    if (!metricsData || metricsData.length === 0) {
      // 디버깅을 위해 상점의 다른 월 데이터 확인
      const { data: otherMonthData, error: otherMonthError } = await supabase
        .from('product_sales_metrics')
        .select('year_month, product_id')
        .eq('shop_id', shopId)
        .limit(5);
        
      if (!otherMonthError && otherMonthData && otherMonthData.length > 0) {
        console.log(`상점 ${shopId}의 다른 월 데이터 존재:`, otherMonthData);
      } else {
        console.log(`상점 ${shopId}의 제품 매출 데이터 없음`);
      }
      
      return NextResponse.json([], { status: 200 });
    }

    // 제품별 판매 비율 계산
    const formattedData = metricsData.map((item: any) => {
      // 제품 이름 안전하게 추출
      let productName = '알 수 없는 제품';
      if (item.products && item.products.name) {
        productName = item.products.name;
      }

      // sales_ratio가 numeric 타입이므로 문자열로 변환
      const salesRatio = typeof item.sales_ratio === 'number' 
        ? item.sales_ratio.toString() 
        : (item.sales_ratio || '0');

      return {
        productId: item.product_id,
        productName,
        totalSalesAmount: item.sales_amount || 0,
        salesRatio
      };
    });

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error) {
    console.error('상점별 제품 판매 비율 조회 오류:', error);
    return NextResponse.json(
      { error: '상점별 제품 판매 비율을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 