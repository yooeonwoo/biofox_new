import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, shops, kols, commissions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// 관리자 권한 확인 헬퍼 함수
async function checkAdminAuth() {
  const { userId, orgRole } = await auth();
  
  if (!userId) {
    return { authorized: false, error: "인증되지 않은 사용자입니다.", status: 401 };
  }
  
  if (orgRole !== "본사관리자") {
    return { authorized: false, error: "접근 권한이 없습니다.", status: 403 };
  }
  
  return { authorized: true };
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
    
    // 조건 설정
    let whereConditions = [];
    
    // KOL ID로 필터링
    if (kolId) {
      // KOL 소속 전문점 찾기
      const shopList = await db.query.shops.findMany({
        where: eq(shops.kolId, parseInt(kolId)),
      });
      
      if (shopList.length > 0) {
        const shopIds = shopList.map(shop => shop.id);
        // 조건을 eq로 단순화
        if (shopIds.length === 1) {
          whereConditions.push(eq(orders.shopId, shopIds[0]));
        } else {
          // 여러 전문점이 있는 경우 IN 구문 대신 OR 조건 사용
          const shopConditions = shopIds.map(id => eq(orders.shopId, id));
          // 이 부분은 실제 구현 시 OR 조건으로 변경 필요
        }
      }
    }
    
    // 전문점 ID로 필터링
    if (shopId) {
      whereConditions.push(eq(orders.shopId, parseInt(shopId)));
    }
    
    // 날짜 범위로 필터링 (날짜 필터링은 추가 구현 필요)
    
    // 주문 목록 조회
    const ordersList = await db.query.orders.findMany({
      // 조건이 있는 경우에만 where절 추가
      ...(whereConditions.length > 0 && { 
        where: whereConditions.length === 1 
          ? whereConditions[0] 
          : and(...whereConditions) 
      }),
      with: {
        shop: {
          with: {
            kol: true,
          },
        },
        orderItems: {
          with: {
            product: true,
          },
        },
        commission: true,
      },
      orderBy: [desc(orders.orderDate)],
    });
    
    return NextResponse.json(ordersList);
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
    
    // 전문점 존재 확인
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, parseInt(storeId)),
      with: {
        kol: true,
      },
    });
    
    if (!shop) {
      return NextResponse.json(
        { error: "존재하지 않는 전문점입니다." },
        { status: 404 }
      );
    }
    
    // 총 주문 금액 계산
    let totalAmount = 0;
    for (const item of items) {
      const { product, quantity } = item;
      if (!product?.id || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: "유효하지 않은 주문 항목이 있습니다." },
          { status: 400 }
        );
      }
      
      // 제품 가격 확인
      const productItem = await db.query.products.findFirst({
        where: eq(products.id, parseInt(product.id)),
      });
      
      if (!productItem) {
        return NextResponse.json(
          { error: `존재하지 않는 제품입니다: ${product.id}` },
          { status: 404 }
        );
      }
      
      totalAmount += productItem.price * quantity;
    }
    
    // 주문 번호 생성 (시간 기반 고유 번호)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // 트랜잭션 시작
    const orderResult = await db.transaction(async (tx) => {
      // 주문 생성
      const [newOrder] = await tx.insert(orders).values({
        orderNumber,
        shopId: parseInt(storeId),
        totalAmount,
        status: "completed", // 완료 상태로 바로 기록
        orderDate: new Date(),
        paymentMethod: "cash", // 기본값
        paymentStatus: "paid", // 지불 완료 상태로 기록
      }).returning();
      
      if (!newOrder) {
        throw new Error("주문 생성에 실패했습니다.");
      }
      
      // 주문 항목 추가
      for (const item of items) {
        const { product, quantity } = item;
        
        const productItem = await tx.query.products.findFirst({
          where: eq(products.id, parseInt(product.id)),
        });
        
        if (!productItem) {
          throw new Error(`존재하지 않는 제품입니다: ${product.id}`);
        }
        
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: productItem.id,
          quantity,
          price: productItem.price,
        });
      }
      
      // 수당 금액 계산 (예: 매출의 10%)
      const commissionAmount = Math.floor(totalAmount * 0.1);
      
      // 수당 생성
      await tx.insert(commissions).values({
        kolId: shop.kolId,
        orderId: newOrder.id,
        amount: commissionAmount,
        settled: false,
      });
      
      return newOrder;
    });
    
    // 생성된 주문 데이터 조회
    const createdOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderResult.id),
      with: {
        shop: {
          with: {
            kol: true,
          },
        },
        orderItems: {
          with: {
            product: true,
          },
        },
        commission: true,
      },
    });
    
    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error("주문 등록 오류:", error);
    return NextResponse.json(
      { error: "주문을 등록하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 