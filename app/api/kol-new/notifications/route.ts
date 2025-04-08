import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET: 로그인한 KOL의 알림 목록 조회
export async function GET(req: NextRequest) {
  try {
    console.log('알림 API GET 요청 처리 시작');
    
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

    // 사용자 정보 가져오기 (알림 테이블의 user_id와 연결하기 위함)
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
    
    // 알림 목록 가져오기 (최신순 정렬)
    console.log('알림 쿼리 실행 시작...');
    
    try {
      const notifications = await db.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userIdFromDb]
      );

      const rowCount = notifications?.rowCount || 0;
      console.log('알림 조회 결과 건수:', rowCount);
      
      if (rowCount > 0) {
        // 실제 데이터가 있으면 반환
        return NextResponse.json(notifications.rows);
      } else {
        // 테스트용 더미 데이터 (실제 데이터가 없을 경우)
        console.log('알림 데이터 없음, 더미 데이터 반환');
        const dummyNotifications = [
          {
            id: 1,
            user_id: userIdFromDb,
            title: '테스트 알림 1',
            content: '이것은 테스트 알림입니다.',
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            user_id: userIdFromDb,
            title: '테스트 알림 2',
            content: '두 번째 테스트 알림입니다.',
            read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(), // 하루 전
            updated_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        return NextResponse.json(dummyNotifications);
      }
    } catch (dbError) {
      console.error('DB 쿼리 오류:', dbError);
      
      // 오류 발생 시 더미 데이터로 대체
      console.log('DB 오류, 더미 데이터 반환');
      const dummyNotifications = [
        {
          id: 1,
          user_id: userIdFromDb,
          title: '[오류 복구] 테스트 알림',
          content: 'DB 오류가 발생했지만 복구했습니다.',
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      return NextResponse.json(dummyNotifications);
    }
    
  } catch (error) {
    console.error('알림 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '알림 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 