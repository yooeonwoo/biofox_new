/**
 * 제품별 매출 비율 API
 * 
 * 전문점/KOL별 월간 제품 매출 비율 데이터 조회
 * 
 * GET /api/sales/product-ratios
 * 쿼리 파라미터:
 * - kolId: KOL ID
 * - shopId: 전문점 ID
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/db';
import { and, eq, desc } from 'drizzle-orm';
import { productSalesRatios, products } from '@/db/schema';
import { getCurrentYearMonth } from '@/lib/sales-utils';

// 제품 비율 결과 타입 정의
interface ProductRatio {
  productId: number;
  productName: string | null;
  salesAmount: number;
  salesRatio: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const shopId = searchParams.get('shopId');
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    // kolId 또는 shopId 중 하나는 필수
    if (!kolId && !shopId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID 또는 전문점 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 데이터베이스 연결 가져오기
    const db = await getDB();
    
    // 쿼리 조건 구성
    let conditions = [];
    
    if (kolId) {
      conditions.push(eq(productSalesRatios.kolId, parseInt(kolId)));
    }
    
    if (shopId) {
      conditions.push(eq(productSalesRatios.shopId, parseInt(shopId)));
    }
    
    conditions.push(eq(productSalesRatios.yearMonth, yearMonth));
    
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
      .where(and(...conditions))
      .orderBy(desc(productSalesRatios.salesAmount));
    
    if (productRatios.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    return NextResponse.json({
      success: true,
      data: productRatios
    });
  } catch (error) {
    console.error('제품별 매출 비율 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '제품별 매출 비율을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 