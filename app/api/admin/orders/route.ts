/**
 * 관리자용 주문(매출) API
 * 모든 주문 데이터의 조회 및 등록을 담당합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { serverSupabase, CACHE_SETTINGS, snakeToCamel } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// 응답 캐싱 설정
export const revalidate = CACHE_SETTINGS.REVALIDATE_TIME;

// 관리자 권한 확인 헬퍼 함수
async function checkAdminAuth() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    
    // 인증되지 않은 경우
    if (!userId) {
      console.error('인증되지 않은 사용자의 API 접근');
      return { 
        authorized: false, 
        error: "인증되지 않은 사용자입니다.", 
        status: 401 
      };
    }
    
    console.log("주문 API 호출됨, 유저 ID:", userId);
    
    // 사용자 정보 및 역할 확인 - 직접 쿼리로 변경
    const { data: userData, error: userError } = await serverSupabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return { 
        authorized: false, 
        error: "사용자 정보를 조회하는 중 오류가 발생했습니다", 
        status: 500 
      };
    }
    
    if (!userData) {
      console.error("사용자 조회 실패:", "사용자를 찾을 수 없음");
      return { 
        authorized: false, 
        error: "사용자 정보를 찾을 수 없습니다", 
        status: 404 
      };
    }
    
    const role = userData?.role || '';
    
    // 본사관리자 권한 확인
    if (role !== '본사관리자') {
      console.error("권한 부족:", role);
      return { 
        authorized: false, 
        error: "접근 권한이 없습니다.", 
        status: 403 
      };
    }
    
    // 인증 및 권한 검증 성공
    return { 
      authorized: true, 
      userId, 
      role 
    };
  } catch (error) {
    console.error('인증 확인 중 오류:', error);
    return { 
      authorized: false, 
      error: "인증 처리 중 오류가 발생했습니다.", 
      status: 500 
    };
  }
}

// 주문(매출) 목록 조회 (관리자 전용 - 모든 매출 데이터 조회 가능)
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }
    
    // URL 쿼리 파라미터 처리
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get("kolId");
    const shopId = searchParams.get("shopId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    
    try {
      // 기본 주문 데이터만 먼저 가져오기 (관계 없이)
      let ordersQuery = serverSupabase
        .from('orders')
        .select('id, order_number, shop_id, total_amount, status, order_date, payment_method, payment_status, created_at, updated_at', { count: 'exact' });
      
      // KOL ID로 필터링
      if (kolId) {
        // KOL에 속한 전문점 목록 조회
        const { data: shopList } = await serverSupabase
          .from('shops')
          .select('id')
          .eq('kol_id', kolId);
        
        if (shopList && shopList.length > 0) {
          const shopIds = shopList.map(shop => shop.id);
          ordersQuery = ordersQuery.in('shop_id', shopIds);
        } else {
          // 해당 KOL에 속한 전문점이 없는 경우 빈 결과 반환
          const response = NextResponse.json({
            orders: [],
            pagination: {
              page,
              pageSize,
              total: 0,
              totalPages: 0
            }
          });
          response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
          return response;
        }
      }
      
      // 전문점 ID로 필터링
      if (shopId) {
        ordersQuery = ordersQuery.eq('shop_id', shopId);
      }
      
      // 날짜 범위로 필터링
      if (startDate) {
        ordersQuery = ordersQuery.gte('order_date', startDate);
      }
      
      if (endDate) {
        // 종료일의 끝까지 포함하기 위해 하루를 더한 날짜 사용
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        ordersQuery = ordersQuery.lt('order_date', endDateObj.toISOString());
      }
      
      // 정렬 및 페이지네이션 적용
      ordersQuery = ordersQuery
        .order('order_date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      // 주문 목록 쿼리 실행
      const { data: orders, error: ordersError, count } = await ordersQuery;
      
      if (ordersError) {
        console.error("주문 목록 조회 오류:", ordersError);
        return NextResponse.json(
          { error: "주문 목록을 조회하는 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      if (!orders || orders.length === 0) {
        // 주문이 없는 경우 빈 결과 반환
        const response = NextResponse.json({
          orders: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0
          }
        });
        response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
        return response;
      }
      
      // 주문 ID 목록
      const orderIds = orders.map(order => order.id);
      
      // 모든 주문 관련 정보를 병렬로 가져오기
      const [shopsResult, itemsResult, commissionsResult] = await Promise.all([
        // 1. 전문점 및 KOL 정보
        serverSupabase
          .from('shops')
          .select(`
            id, owner_name, region,
            kols (id, name, shop_name)
          `)
          .in('id', orders.map(order => order.shop_id)),
          
        // 2. 주문 항목 및 제품 정보
        serverSupabase
          .from('order_items')
          .select(`
            id, order_id, product_id, quantity, price,
            products (id, name, price, is_device)
          `)
          .in('order_id', orderIds),
          
        // 3. 수당 정보
        serverSupabase
          .from('commissions')
          .select('id, order_id, amount, settled, settled_date')
          .in('order_id', orderIds)
      ]);
      
      // 에러 처리
      if (shopsResult.error) {
        console.error("전문점 정보 조회 오류:", shopsResult.error);
      }
      
      if (itemsResult.error) {
        console.error("주문 항목 정보 조회 오류:", itemsResult.error);
      }
      
      if (commissionsResult.error) {
        console.error("수당 정보 조회 오류:", commissionsResult.error);
      }
      
      // 관계 데이터 매핑을 위한 객체 생성
      const shopMap: Record<number, any> = {};
      const itemsMap: Record<number, any[]> = {};
      const commissionsMap: Record<number, any> = {};
      
      // 전문점 및 KOL 정보 매핑
      if (shopsResult.data) {
        shopsResult.data.forEach(shop => {
          // 배열에서 첫 번째 요소를 접근하도록 수정
          const kolData = Array.isArray(shop.kols) ? shop.kols[0] : shop.kols;
          shopMap[shop.id] = {
            id: shop.id,
            name: shop.owner_name,
            ownerName: shop.owner_name,
            region: shop.region,
            kol: kolData ? {
              id: kolData.id,
              name: kolData.name,
              shopName: kolData.shop_name
            } : null
          };
        });
      }
      
      // 주문 항목 정보 매핑
      if (itemsResult.data) {
        itemsResult.data.forEach(item => {
          if (!itemsMap[item.order_id]) {
            itemsMap[item.order_id] = [];
          }
          
          // 배열에서 첫 번째 요소를 접근하도록 수정
          const productData = Array.isArray(item.products) ? item.products[0] : item.products;
          itemsMap[item.order_id].push({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product: productData ? {
              id: productData.id,
              name: productData.name,
              price: productData.price,
              isDevice: productData.is_device
            } : null
          });
        });
      }
      
      // 수당 정보 매핑
      if (commissionsResult.data) {
        commissionsResult.data.forEach(commission => {
          commissionsMap[commission.order_id] = {
            id: commission.id,
            amount: commission.amount,
            settled: commission.settled,
            settledDate: commission.settled_date
          };
        });
      }
      
      // 최종 형식 변환 및 응답
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        shopId: order.shop_id,
        totalAmount: order.total_amount,
        status: order.status,
        orderDate: order.order_date,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        shop: shopMap[order.shop_id] || null,
        orderItems: itemsMap[order.id] || [],
        commission: commissionsMap[order.id] || null
      }));
      
      console.log(`주문 목록 조회 성공: ${formattedOrders.length}개 항목`);
      
      // 캐싱 헤더 적용
      const response = NextResponse.json({
        orders: formattedOrders,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      });
      response.headers.set('Cache-Control', CACHE_SETTINGS.CACHE_CONTROL_HEADER);
      return response;
      
    } catch (queryError) {
      console.error("쿼리 실행 오류:", queryError);
      return NextResponse.json(
        { error: "데이터 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("주문 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "주문 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 새 주문(매출) 등록 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }
    
    // 요청 데이터 검증
    const data = await request.json();
    const { storeId, items } = data;
    
    if (!storeId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "전문점 ID와 주문 항목은 필수입니다." },
        { status: 400 }
      );
    }
    
    try {
      // 전문점 존재 확인
      const { data: shop, error: shopError } = await serverSupabase
        .from('shops')
        .select('id, kol_id')
        .eq('id', storeId)
        .single();
      
      if (shopError || !shop) {
        return NextResponse.json(
          { error: "존재하지 않는 전문점입니다." },
          { status: 404 }
        );
      }
      
      // 총 주문 금액 계산
      let totalAmount = 0;
      const validatedItems = [];
      
      for (const item of items) {
        const { product, quantity } = item;
        if (!product?.id || !quantity || quantity <= 0) {
          return NextResponse.json(
            { error: "유효하지 않은 주문 항목이 있습니다." },
            { status: 400 }
          );
        }
        
        // 제품 가격 확인
        const { data: productItem, error: productError } = await serverSupabase
          .from('products')
          .select('id, price, is_device')
          .eq('id', product.id)
          .single();
        
        if (productError || !productItem) {
          return NextResponse.json(
            { error: `존재하지 않는 제품입니다: ${product.id}` },
            { status: 404 }
          );
        }
        
        totalAmount += productItem.price * quantity;
        validatedItems.push({
          productId: productItem.id,
          quantity,
          price: productItem.price,
          isDevice: productItem.is_device
        });
      }
      
      // 주문 번호 생성 (시간 기반 고유 번호)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const now = new Date().toISOString();
      
      // 1. 주문 생성
      const { data: newOrder, error: orderError } = await serverSupabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          shop_id: parseInt(storeId),
          total_amount: totalAmount,
          status: "completed", // 완료 상태로 바로 기록
          order_date: now,
          payment_method: "cash", // 기본값
          payment_status: "paid" // 지불 완료 상태로 기록
        })
        .select()
        .single();
      
      if (orderError || !newOrder) {
        console.error("주문 생성 오류:", orderError);
        return NextResponse.json(
          { error: "주문을 생성하는 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      // 2. 주문 항목 생성
      const orderItemsData = validatedItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        created_at: now,
        updated_at: now
      }));
      
      const { error: itemsError } = await serverSupabase
        .from('order_items')
        .insert(orderItemsData);
      
      if (itemsError) {
        console.error("주문 항목 생성 오류:", itemsError);
        return NextResponse.json(
          { error: "주문 항목을 생성하는 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      // 3. KOL에게 수당 자동 할당
      const { error: commissionError } = await serverSupabase
        .from('commissions')
        .insert({
          kol_id: shop.kol_id,
          order_id: newOrder.id,
          amount: Math.floor(totalAmount * 0.1), // 수당은 주문 금액의 10%로 설정
          settled: false, // 미정산 상태로 설정
          created_at: now,
          updated_at: now
        });
      
      if (commissionError) {
        console.error("수당 생성 오류:", commissionError);
        return NextResponse.json(
          { error: "수당을 생성하는 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      // 4. 통계 데이터 업데이트를 위한 정보 준비
      const yearMonth = now.substring(0, 7); // YYYY-MM 형식
      
      // 제품과 기기 매출 분리 계산
      const productSales = validatedItems
        .filter(item => !item.isDevice)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const deviceSales = validatedItems
        .filter(item => item.isDevice)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // 5. monthly_sales 테이블 업데이트 (upsert 사용)
      const { error: monthlySalesError } = await serverSupabase.rpc('update_monthly_sales', {
        p_kol_id: shop.kol_id,
        p_shop_id: parseInt(storeId),
        p_year_month: yearMonth,
        p_product_sales: productSales,
        p_device_sales: deviceSales,
        p_commission: Math.floor(totalAmount * 0.1)
      });
      
      if (monthlySalesError) {
        console.error("월별 매출 업데이트 오류:", monthlySalesError);
        // 실패해도 주문 등록은 성공으로 처리 (중요 데이터가 아님)
      }
      
      console.log(`주문 등록 성공: ID ${newOrder.id}, 주문번호 ${orderNumber}`);
      
      return NextResponse.json({
        success: true,
        message: "주문이 성공적으로 등록되었습니다.",
        order: {
          id: newOrder.id,
          orderNumber: newOrder.order_number,
          shopId: newOrder.shop_id,
          totalAmount: newOrder.total_amount,
          status: newOrder.status,
          orderDate: newOrder.order_date,
          paymentMethod: newOrder.payment_method,
          paymentStatus: newOrder.payment_status
        }
      }, { status: 201 });
    } catch (queryError) {
      console.error("쿼리 실행 오류:", queryError);
      return NextResponse.json(
        { error: "주문 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("주문 등록 오류:", error);
    return NextResponse.json(
      { error: "주문을 등록하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 