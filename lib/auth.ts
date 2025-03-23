import { NextRequest } from 'next/server';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

// 간단한 구현을 위해 Clerk 의존성 제거
export async function getCurrentUser(): Promise<AuthUser | null> {
  // 임시 구현: 실제 환경에서는 세션 등에서 사용자 ID를 가져와야 함
  const mockUserId = process.env.MOCK_USER_ID || null;
  
  if (!mockUserId) {
    return null;
  }

  return {
    id: mockUserId,
    email: 'user@example.com',
    role: 'user',
  };
}

export function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return !!authHeader && authHeader.startsWith('Bearer ');
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

// kol api에서 사용되는 getAuth 함수
export async function getAuth(request: NextRequest): Promise<AuthUser | null> {
  const token = getAccessToken(request);
  
  if (!token) {
    return null;
  }
  
  // 여기서는 임시로 기본 사용자를 반환합니다.
  // 실제 구현에서는 토큰을 검증하고 사용자 정보를 가져와야 합니다.
  return {
    id: 'temp-user-id',
    email: 'temp@example.com',
    role: 'kol',
  };
}

// 명시적으로 객체를 변수에 할당하여 ESLint 경고 해결
const authExports = {
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  isKOL,
  isUser,
  hasAccess,
  getAccessToken,
  getAuth,
};

export default authExports; 