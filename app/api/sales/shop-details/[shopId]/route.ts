/**
 * 전문점 상세 정보 API
 * 
 * 특정 전문점의 월별 제품 비율 및 매출/수당 상세 데이터 조회
 * 
 * GET /api/sales/shop-details/[shopId]
 * 쿼리 파라미터:
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentYearMonth } from '@/lib/sales-utils';
import { supabase } from "@/lib/supabase";

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

// 전문점 상세 정보 응답 타입
interface ShopDetailsResponse {
  shopInfo: {
    id: number;
    name: string;
    ownerName: string;
    region: string;
  };
  salesInfo: {
    yearMonth: string;
    productSales: number;
    deviceSales: number;
    totalSales: number;
    commission: number;
  };
  productRatios: {
    productId: number;
    productName: string;
    salesAmount: number;
    salesRatio: string;
  }[];
  monthlySales: {
    yearMonth: string;
    productSales: number;
    commission: number;
  }[];
}

// 동적 라우트 처리 설정
export const dynamic = 'force-dynamic';

// GET 요청 처리
export async function GET(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const shopId = params.shopId;
    const searchParams = req.nextUrl.searchParams;
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    console.log(`전문점 상세 정보 조회: 전문점 ID ${shopId}, 연월 ${yearMonth}`);
    
    // Supabase RPC 함수를 호출하여 전문점 상세 정보 조회
    const { data: shopDetails, error: shopDetailsError } = await supabase.rpc(
      'get_shop_details',
      {
        p_shop_id: parseInt(shopId),
        p_year_month: yearMonth
      }
    ) as { data: any, error: any };
    
    if (shopDetailsError) {
      console.error('전문점 상세 정보 RPC 호출 오류:', shopDetailsError);
      
      // RPC 함수가 없을 경우 기존 쿼리 사용
      // 전문점 기본 정보 조회
      const { data: shopInfo, error: shopError } = await supabase
        .from('shops')
        .select('id, owner_name, region, kol_id')
        .eq('id', parseInt(shopId))
        .limit(1);
      
      if (shopError) {
        console.error('전문점 정보 조회 오류:', shopError);
        return NextResponse.json(
          { success: false, error: '전문점 정보를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      if (!shopInfo || shopInfo.length === 0) {
        return NextResponse.json(
          { success: false, error: '전문점을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      const shop = shopInfo[0];
      
      // 해당 월의 매출 정보 조회
      const { data: salesInfo, error: salesError } = await supabase
        .from('monthly_sales')
        .select('*')
        .eq('shop_id', parseInt(shopId))
        .eq('year_month', yearMonth)
        .limit(1);
      
      if (salesError) {
        console.error('매출 정보 조회 오류:', salesError);
        return NextResponse.json(
          { success: false, error: '매출 정보를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 제품별 매출 비율 조회
      const { data: productRatios, error: ratiosError } = await supabase
        .from('product_sales_ratios')
        .select('*, products(id, name)')
        .eq('shop_id', parseInt(shopId))
        .eq('year_month', yearMonth)
        .order('sales_amount', { ascending: false });
      
      if (ratiosError) {
        console.error('제품 비율 조회 오류:', ratiosError);
        return NextResponse.json(
          { success: false, error: '제품별 매출 비율을 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 월별 매출 추이 조회 (최근 6개월)
      const { data: monthlySalesHistory, error: historyError } = await supabase
        .from('monthly_sales')
        .select('year_month, product_sales, commission')
        .eq('shop_id', parseInt(shopId))
        .order('year_month', { ascending: false })
        .limit(6);
      
      if (historyError) {
        console.error('월별 매출 추이 조회 오류:', historyError);
        return NextResponse.json(
          { success: false, error: '월별 매출 추이를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 응답 데이터 구성
      const responseData = {
        shopInfo: {
          id: shop.id,
          name: shop.owner_name, // 점주명을 이름으로 사용
          ownerName: shop.owner_name,
          region: shop.region
        },
        salesInfo: salesInfo && salesInfo.length > 0 ? {
          yearMonth,
          productSales: salesInfo[0].product_sales,
          deviceSales: salesInfo[0].device_sales,
          totalSales: salesInfo[0].total_sales,
          commission: salesInfo[0].commission
        } : {
          yearMonth,
          productSales: 0,
          deviceSales: 0,
          totalSales: 0,
          commission: 0
        },
        productRatios: (productRatios || []).map(ratio => ({
          productId: ratio.product_id,
          productName: ratio.products ? ratio.products.name : '',
          salesAmount: ratio.sales_amount,
          salesRatio: ratio.sales_ratio
        })),
        monthlySales: (monthlySalesHistory || []).map(item => ({
          yearMonth: item.year_month,
          productSales: item.product_sales,
          commission: item.commission
        }))
      };
      
      console.log(`전문점 상세 정보 조회 완료(기존 쿼리): ${shopId}`);
      
      return NextResponse.json({
        success: true,
        data: responseData
      });
    }
    
    // RPC 함수 호출 결과 반환
    console.log(`전문점 상세 정보 조회 완료(RPC): ${shopId}`);
    
    return NextResponse.json({
      success: true,
      data: shopDetails
    });
  } catch (error) {
    console.error('전문점 상세 정보 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문점 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 