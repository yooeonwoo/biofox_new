import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { desc } from "drizzle-orm";

/**
 * 제품 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // 제품 목록 조회
    const productList = await db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      where: (products, { eq }) => eq(products.status, "active")
    });
    
    return NextResponse.json(productList);
  } catch (error) {
    console.error("제품 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "제품 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 