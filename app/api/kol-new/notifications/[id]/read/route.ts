import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// PUT: 특정 알림을 읽음으로 표시
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    
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
    console.log('알림 ID:', notificationId);

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
    
    // 알림이 존재하는지 확인 및 본인 소유인지 확인
    const notification = await db.query(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userIdFromDb]
    );
    
    if (notification.rows.length === 0) {
      console.error('알림을 찾을 수 없거나 권한이 없음:', notificationId, userIdFromDb);
      return NextResponse.json(
        { error: '알림을 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }
    
    console.log('알림 읽음으로 표시:', notificationId);
    
    // 알림을 읽음으로 표시
    await db.query(
      `UPDATE notifications SET read = true, updated_at = NOW() WHERE id = $1`,
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: '알림이 읽음으로 표시되었습니다.'
    });
  } catch (error) {
    console.error('알림 상태 변경 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
} 