import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

// 새로운 제품 판매 메트릭스 응답 타입
interface ProductSalesMetricsItem {
  product_id: number;
  quantity: number;
  sales_amount: number;
  sales_ratio: number;
  products: {
    name: string;
  } | {
    name: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 파라미터 가져오기
    const yearMonth = request.nextUrl.searchParams.get('yearMonth') || getCurrentDate().substring(0, 7);

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
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
      .select('id, name')
      .eq('user_id', userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // product_sales_metrics 테이블에서 KOL 전체 데이터 조회 (shop_id가 NULL인 레코드)
    const { data: metricsData, error: metricsError } = await supabase
      .from('product_sales_metrics')
      .select(`
        product_id,
        products(name),
        quantity,
        sales_amount,
        sales_ratio
      `)
      .eq('kol_id', kolData.id)
      .eq('year_month', yearMonth)
      .is('shop_id', null) // shop_id가 NULL인 레코드만 선택 (KOL 전체 데이터)
      .order('sales_ratio', { ascending: false });

    if (metricsError) {
      console.error('product_sales_metrics 조회 오류:', metricsError);
      return NextResponse.json(
        { error: '제품 판매 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 데이터가 있는 경우 포맷팅
    if (metricsData && metricsData.length > 0) {
      const formattedData = metricsData.map((item: ProductSalesMetricsItem) => {
        // products가 배열인 경우 첫 번째 요소의 name을 가져오고, 
        // 객체인 경우 직접 name 속성을 사용
        let productName = '알 수 없는 제품';
        if (item.products) {
          if (Array.isArray(item.products)) {
            if (item.products.length > 0 && item.products[0].name) {
              productName = item.products[0].name;
            }
          } else if (item.products.name) {
            productName = item.products.name;
          }
        }
        
        return {
          productId: item.product_id,
          productName,
          totalSalesAmount: item.sales_amount,
          salesRatio: item.sales_ratio.toString(),
          usageQuantity: item.quantity
        };
      });

      return NextResponse.json(formattedData, { status: 200 });
    }

    // 이전 로직을 호환성 유지를 위해 남겨둠 (기존 코드도 실행되도록 함)
    // 기존 코드 제거를 위해 주석 처리 후 나중에 완전히 제거 계획
    /*
    // 2. shop_product_sales 테이블 체크
    // 3. 기존 product_sales_ratios 테이블 체크
    */

    // 데이터가 없는 경우 빈 배열 반환 (파이 차트에서 "데이터가 없습니다" 메시지 표시)
    return NextResponse.json([], { status: 200 });
    
  } catch (error) {
    console.error('제품 비율 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '제품 비율 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 