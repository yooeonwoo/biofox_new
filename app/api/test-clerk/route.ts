/**
 * Clerk API 연결 테스트
 */
import { NextRequest, NextResponse } from 'next/server';
import clerkApi from '@/lib/clerk-direct-api';
import * as clerkAdmin from '@/lib/clerk/admin';

export async function GET(request: NextRequest) {
  try {
    // Clerk API 키 확인
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;

    console.log('Clerk 키 확인:');
    console.log('- Publishable Key:', publishableKey ? `설정됨 (${publishableKey.substring(0, 10)}...)` : '미설정');
    console.log('- Secret Key:', secretKey ? `설정됨 (${secretKey.substring(0, 10)}...)` : '미설정');

    // Clerk API 연결 테스트
    console.log('Clerk API 연결 테스트 시작...');

    try {
      // 1. 직접 API 클라이언트 사용
      console.log('1. 직접 API 클라이언트 테스트');
      const users = await clerkApi.getUserList(10, 0);

      console.log(`Clerk 사용자 목록 조회 성공: ${users.length}명의 사용자 발견`);

      // 2. 관리자 유틸리티 함수 사용
      console.log('2. 관리자 유틸리티 함수 테스트');
      const adminUsers = await clerkAdmin.getAllUsers();

      console.log(`관리자 유틸리티로 사용자 목록 조회 성공: ${adminUsers.length}명의 사용자 발견`);

      return NextResponse.json({
        success: true,
        message: 'Clerk API 연결 성공',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        directClientTest: {
          userCount: users.length,
          firstUser: users.length > 0 ? {
            id: users[0].id,
            email: users[0].email_addresses?.[0]?.email_address || '이메일 없음',
            firstName: users[0].first_name,
            lastName: users[0].last_name,
            role: users[0].public_metadata?.role || '역할 없음'
          } : null
        },
        adminUtilTest: {
          userCount: adminUsers.length
        },
        apiInfo: {
          availableMethods: Object.keys(clerkApi)
        }
      });
    } catch (clerkError: any) {
      console.error('Clerk API 연결 테스트 실패:', clerkError);

      return NextResponse.json({
        success: false,
        message: 'Clerk API 연결 실패',
        error: clerkError.message || '알 수 없는 오류',
        stack: clerkError.stack || '스택 정보 없음',
        name: clerkError.name || '오류 유형 정보 없음',
        status: clerkError.status || '상태 정보 없음'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Clerk API 테스트 처리 중 오류:', error);

    return NextResponse.json({
      success: false,
      message: 'Clerk API 테스트 처리 중 오류 발생',
      error: error.message || '알 수 없는 오류',
      stack: error.stack || '스택 정보 없음'
    }, { status: 500 });
  }
}