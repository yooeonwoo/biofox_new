import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

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

// 상점별 제품 판매 비율 API
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const shopId = params.shopId;
  
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

    // 파라미터 가져오기
    const yearMonth = request.nextUrl.searchParams.get('yearMonth') || getCurrentDate().substring(0, 7);

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
        products(name),
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

    // 데이터가 없는 경우 빈 배열 반환
    if (!metricsData || metricsData.length === 0) {
      // 이전 호환성을 위한 기존 데이터 조회 (주석 처리함)
      /*
      // shop_product_sales 테이블에서 특정 상점의 제품별 판매 데이터 조회
      const { data: shopProductSales, error: shopProductError } = await supabase
        .from('shop_product_sales')
        ...
      */
      
      return NextResponse.json([], { status: 200 });
    }

    // 제품별 판매 비율 계산
    const formattedData = metricsData.map((item: ProductSalesMetricsItem) => {
      // products가 배열인 경우와 객체인 경우 모두 처리
      let productName = '알 수 없는 제품';
      if (item.products) {
        if (Array.isArray(item.products)) {
          if (item.products.length > 0 && item.products[0]?.name) {
            productName = item.products[0].name;
          }
        } else if (item.products?.name) {
          productName = item.products.name;
        }
      }

      return {
        productId: item.product_id,
        productName,
        totalSalesAmount: item.sales_amount || 0,
        salesRatio: item.sales_ratio.toString()
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