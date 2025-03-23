import { db } from "@/db";
import { kols, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export interface IKol {
  id?: number;
  userId: number;
  name: string;
  shopName: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  status?: string;
}

// KOL 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { userId, orgRole } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 확인
    if (orgRole !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // KOL 목록 조회
    const kolList = await db.query.kols.findMany({
      orderBy: (kols, { desc }) => [desc(kols.createdAt)],
      with: {
        user: {
          columns: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(kolList);
  } catch (error) {
    console.error("KOL 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL 목록을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 등록
export async function POST(req: NextRequest) {
  try {
    const { userId, orgRole } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 확인
    if (orgRole !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await req.json();
    const { name, shopName, phone, address, profileImage, description, bankName, accountNumber, accountHolder } = data;

    // 필수 필드 확인
    if (!name || !shopName) {
      return NextResponse.json(
        { error: "이름과 상점명은 필수 항목입니다" },
        { status: 400 }
      );
    }

    // 사용자 ID 확인
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, data.clerkId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 생성
    const newKol = await db.insert(kols).values({
      userId: user.id,
      name,
      shopName,
      phone,
      address,
      profileImage,
      description,
      bankName,
      accountNumber,
      accountHolder,
      status: "active",
    }).returning();

    return NextResponse.json(newKol[0], { status: 201 });
  } catch (error) {
    console.error("KOL 등록 오류:", error);
    return NextResponse.json(
      { error: "KOL을 등록하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 