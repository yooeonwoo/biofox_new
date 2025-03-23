/**
 * 전문점 순위 API
 * 
 * 전문점 순위 데이터 조회
 * 
 * GET /api/sales/shop-ranking
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - sortBy: 정렬 기준 (current: 당월매출, average: 월평균매출, cumulative: 누적매출, 기본값: current)
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 * - limit: 조회할 전문점 수 (기본값: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, desc, sql } from 'drizzle-orm';
import { monthlySales, shops } from '@/db/schema';
import { getCurrentYearMonth } from '@/lib/sales-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const sortBy = searchParams.get('sortBy') || 'current';
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // kolId 필수 체크
    if (!kolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 정렬 기준에 따른 쿼리 구성
    let query;
    
    if (sortBy === 'average') {
      // 월평균 매출 기준 정렬
      query = db
        .select({
          shopId: shops.id,
          shopName: shops.ownerName, // 전문점 이름 대신 점주명 사용 (기존 스키마에 전문점 이름 필드 없음)
          ownerName: shops.ownerName,
          currentSales: sql<number>`MAX(CASE WHEN ${monthlySales.yearMonth} = ${yearMonth} THEN ${monthlySales.totalSales} ELSE 0 END)`,
          averageSales: sql<number>`AVG(${monthlySales.totalSales})`,
          cumulativeSales: sql<number>`SUM(${monthlySales.totalSales})`
        })
        .from(shops)
        .leftJoin(
          monthlySales,
          and(
            eq(monthlySales.shopId, shops.id),
            eq(monthlySales.kolId, parseInt(kolId))
          )
        )
        .where(eq(shops.kolId, parseInt(kolId)))
        .groupBy(shops.id, shops.ownerName)
        .orderBy(desc(sql`AVG(${monthlySales.totalSales})`))
        .limit(limit);
    } else if (sortBy === 'cumulative') {
      // 누적 매출 기준 정렬
      query = db
        .select({
          shopId: shops.id,
          shopName: shops.ownerName, // 전문점 이름 대신 점주명 사용
          ownerName: shops.ownerName,
          currentSales: sql<number>`MAX(CASE WHEN ${monthlySales.yearMonth} = ${yearMonth} THEN ${monthlySales.totalSales} ELSE 0 END)`,
          averageSales: sql<number>`AVG(${monthlySales.totalSales})`,
          cumulativeSales: sql<number>`SUM(${monthlySales.totalSales})`
        })
        .from(shops)
        .leftJoin(
          monthlySales,
          and(
            eq(monthlySales.shopId, shops.id),
            eq(monthlySales.kolId, parseInt(kolId))
          )
        )
        .where(eq(shops.kolId, parseInt(kolId)))
        .groupBy(shops.id, shops.ownerName)
        .orderBy(desc(sql`SUM(${monthlySales.totalSales})`))
        .limit(limit);
    } else {
      // 당월 매출 기준 정렬 (기본값)
      query = db
        .select({
          shopId: shops.id,
          shopName: shops.ownerName, // 전문점 이름 대신 점주명 사용
          ownerName: shops.ownerName,
          currentSales: sql<number>`MAX(CASE WHEN ${monthlySales.yearMonth} = ${yearMonth} THEN ${monthlySales.totalSales} ELSE 0 END)`,
          averageSales: sql<number>`AVG(${monthlySales.totalSales})`,
          cumulativeSales: sql<number>`SUM(${monthlySales.totalSales})`
        })
        .from(shops)
        .leftJoin(
          monthlySales,
          and(
            eq(monthlySales.shopId, shops.id),
            eq(monthlySales.kolId, parseInt(kolId))
          )
        )
        .where(eq(shops.kolId, parseInt(kolId)))
        .groupBy(shops.id, shops.ownerName)
        .orderBy(desc(sql`MAX(CASE WHEN ${monthlySales.yearMonth} = ${yearMonth} THEN ${monthlySales.totalSales} ELSE 0 END)`))
        .limit(limit);
    }
    
    const rankings = await query;
    
    // 랭킹 정보 추가
    const rankedShops = rankings.map((shop, index) => ({
      rank: index + 1,
      shopId: shop.shopId,
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      currentSales: shop.currentSales || 0,
      averageSales: shop.averageSales || 0,
      cumulativeSales: shop.cumulativeSales || 0
    }));
    
    return NextResponse.json({
      success: true,
      data: rankedShops
    });
  } catch (error) {
    console.error('전문점 순위 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문점 순위를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 