import { db } from "@/db";
import { shops, kols, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export interface IShop {
  id?: number;
  name: string;
  ownerName: string;
  kolId: number;
  address: string;
  phone?: string;
  businessNumber?: string;
  description?: string;
  image?: string;
  operatingHours?: string;
  status?: string;
}

// 전문점 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { userId, orgRole } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자는 모든 전문점 조회 가능, KOL은 자신의 전문점만 조회 가능
    if (orgRole === "본사관리자") {
      // 관리자인 경우 모든 전문점 조회
      const shopList = await db.query.shops.findMany({
        orderBy: (shops, { desc }) => [desc(shops.createdAt)],
        with: {
          kol: {
            columns: {
              name: true,
            },
          },
        },
      });

      return NextResponse.json(shopList);
    } else {
      // KOL인 경우 자신의 전문점만 조회
      const userInfo = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      if (!userInfo) {
        return NextResponse.json(
          { error: "사용자 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      const kol = await db.query.kols.findFirst({
        where: eq(kols.userId, userInfo.id),
      });

      if (!kol) {
        return NextResponse.json(
          { error: "KOL 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      const shopList = await db.query.shops.findMany({
        where: eq(shops.kolId, kol.id),
        orderBy: (shops, { desc }) => [desc(shops.createdAt)],
      });

      return NextResponse.json(shopList);
    }
  } catch (error) {
    console.error("전문점 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "전문점 목록을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 전문점 등록
export async function POST(req: NextRequest) {
  try {
    const { userId, orgRole } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, ownerName, kolId, address, phone, businessNumber, description, image, operatingHours } = data;

    // 필수 필드 확인
    if (!name || !ownerName || !kolId || !address) {
      return NextResponse.json(
        { error: "이름, 소유자 이름, KOL ID, 주소는 필수 항목입니다" },
        { status: 400 }
      );
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

    // 관리자가 아닌 경우, 자신의 전문점만 등록 가능
    if (orgRole !== "본사관리자") {
      const userInfo = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      if (!userInfo) {
        return NextResponse.json(
          { error: "사용자 정보를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      const myKol = await db.query.kols.findFirst({
        where: eq(kols.userId, userInfo.id),
      });

      if (!myKol || myKol.id !== kolId) {
        return NextResponse.json(
          { error: "자신의 전문점만 등록할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // 전문점 생성
    const newShop = await db.insert(shops).values({
      name,
      ownerName,
      kolId,
      address,
      phone,
      businessNumber,
      description,
      image,
      operatingHours,
      status: "active",
    }).returning();

    return NextResponse.json(newShop[0], { status: 201 });
  } catch (error) {
    console.error("전문점 등록 오류:", error);
    return NextResponse.json(
      { error: "전문점을 등록하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 