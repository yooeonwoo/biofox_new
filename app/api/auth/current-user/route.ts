import { NextResponse } from 'next/server';
import { checkAuthSupabase } from '@/lib/auth';

export async function GET() {
  try {
    const { user } = await checkAuthSupabase();
    
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자' },
        { status: 401 }
      );
    }
    
    // 필요한 정보만 반환 (보안)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
  } catch (error) {
    console.error('Current user API 에러:', error);
    return NextResponse.json(
      { error: '사용자 정보 조회 실패' },
      { status: 500 }
    );
  }
}