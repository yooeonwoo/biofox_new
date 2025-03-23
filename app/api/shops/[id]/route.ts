import { db } from "@/db";
import { shops, kols, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// 특정 전문점 조회
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

    // 전문점 정보 조회
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, id),
      with: {
        kol: {
          columns: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "전문점을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자가 아닌 경우, KOL 자신의 전문점만 조회 가능
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

      const kol = await db.query.kols.findFirst({
        where: eq(kols.userId, userInfo.id),
      });

      if (!kol || kol.id !== shop.kolId) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("전문점 조회 오류:", error);
    return NextResponse.json(
      { error: "전문점을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 전문점 정보 수정
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

    // 전문점 존재 확인
    const shopToUpdate = await db.query.shops.findFirst({
      where: eq(shops.id, id),
    });

    if (!shopToUpdate) {
      return NextResponse.json(
        { error: "전문점을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자가 아닌 경우, KOL 자신의 전문점만 수정 가능
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

      const kol = await db.query.kols.findFirst({
        where: eq(kols.userId, userInfo.id),
      });

      if (!kol || kol.id !== shopToUpdate.kolId) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    const data = await req.json();
    const { name, ownerName, address, phone, businessNumber, description, image, operatingHours, status, kolId } = data;

    // 필수 필드 확인
    if (!name || !ownerName || !address) {
      return NextResponse.json(
        { error: "이름, 소유자 이름, 주소는 필수 항목입니다" },
        { status: 400 }
      );
    }

    // KOL ID 변경 시 확인 (관리자만 가능)
    if (kolId && kolId !== shopToUpdate.kolId && orgRole !== "본사관리자") {
      return NextResponse.json(
        { error: "KOL 변경은 관리자만 가능합니다" },
        { status: 403 }
      );
    }

    // KOL ID 변경 시 KOL 존재 여부 확인
    if (kolId && kolId !== shopToUpdate.kolId) {
      const kol = await db.query.kols.findFirst({
        where: eq(kols.id, kolId),
      });

      if (!kol) {
        return NextResponse.json(
          { error: "KOL을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    // 전문점 정보 업데이트
    const updatedShop = await db.update(shops)
      .set({
        name,
        ownerName,
        kolId: kolId || shopToUpdate.kolId,
        address,
        phone,
        businessNumber,
        description,
        image,
        operatingHours,
        status: orgRole === "본사관리자" ? status : shopToUpdate.status, // 관리자만 상태 변경 가능
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    return NextResponse.json(updatedShop[0]);
  } catch (error) {
    console.error("전문점 정보 수정 오류:", error);
    return NextResponse.json(
      { error: "전문점 정보를 수정하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 전문점 삭제
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

    // 전문점 존재 확인
    const shopToDelete = await db.query.shops.findFirst({
      where: eq(shops.id, id),
    });

    if (!shopToDelete) {
      return NextResponse.json(
        { error: "전문점을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자가 아닌 경우, KOL 자신의 전문점만 삭제 가능
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

      const kol = await db.query.kols.findFirst({
        where: eq(kols.userId, userInfo.id),
      });

      if (!kol || kol.id !== shopToDelete.kolId) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // 전문점 삭제
    await db.delete(shops).where(eq(shops.id, id));

    return NextResponse.json({ message: "전문점이 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("전문점 삭제 오류:", error);
    return NextResponse.json(
      { error: "전문점을 삭제하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 