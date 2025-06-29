import { NextRequest, NextResponse } from 'next/server';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

// 임시 사용자 데이터
const TEMP_USER: User = {
  id: 'temp-user-id',
  name: '테스트 사용자',
  email: 'test@example.com',
  role: 'kol'
};

const TEMP_AUTH_USER: AuthUser = {
  id: 'temp-user-id',
  email: 'test@example.com',
  role: 'kol'
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  // 로컬 개발환경에서는 항상 임시 사용자 반환
  return TEMP_AUTH_USER;
}

export async function getUserRole(): Promise<string> {
  return TEMP_USER.role;
}

export async function isAuthenticated(): Promise<boolean> {
  // 로컬 개발환경에서는 항상 인증된 상태로 처리
  return true;
}

export async function requireAuth(): Promise<User> {
  // 로컬 개발환경에서는 항상 임시 사용자 반환
  return TEMP_USER;
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function isKOL(user: AuthUser | null): boolean {
  return user?.role === 'kol';
}

export function isUser(user: AuthUser | null): boolean {
  return user?.role === 'user';
}

export function hasAccess(user: AuthUser | null, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

export function getAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // 'Bearer ' 이후의 토큰 부분
}

export async function getClientRole(userId: string | null): Promise<string | null> {
  if (!userId) {
    return null;
  }
  
  // 로컬 개발환경에서는 항상 임시 사용자 역할 반환
  return TEMP_USER.role;
}

export async function getKolId(): Promise<number | null> {
  try {
    const { serverSupabase } = await import('@/lib/supabase');
    
    const { data, error } = await serverSupabase
      .from('kols')
      .select('id')
      .eq('clerk_user_id', TEMP_USER.id)
      .single();
    
    if (error) {
      console.error('KOL ID 조회 오류:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('KOL ID 조회 중 예외 발생:', error);
    return null;
  }
}

export async function checkAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<NextResponse | null> {
  try {
    // 로컬 개발환경에서는 항상 인증 성공으로 처리
    const role = TEMP_USER.role;
    
    // 역할 검증이 필요한 경우
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        console.error(`권한 부족: 요청된 역할 ${role}, 필요한 역할 ${allowedRoles.join(', ')}`);
        return NextResponse.json(
          { error: "접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    }
    
    // 인증 및 권한 검증 성공
    return null;
  } catch (error) {
    console.error('인증 검증 중 오류:', error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 기본 export 객체
const authHelpers = {
  getCurrentUser,
  isAuthenticated,
  requireAuth,
  getUserRole,
  isAdmin,
  isKOL,
  isUser,
  hasAccess,
  getAccessToken,
  getClientRole,
  getKolId,
  checkAuth,
};

export default authHelpers;