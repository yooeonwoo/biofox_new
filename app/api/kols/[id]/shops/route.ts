import { db } from "@/db";
import { shops, kols, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

// 특정 KOL의 전문점 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, role } = await getAuth();
    const kolId = parseInt(params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // KOL 존재 여부 확인
    const kol = await db.query.kols.findFirst({
      where: eq(kols.id, kolId),
    });

    if (!kol) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자가 아닌 경우, 자신의 KOL 정보만 조회 가능
    if (role !== "본사관리자") {
      const userInfo = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      if (!userInfo) {
        return NextResponse.json(
          { error: "사용자 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      if (kol.userId !== userInfo.id) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // KOL의 전문점 목록 조회
    const shopList = await db.query.shops.findMany({
      where: eq(shops.kolId, kolId),
      orderBy: (shops, { desc }) => [desc(shops.createdAt)],
    });

    return NextResponse.json(shopList);
  } catch (error) {
    console.error("KOL 전문점 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL 전문점 목록을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 