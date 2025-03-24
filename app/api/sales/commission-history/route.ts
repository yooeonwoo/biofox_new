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
import { getCurrentYearMonth } from '@/lib/sales-utils';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("수당 내역 조회 API 호출됨");
    
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
    
    // 권한 확인
    if (role !== '본사관리자') {
      if (role === 'kol') {
        // 사용자의 KOL ID 조회
        const { data: kolData } = await supabase
          .from('kols')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        const userKolId = kolData?.id;
        
        // 여기서 권한 확인 로직 추가...
      } else {
        return NextResponse.json(
          { success: false, error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }
    
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
    
    console.log(`수당 내역 조회 시작: KOL ID ${kolId}, 연월 ${yearMonth}, 상태 ${status}`);
    
    // Supabase RPC(Stored Procedure) 호출을 사용하여 데이터 조회
    const { data: commissionHistory, error: historyError } = await supabase.rpc(
      'get_commission_history',
      {
        p_kol_id: parseInt(kolId),
        p_year_month: yearMonth,
        p_status: status
      }
    );
    
    if (historyError) {
      console.error("수당 내역 조회 오류:", historyError);
      
      // RPC가 없는 경우 대체 쿼리 사용
      let commissionQuery = supabase
        .from('commissions')
        .select('id, created_at, amount, settled, settled_note, order_id')
        .eq('kol_id', parseInt(kolId))
        .like('created_at', `${yearMonth}-%`)
        .order('created_at', { ascending: false });
      
      // 정산 상태 필터 적용
      if (status !== 'all') {
        commissionQuery = commissionQuery.eq('settled', status === 'completed');
      }
      
      const { data: commissionData, error: commissionError } = await commissionQuery;
      
      if (commissionError) {
        console.error("수당 내역 조회 오류:", commissionError);
        return NextResponse.json(
          { success: false, error: '수당 내역을 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 조회된 주문 ID들 수집
      const orderIds = commissionData.map(item => item.order_id).filter(Boolean);
      
      // 주문 정보 조회
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, shop_id')
        .in('id', orderIds);
      
      if (orderError) {
        console.error("주문 정보 조회 오류:", orderError);
      }
      
      // 주문별 상점 ID 매핑
      const orderShopMap = new Map();
      orderData?.forEach(order => {
        orderShopMap.set(order.id, order.shop_id);
      });
      
      // 상점 ID 목록 수집
      const shopIds = [...new Set(orderData?.map(order => order.shop_id) || [])];
      
      // 상점 정보 조회
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, owner_name')
        .in('id', shopIds);
      
      if (shopError) {
        console.error("상점 정보 조회 오류:", shopError);
      }
      
      // 상점 ID별 이름 매핑
      const shopNameMap = new Map();
      shopData?.forEach(shop => {
        shopNameMap.set(shop.id, shop.owner_name);
      });
      
      // 결과 형식 변환
      const formattedResults = commissionData.map(item => {
        const shopId = orderShopMap.get(item.order_id);
        const shopName = shopNameMap.get(shopId);
        
        return {
          id: item.id,
          date: item.created_at,
          shopId,
          shopName,
          amount: item.amount,
          status: item.settled ? 'completed' : 'pending',
          note: item.settled_note
        };
      });
      
      console.log(`수당 내역 조회 완료(대체 쿼리): ${formattedResults.length}개 항목`);
      
      return NextResponse.json({
        success: true,
        data: formattedResults,
      });
    }
    
    console.log(`수당 내역 조회 완료(RPC): ${commissionHistory?.length || 0}개 항목`);
    
    return NextResponse.json({
      success: true,
      data: commissionHistory || [],
    });
  } catch (error) {
    console.error('수당 내역 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '수당 내역을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
