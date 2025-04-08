import { db } from '@/lib/db';

/**
 * 클럭 사용자 ID로부터 KOL ID를 가져오는 함수
 * @param clerkUserId - 클럭 사용자 ID
 * @returns KOL ID 또는 null
 */
export async function getCurrentKolId(clerkUserId: string): Promise<number | null> {
  try {
    // 먼저 users 테이블에서 내부 user_id 검색
    const userResult = await db.query(
      `SELECT id FROM users WHERE clerk_id = $1`,
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      console.error('사용자 정보를 찾을 수 없습니다:', clerkUserId);
      return null;
    }

    const userId = userResult.rows[0].id;

    // 해당 사용자의 KOL 정보 검색
    const kolResult = await db.query(
      `SELECT id FROM kols WHERE user_id = $1`,
      [userId]
    );

    if (kolResult.rows.length === 0) {
      console.error('KOL 정보를 찾을 수 없습니다:', userId);
      return null;
    }

    return kolResult.rows[0].id;
  } catch (error) {
    console.error('getCurrentKolId 오류:', error);
    return null;
  }
}

/**
 * KOL ID를 가져오고 없으면 에러를 발생시키는 함수
 * @param clerkUserId - 클럭 사용자 ID
 * @returns KOL ID
 * @throws KOL 정보가 없을 경우 에러 발생
 */
export async function getRequiredKolId(clerkUserId: string): Promise<number> {
  const kolId = await getCurrentKolId(clerkUserId);
  
  if (kolId === null) {
    throw new Error('KOL 정보를 찾을 수 없습니다.');
  }
  
  return kolId;
} 