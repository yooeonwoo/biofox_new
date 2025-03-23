/**
 * 수당 내역 조회 API
 * 
 * KOL의 수당 내역 데이터 조회
 * 
 * GET /api/sales/commission-history
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 * - status: 정산 상태 필터 (all, completed, pending)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/db';
import { and, eq, desc, like, sql } from 'drizzle-orm';
import { commissions, orders, shops } from '@/db/schema';
import { getCurrentYearMonth } from '@/lib/sales-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    const status = searchParams.get('status') || 'all';
    
    // kolId 필수 체크
    if (!kolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // DB 연결 가져오기
    const db = await getDB();

    // 1) 기본 where 조건 (KOL ID, yearMonth)
    const baseWhere = and(
      eq(commissions.kolId, parseInt(kolId, 10)),
      like(commissions.createdAt, `${yearMonth}-%`)
    );

    // 2) status가 all이 아닐 경우, 정산 상태 추가
    const finalWhere =
      status !== 'all'
        ? and(baseWhere, eq(commissions.settled, status === 'completed'))
        : baseWhere;

    // 3) 최종 쿼리 체이닝
    const commissionHistory = await db
      .select({
        id: commissions.id,
        date: commissions.createdAt,
        shopId: orders.shopId,
        shopName: shops.ownerName,
        amount: commissions.amount,
        status: sql`CASE WHEN ${commissions.settled} = true THEN 'completed' ELSE 'pending' END`,
        note: commissions.settledNote
      })
      .from(commissions)
      .leftJoin(orders, eq(commissions.orderId, orders.id))
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .where(finalWhere)
      .orderBy(desc(commissions.createdAt));

    return NextResponse.json({
      success: true,
      data: commissionHistory,
    });
  } catch (error) {
    console.error('수당 내역 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '수당 내역을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
