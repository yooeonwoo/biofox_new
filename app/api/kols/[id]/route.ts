import { db } from "@/db";
import { kols, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// 특정 KOL 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgRole } = await auth();
    const id = parseInt(params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 권한 확인 (관리자 또는 자신의 정보)
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
      where: eq(kols.id, id),
      with: {
        shops: true,
      },
    });

    if (!kol) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 자신의 정보가 아니고 관리자도 아닌 경우 접근 거부
    if (kol.userId !== userInfo.id && orgRole !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(kol);
  } catch (error) {
    console.error("KOL 조회 오류:", error);
    return NextResponse.json(
      { error: "KOL을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 정보 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgRole } = await auth();
    const id = parseInt(params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 권한 확인
    const userInfo = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const kolToUpdate = await db.query.kols.findFirst({
      where: eq(kols.id, id),
    });

    if (!kolToUpdate) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 자신의 정보가 아니고 관리자도 아닌 경우 접근 거부
    if (kolToUpdate.userId !== userInfo.id && orgRole !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await req.json();
    const { name, shopName, phone, address, profileImage, description, bankName, accountNumber, accountHolder, status } = data;

    // 필수 필드 확인
    if (!name || !shopName) {
      return NextResponse.json(
        { error: "이름과 상점명은 필수 항목입니다" },
        { status: 400 }
      );
    }

    // KOL 정보 업데이트
    const updatedKol = await db.update(kols)
      .set({
        name,
        shopName,
        phone,
        address,
        profileImage,
        description,
        bankName,
        accountNumber,
        accountHolder,
        status: orgRole === "본사관리자" ? status : kolToUpdate.status, // 관리자만 상태 변경 가능
        updatedAt: new Date(),
      })
      .where(eq(kols.id, id))
      .returning();

    return NextResponse.json(updatedKol[0]);
  } catch (error) {
    console.error("KOL 정보 수정 오류:", error);
    return NextResponse.json(
      { error: "KOL 정보를 수정하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// KOL 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgRole } = await auth();
    const id = parseInt(params.id);

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 확인
    if (orgRole !== "본사관리자") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // KOL 존재 여부 확인
    const kolToDelete = await db.query.kols.findFirst({
      where: eq(kols.id, id),
    });

    if (!kolToDelete) {
      return NextResponse.json(
        { error: "KOL을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // KOL 삭제
    await db.delete(kols).where(eq(kols.id, id));

    return NextResponse.json({ message: "KOL이 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("KOL 삭제 오류:", error);
    return NextResponse.json(
      { error: "KOL을 삭제하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 