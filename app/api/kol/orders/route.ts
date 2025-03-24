import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, commissions, kols, users, shops as shopsTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkAuthSupabase } from "@/lib/auth";

// 주문(매출) 목록 조회 (KOL 전용 - 자신의 소속 전문점 매출만 조회 가능)
export async function GET(request: NextRequest) {
  try {
    // Supabase를 통한 사용자 인증 및 권한 확인
    const authResult = await checkAuthSupabase(["kol"]);
    
    if (authResult instanceof NextResponse) {
      // 인증 또는 권한 오류 - 응답 그대로 반환
      return authResult;
    }
    
    if (!authResult) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // 사용자의 이메일을 통해 연결된 사용자 ID 가져오기
    const userInfo = await db.query.users.findFirst({
      where: eq(users.email, authResult.email),
    });
    
    if (!userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // KOL ID 가져오기
    const kolResult = await db.query.kols.findFirst({
      where: eq(kols.userId, userInfo.id),
    });
    
    if (!kolResult) {
      return NextResponse.json(
        { error: "KOL 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // KOL의 전문점 목록 가져오기
    const shopsList = await db.query.shops.findMany({
      where: eq(shopsTable.kolId, kolResult.id),
    });
    
    const shopIds = shopsList.map((shop) => shop.id);
    
    if (shopIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // 전문점들의 주문 목록 조회
    const ordersList = await db.query.orders.findMany({
      where: inArray(orders.shopId, shopIds),
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