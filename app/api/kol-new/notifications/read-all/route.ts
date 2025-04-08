import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// PUT: 모든 알림을 읽음으로 표시
export async function PUT(req: NextRequest) {
  try {
    // 현재 인증된 사용자 확인
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      console.error('인증되지 않은 사용자');
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    console.log('현재 사용자 ID:', userId);

    // 사용자 정보 가져오기
    const user = await db.query(
      `SELECT id FROM users WHERE clerk_id = $1`,
      [userId]
    );
    
    if (user.rows.length === 0) {
      console.error('사용자 정보를 찾을 수 없음:', userId);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const userIdFromDb = user.rows[0].id;
    console.log('DB 사용자 ID:', userIdFromDb);
    
    // 사용자의 모든 알림을 읽음으로 표시
    const result = await db.query(
      `UPDATE notifications 
       SET read = true, updated_at = NOW() 
       WHERE user_id = $1 AND read = false
       RETURNING *`,
      [userIdFromDb]
    );

    const rowCount = result?.rowCount || 0;
    console.log('모든 알림 읽음 처리 결과:', rowCount);

    return NextResponse.json({
      success: true,
      message: `${rowCount}개의 알림이 읽음으로 표시되었습니다.`,
      count: rowCount
    });
  } catch (error) {
    console.error('알림 상태 변경 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
} 