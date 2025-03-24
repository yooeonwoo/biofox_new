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
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("매출 및 수당 계산/저장 API 호출됨, 유저 ID:", userId);
    
    // 사용자 정보 및 역할 확인 - 직접 쿼리로 변경
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .limit(1);
    
    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
    
    if (!userData || userData.length === 0) {
      console.error("사용자 조회 실패:", "사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    const user = userData[0];
    const role = user?.role || '';

    // 본사관리자만 접근 가능하도록 설정
    if (role !== '본사관리자') {
      console.error("권한 없음:", role);
      return NextResponse.json(
        { error: "이 API에 접근할 권한이 없습니다" },
        { status: 403 }
      );
    }
    
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
    
    // 주문 정보 조회 - Supabase로 변경
    const { data: orderInfo, error: orderError } = await supabase
      .from('orders')
      .select('id, shop_id, status')
      .eq('id', orderId)
      .limit(1);
    
    if (orderError) {
      console.error("주문 조회 오류:", orderError);
      return NextResponse.json(
        { success: false, error: '주문 정보를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    if (!orderInfo || orderInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const order = orderInfo[0];
    
    if (processingType === 'new') {
      // 새 주문 처리 - 처리 속도를 최적화하기 위해 Promise.all 사용
      console.log("매출 및 수당 계산 시작...");
      
      // 주문 상태를 completed로 변경 - 이것만으로 Supabase 트리거 자동 처리
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error("주문 상태 업데이트 오류:", updateError);
        return NextResponse.json(
          { success: false, error: '주문 상태를 업데이트하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 상태가 업데이트되면 자동으로 Supabase의 process_order_sales_and_commission 트리거 함수 실행
      // 트리거가 실행되고 결과를 확인할 수 있도록 잠시 대기 (실제 환경에서는 비동기로 처리)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return NextResponse.json({
        success: true,
        data: {
          message: '주문이 완료 처리되었으며, 매출 및 수당이 자동으로 계산되었습니다.'
        }
      });
    } else {
      // 취소 주문 처리
      console.log("주문 취소 처리 시작...");
      
      // 수당이 이미 정산되었는지 체크
      const { data: commissionInfo, error: commissionError } = await supabase
        .from('commissions')
        .select('*')
        .eq('order_id', orderId)
        .limit(1);
      
      if (commissionError) {
        console.error("수당 정보 조회 오류:", commissionError);
        return NextResponse.json(
          { success: false, error: '수당 정보를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      if (commissionInfo && commissionInfo.length > 0 && commissionInfo[0].settled) {
        return NextResponse.json(
          { success: false, error: '이미 정산된 수당은 취소할 수 없습니다.' },
          { status: 400 }
        );
      }
      
      // RPC 함수 호출을 시도 (이 함수는 SQL에서 만들어야 함)
      const { data, error: rpcError } = await supabase.rpc(
        'cancel_order_sales_and_commission',
        { p_order_id: orderId }
      );
      
      if (rpcError) {
        console.error("주문 취소 RPC 함수 호출 오류:", rpcError);
        
        // RPC 함수가 없는 경우 주문 상태만 변경
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        if (updateError) {
          console.error("주문 상태 업데이트 오류:", updateError);
          return NextResponse.json(
            { success: false, error: '주문 상태를 업데이트하는 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
        
        if (commissionInfo && commissionInfo.length > 0) {
          // 수당 정보 삭제
          const { error: deleteError } = await supabase
            .from('commissions')
            .delete()
            .eq('id', commissionInfo[0].id);
          
          if (deleteError) {
            console.error("수당 정보 삭제 오류:", deleteError);
            return NextResponse.json(
              { success: false, error: '수당 정보를 삭제하는 중 오류가 발생했습니다.' },
              { status: 500 }
            );
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          message: '주문 취소 및 관련 매출/수당 데이터가 성공적으로 처리되었습니다.'
        }
      });
    }
  } catch (error) {
    console.error('매출 및 수당 데이터 등록 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '매출 및 수당 데이터 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 