import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';
import { createClerkToolkit } from '@clerk/agent-toolkit/ai-sdk';

/**
 * GET /api/mcp/tools
 *
 * 간단한 헬스체크 & 가용 툴 목록 반환 엔드포인트.
 * 1) Clerk Secret Key를 사용해 Clerk MCP Toolkit을 초기화하고
 * 2) 현재 사용할 수 있는 툴 이름 배열을 JSON 으로 응답합니다.
 *
 * 초기 통합 테스트용으로 사용하세요.
 */
export async function GET() {
  try {
    // 1. Secret Key 존재 확인
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not defined in environment');
    }

    // 2. Clerk Client 인스턴스화 후 Toolkit 초기화
    const clerkClient = await createClerkClient({ secretKey });
    const toolkit = await createClerkToolkit({ clerkClient });

    // 3. 사용 가능한 모든 툴 객체 가져오기
    const tools = toolkit.allTools();

    return NextResponse.json({
      ok: true,
      availableToolNames: Object.keys(tools),
    });
  } catch (err: unknown) {
    console.error('[MCP] Clerk toolkit 초기화 오류:', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
