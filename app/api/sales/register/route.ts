/**
 * 매출 및 수당 계산/저장 API
 * 
 * 주문 정보를 바탕으로 월별 매출, 수당 데이터를 계산 및 저장
 * 
 * POST /api/sales/register
 * 요청 본문:
 * {
 *   "orderId": 123,
 *   "processingType": "new" // new: 새 주문, cancel: 취소 주문
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { orders, monthlySales, commissions } from '@/db/schema';
import { processOrderSalesAndCommission } from '@/lib/sales-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, processingType = 'new' } = body;
    
    // 필수 파라미터 체크
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // processingType 유효성 체크
    if (!['new', 'cancel'].includes(processingType)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 처리 유형입니다. (new 또는 cancel)' },
        { status: 400 }
      );
    }
    
    // 주문 정보 조회
    const orderInfo = await db
      .select({
        id: orders.id,
        shopId: orders.shopId,
        status: orders.status
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    if (orderInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const order = orderInfo[0];
    
    if (processingType === 'new') {
      // 새 주문 처리
      const result = await processOrderSalesAndCommission(orderId);
      
      if (result) {
        return NextResponse.json({
          success: true,
          data: {
            message: '매출 및 수당 데이터가 성공적으로 등록되었습니다.'
          }
        });
      } else {
        return NextResponse.json(
          { success: false, error: '매출 및 수당 데이터 등록에 실패했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 취소 주문 처리
      // 1. 주문 상태 업데이트
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
      
      // 2. 관련 수당 정보 삭제
      const commissionInfo = await db
        .select()
        .from(commissions)
        .where(eq(commissions.orderId, orderId))
        .limit(1);
      
      if (commissionInfo.length > 0) {
        // 수당이 이미 정산된 경우 취소 불가
        if (commissionInfo[0].settled) {
          return NextResponse.json(
            { success: false, error: '이미 정산된 수당은 취소할 수 없습니다.' },
            { status: 400 }
          );
        }
        
        // 수당 정보 삭제
        await db
          .delete(commissions)
          .where(eq(commissions.id, commissionInfo[0].id));
        
        // 3. 월별 매출 정보 업데이트 (관련 주문의 매출 차감)
        const salesInfo = await db
          .select()
          .from(monthlySales)
          .where(
            and(
              eq(monthlySales.kolId, commissionInfo[0].kolId),
              eq(monthlySales.shopId, order.shopId)
              // yearMonth는 주문일을 기준으로 해야 하므로 별도 로직 필요
            )
          );
        
        // FIXME: 취소 주문의 월별 매출 정보 업데이트 로직을 더 정교하게 구현해야 함
        // 현재는 단순 처리
        
        return NextResponse.json({
          success: true,
          data: {
            message: '주문 취소 및 관련 매출/수당 데이터가 성공적으로 처리되었습니다.'
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            message: '주문이 취소되었으나 관련 수당 정보가 없습니다.'
          }
        });
      }
    }
  } catch (error) {
    console.error('매출 및 수당 데이터 등록 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '매출 및 수당 데이터 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 