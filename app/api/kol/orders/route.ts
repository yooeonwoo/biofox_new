import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, commissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";

// 주문(매출) 목록 조회 (KOL 전용 - 자신의 소속 전문점 매출만 조회 가능)
export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const { userId, role } = await getAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // KOL 역할 확인
    if (role !== "kol") {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }
    
    // KOL ID 가져오기
    const kolResult = await db.query.kols.findFirst({
      where: (kols) => eq(kols.userId, Number(userId)),
    });
    
    if (!kolResult) {
      return NextResponse.json(
        { error: "KOL 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // KOL의 전문점 목록 가져오기
    const shops = await db.query.shops.findMany({
      where: (shops) => eq(shops.kolId, kolResult.id),
    });
    
    const shopIds = shops.map((shop) => shop.id);
    
    // 전문점들의 주문 목록 조회
    const ordersList = await db.query.orders.findMany({
      where: (orders) => {
        return shopIds.includes(orders.shopId);
      },
      with: {
        shop: true,
        orderItems: {
          with: {
            product: true,
          },
        },
        commission: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.orderDate)],
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