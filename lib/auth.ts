import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

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

// 개발환경에서 localStorage에서 사용자 정보 가져오기 (클라이언트에서만)
function getDevUserFromLocalStorage(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const devUser = localStorage.getItem('dev-user');
    return devUser ? JSON.parse(devUser) : null;
  } catch {
    return null;
  }
}

// 서버사이드에서 쿠키에서 사용자 정보 가져오기
async function getDevUserFromCookies(): Promise<User | null> {
  if (typeof window !== 'undefined') return null;

  try {
    // Next.js API 라우트에서 쿠키 접근
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const devUserCookie = cookieStore.get('dev-user')?.value;

    if (!devUserCookie) return null;

    return JSON.parse(decodeURIComponent(devUserCookie));
  } catch (error) {
    console.error('쿠키에서 사용자 정보 읽기 실패:', error);
    return null;
  }
}

// 개발환경용 기본 사용자 (서버사이드에서 사용)
const DEFAULT_DEV_USER: User = {
  id: '56',
  name: '정광원',
  email: 'jkw6746@naver.com',
  role: 'kol',
};

// Convex HTTP 클라이언트 (서버사이드에서 사용)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convexClient: ConvexHttpClient | null = null;

if (convexUrl) {
  convexClient = new ConvexHttpClient(convexUrl);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // 개발환경에서는 localStorage에서 사용자 정보 가져오기
  if (process.env.NODE_ENV === 'development') {
    const devUser = getDevUserFromLocalStorage();
    if (devUser) {
      return {
        id: devUser.id,
        email: devUser.email,
        role: devUser.role,
      };
    }
    // localStorage에 없으면 기본 사용자 반환
    return {
      id: DEFAULT_DEV_USER.id,
      email: DEFAULT_DEV_USER.email,
      role: DEFAULT_DEV_USER.role,
    };
  }

  // TODO: 프로덕션에서는 Supabase Auth 세션 확인
  // const { data: { session } } = await supabase.auth.getSession();
  // return session?.user ? { ... } : null;

  return null;
}

export async function getUserRole(): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    const devUser = getDevUserFromLocalStorage();
    return devUser?.role || DEFAULT_DEV_USER.role;
  }

  // TODO: 프로덕션에서는 Supabase에서 역할 조회
  return '';
}

export async function isAuthenticated(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true; // 개발환경에서는 항상 인증된 상태
  }

  // TODO: 프로덕션에서는 Supabase 세션 확인
  return false;
}

export async function requireAuth(): Promise<User> {
  if (process.env.NODE_ENV === 'development') {
    const devUser = getDevUserFromLocalStorage();
    return devUser || DEFAULT_DEV_USER;
  }

  // TODO: 프로덕션에서는 Supabase 세션에서 사용자 정보 반환
  throw new Error('인증이 필요합니다.');
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

  if (process.env.NODE_ENV === 'development') {
    const devUser = getDevUserFromLocalStorage();
    return devUser?.role || DEFAULT_DEV_USER.role;
  }

  // TODO: 프로덕션에서는 Supabase에서 역할 조회
  return null;
}

export async function getKolId(): Promise<number | null> {
  try {
    const { serverSupabase } = await import('@/lib/supabase');

    let userId: string;

    if (process.env.NODE_ENV === 'development') {
      if (typeof window === 'undefined') {
        // 서버사이드: 쿠키에서 사용자 정보 읽기
        const devUser = await getDevUserFromCookies();
        userId = devUser?.id || DEFAULT_DEV_USER.id;
      } else {
        // 클라이언트사이드: localStorage에서 사용자 정보 가져오기
        const devUser = getDevUserFromLocalStorage();
        userId = devUser?.id || DEFAULT_DEV_USER.id;
      }
    } else {
      // TODO: 프로덕션에서는 Supabase 세션에서 사용자 ID 가져오기
      return null;
    }

    const { data, error } = await serverSupabase
      .from('kols')
      .select('id')
      .eq('user_id', Number(userId))
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
    if (process.env.NODE_ENV === 'development') {
      // 개발환경에서는 기본 사용자로 인증 처리
      const role = DEFAULT_DEV_USER.role;

      // 역할 검증이 필요한 경우
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(role)) {
          console.error(`권한 부족: 요청된 역할 ${role}, 필요한 역할 ${allowedRoles.join(', ')}`);
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      }

      return null; // 인증 성공
    }

    // TODO: 프로덕션에서는 Supabase 세션 확인
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  } catch (error) {
    console.error('인증 검증 중 오류:', error);
    return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * Convex 기반 인증 확인 함수
 * API 라우트에서 사용하기 위한 서버사이드 인증 확인
 */
export async function checkAuthConvex(
  allowedRoles?: string[]
): Promise<{ user: any | null; profile: any | null }> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // 개발환경에서는 기존 개발 사용자 로직 사용
      let user: User;

      if (typeof window === 'undefined') {
        // 서버사이드: 쿠키에서 사용자 정보 읽기, 없으면 기본 사용자 사용
        user = (await getDevUserFromCookies()) || DEFAULT_DEV_USER;
        console.log('서버사이드 Convex 인증 - 사용자:', user);
      } else {
        // 클라이언트사이드: localStorage에서 사용자 정보 가져오기
        user = getDevUserFromLocalStorage() || DEFAULT_DEV_USER;
        console.log('클라이언트사이드 Convex 인증 - 사용자:', user);
      }

      // 역할 검증이 필요한 경우
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          console.error(
            `권한 부족: 요청된 역할 ${user.role}, 필요한 역할 ${allowedRoles.join(', ')}`
          );
          return { user: null, profile: null };
        }
      }

      // 개발환경에서는 Mock 사용자와 프로필 반환
      const mockProfile = {
        _id: `profile_${user.id}`,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: 'approved',
        shop_name: '개발용 매장',
        region: '서울',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      return {
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
        },
        profile: mockProfile,
      };
    }

    // 프로덕션에서는 Convex를 사용한 인증
    if (!convexClient) {
      console.error('Convex client not initialized');
      return { user: null, profile: null };
    }

    try {
      // TODO: 실제 프로덕션에서는 JWT 토큰 검증이 필요
      // const userWithProfile = await convexClient.query(api.auth.getCurrentUserWithProfile);
      // return userWithProfile;

      // 현재는 개발 단계이므로 null 반환
      return { user: null, profile: null };
    } catch (error) {
      console.error('Convex 인증 확인 중 오류:', error);
      return { user: null, profile: null };
    }
  } catch (error) {
    console.error('인증 검증 중 오류:', error);
    return { user: null, profile: null };
  }
}

/**
 * 기존 checkAuthSupabase 함수 - Convex로 점진적 마이그레이션을 위해 유지
 * @deprecated - checkAuthConvex 사용을 권장
 */
export async function checkAuthSupabase(allowedRoles?: string[]): Promise<{ user: User | null }> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // 개발환경에서는 서버사이드에서 쿠키 사용, 클라이언트사이드에서는 localStorage 사용
      let user: User;

      if (typeof window === 'undefined') {
        // 서버사이드: 쿠키에서 사용자 정보 읽기, 없으면 기본 사용자 사용
        user = (await getDevUserFromCookies()) || DEFAULT_DEV_USER;
        console.log('서버사이드 인증 - 사용자:', user);
      } else {
        // 클라이언트사이드: localStorage에서 사용자 정보 가져오기
        user = getDevUserFromLocalStorage() || DEFAULT_DEV_USER;
        console.log('클라이언트사이드 인증 - 사용자:', user);
      }

      // 역할 검증이 필요한 경우
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          console.error(
            `권한 부족: 요청된 역할 ${user.role}, 필요한 역할 ${allowedRoles.join(', ')}`
          );
          return { user: null };
        }
      }

      return { user };
    }

    // 프로덕션에서는 Convex 기반 인증으로 전환
    const convexResult = await checkAuthConvex(allowedRoles);
    return { user: convexResult.user };
  } catch (error) {
    console.error('인증 검증 중 오류:', error);
    return { user: null };
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
  checkAuthSupabase,
  checkAuthConvex, // 새로운 Convex 기반 인증 함수 추가
};

export default authHelpers;
