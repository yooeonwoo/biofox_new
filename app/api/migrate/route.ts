import { NextRequest, NextResponse } from "next/server";
import { migrateDatabase } from "@/db/migrate";
import { auth } from "@clerk/nextjs/server";

/**
 * POST: 데이터베이스 마이그레이션 실행
 * 개발 환경에서만 사용하세요.
 */
export async function POST(req: NextRequest) {
  try {
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    
    // 개발 환경에서는 인증 확인 없이 실행 가능
    if (!isDevEnvironment) {
      // 운영 환경에서는 관리자 권한 확인
      const authObject = await auth();
      const userId = authObject.userId;
      
      if (!userId) {
        return NextResponse.json(
          { error: "인증이 필요합니다." },
          { status: 401 }
        );
      }
      
      // TODO: 추가 관리자 권한 확인 로직
    }

    // 마이그레이션 실행
    const result = await migrateDatabase();

    return NextResponse.json({ 
      success: true, 
      message: "마이그레이션이 완료되었습니다.",
      details: result
    }, { status: 200 });
  } catch (error) {
    console.error("마이그레이션 실패:", error);
    return NextResponse.json(
      { 
        error: "마이그레이션 중 오류가 발생했습니다.", 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : null
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 마이그레이션 상태 확인
 */
export async function GET() {
  return NextResponse.json({ 
    ready: true, 
    message: "마이그레이션 API가 사용 가능합니다.",
    environment: process.env.NODE_ENV
  }, { status: 200 });
} 