import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

// kol_product_summary 테이블 응답 타입
interface ProductSummaryItem {
  product_id: number;
  total_sales_amount: number;
  sales_ratio: number;
  total_quantity: number;
  total_shops_count: number;
  products: {
    name: string;
  } | {
    name: string;
  }[];
}

// shop_product_sales 테이블 응답 타입
interface ShopSalesItem {
  shop_id: number;
  kol_id: number;
  product_id: number;
  sales_amount: number;
  shop_ratio: number;
  products?: {
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

    // 1. 새로운 테이블 구조 (kol_product_summary)에서 데이터 조회
    const { data: summaryData, error: summaryError } = await supabase
      .from('kol_product_summary')
      .select(`
        product_id,
        total_sales_amount,
        sales_ratio,
        total_quantity,
        total_shops_count,
        products(name)
      `)
      .eq('kol_id', kolData.id)
      .eq('year_month', yearMonth)
      .order('sales_ratio', { ascending: false });

    // 새 테이블에서 오류 발생 시 로그 기록
    if (summaryError) {
      console.error('kol_product_summary 조회 오류:', summaryError);
      
      // 새 테이블이 없거나 데이터가 없는 경우 - 대체 로직으로 이동
    }

    // 새 테이블에서 데이터를 성공적으로 가져온 경우
    if (summaryData && summaryData.length > 0) {
      const formattedData = summaryData.map((item: ProductSummaryItem) => {
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
          totalSalesAmount: item.total_sales_amount,
          salesRatio: item.sales_ratio.toString(),
          usageQuantity: item.total_quantity,
          usedShopsCount: item.total_shops_count
        };
      });

      return NextResponse.json(formattedData, { status: 200 });
    }

    // 2. shop_product_sales 테이블 체크 (새 테이블에서 데이터가 없는 경우)
    const { data: shopSalesData, error: shopSalesError } = await supabase
      .from('shop_product_sales')
      .select(`
        shop_id,
        kol_id,
        product_id,
        sales_amount,
        shop_ratio,
        products(name)
      `)
      .eq('kol_id', kolData.id)
      .eq('year_month', yearMonth);

    if (shopSalesError) {
      console.error('shop_product_sales 조회 오류:', shopSalesError);
    }

    // shop_product_sales 테이블에서 데이터를 가져온 경우 - KOL별 요약 계산
    if (shopSalesData && shopSalesData.length > 0) {
      // 제품별 총 매출 및 사용 전문점 수 계산
      const productSummary = new Map();
      let totalSales = 0;

      shopSalesData.forEach((item: ShopSalesItem) => {
        const productId = item.product_id;
        if (!productSummary.has(productId)) {
          // 제품 이름 추출
          let productName = '알 수 없는 제품';
          if (item.products) {
            if (Array.isArray(item.products)) {
              if (item.products.length > 0 && 'name' in item.products[0]) {
                productName = item.products[0].name;
              }
            } else if ('name' in item.products) {
              productName = item.products.name;
            }
          }

          productSummary.set(productId, {
            productId,
            productName,
            totalSalesAmount: 0,
            usedShopsCount: 0,
            shops: new Set()
          });
        }

        const summary = productSummary.get(productId);
        summary.totalSalesAmount += item.sales_amount;
        summary.shops.add(item.shop_id);
        totalSales += item.sales_amount;
      });

      // 요약 데이터 형식화
      const formattedData = Array.from(productSummary.values()).map(item => {
        return {
          productId: item.productId,
          productName: item.productName,
          totalSalesAmount: item.totalSalesAmount,
          salesRatio: (totalSales > 0 ? (item.totalSalesAmount / totalSales) : 0).toFixed(2),
          usedShopsCount: item.shops.size
        };
      });

      // 매출 비율 기준 내림차순 정렬
      formattedData.sort((a, b) => parseFloat(b.salesRatio) - parseFloat(a.salesRatio));

      return NextResponse.json(formattedData, { status: 200 });
    }

    // 3. 기존 product_sales_ratios 테이블 체크 (이전 방식의 호환성 유지)
    const { data: ratioData, error: ratioError } = await supabase
      .from('product_sales_ratios')
      .select(`
        product_id,
        sales_amount,
        sales_ratio,
        products(name)
      `)
      .eq('kol_id', kolData.id)
      .eq('year_month', yearMonth);

    if (ratioError) {
      console.error('product_sales_ratios 조회 오류:', ratioError);
    }

    if (ratioData && ratioData.length > 0) {
      const formattedData = ratioData.map((item: any) => {
        // products가 배열인 경우 첫 번째 요소의 name을 가져오고, 
        // 객체인 경우 직접 name 속성을 사용
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
          totalSalesAmount: item.sales_amount,
          salesRatio: item.sales_ratio.toString()
        };
      });

      return NextResponse.json(formattedData, { status: 200 });
    }

    // 4. 데이터가 없는 경우 빈 배열 반환 (파이 차트에서 "데이터가 없습니다" 메시지 표시)
    return NextResponse.json([], { status: 200 });
    
  } catch (error) {
    console.error('제품 비율 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '제품 비율 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 