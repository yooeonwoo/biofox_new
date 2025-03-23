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
import { db } from '@/db';
import { and, eq, desc, sql } from 'drizzle-orm';
import { 
  shops, 
  monthlySales, 
  productSalesRatios, 
  products 
} from '@/db/schema';
import { getCurrentYearMonth } from '@/lib/sales-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const shopId = params.shopId;
    const searchParams = request.nextUrl.searchParams;
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    // 전문점 기본 정보 조회
    const shopInfo = await db
      .select({
        id: shops.id,
        name: shops.ownerName, // 점주명을 이름으로 사용
        ownerName: shops.ownerName,
        region: shops.region,
        kolId: shops.kolId
      })
      .from(shops)
      .where(eq(shops.id, parseInt(shopId)))
      .limit(1);
    
    if (shopInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '전문점을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const shop = shopInfo[0];
    
    // 해당 월의 매출 정보 조회
    const salesInfo = await db
      .select()
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.shopId, parseInt(shopId)),
          eq(monthlySales.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    // 제품별 매출 비율 조회
    const productRatios = await db
      .select({
        productId: productSalesRatios.productId,
        productName: products.name,
        salesAmount: productSalesRatios.salesAmount,
        salesRatio: productSalesRatios.salesRatio
      })
      .from(productSalesRatios)
      .leftJoin(products, eq(productSalesRatios.productId, products.id))
      .where(
        and(
          eq(productSalesRatios.shopId, parseInt(shopId)),
          eq(productSalesRatios.yearMonth, yearMonth)
        )
      )
      .orderBy(desc(productSalesRatios.salesAmount));
    
    // 월별 매출 추이 조회 (최근 6개월)
    const monthlySalesHistory = await db
      .select({
        yearMonth: monthlySales.yearMonth,
        productSales: monthlySales.productSales,
        commission: monthlySales.commission
      })
      .from(monthlySales)
      .where(eq(monthlySales.shopId, parseInt(shopId)))
      .orderBy(desc(monthlySales.yearMonth))
      .limit(6);
    
    // 응답 데이터 구성
    const responseData = {
      shopInfo: {
        id: shop.id,
        name: shop.name,
        ownerName: shop.ownerName,
        region: shop.region
      },
      salesInfo: salesInfo.length > 0 ? {
        yearMonth,
        productSales: salesInfo[0].productSales,
        deviceSales: salesInfo[0].deviceSales,
        totalSales: salesInfo[0].totalSales,
        commission: salesInfo[0].commission
      } : {
        yearMonth,
        productSales: 0,
        deviceSales: 0,
        totalSales: 0,
        commission: 0
      },
      productRatios: productRatios.map(ratio => ({
        productId: ratio.productId,
        productName: ratio.productName,
        salesAmount: ratio.salesAmount,
        salesRatio: ratio.salesRatio
      })),
      monthlySales: monthlySalesHistory
    };
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('전문점 상세 정보 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문점 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 