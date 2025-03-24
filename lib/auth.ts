import { NextRequest, NextResponse } from 'next/server';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, kols } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { serverSupabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { cookies } from 'next/headers';

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

// 메모리 캐시 구현
const roleCache = new Map<string, { role: string | null, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1분 캐시

/**
 * 클라이언트 컴포넌트(레이아웃 등)에서 사용할 사용자 역할 조회 함수
 * Clerk publicMetadata에서 역할을 가져옵니다.
 * 
 * @param clerkUserId Clerk 사용자 ID
 * @returns 사용자 역할 또는 null
 */
export async function getClientRole(clerkUserId: string | null): Promise<string | null> {
  if (!clerkUserId) {
    return null;
  }
  
  // 캐시에서 역할 확인
  const cachedData = roleCache.get(clerkUserId);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
    console.log('캐시된 사용자 역할 사용:', clerkUserId);
    return cachedData.role;
  }
  
  console.log('Clerk에서 사용자 역할 조회 중:', clerkUserId);
  try {
    // Clerk에서 현재 사용자 정보 가져오기
    const user = await currentUser();
    if (!user) {
      console.error('Clerk에서 사용자 정보를 찾을 수 없음:', clerkUserId);
      roleCache.set(clerkUserId, { role: null, timestamp: now });
      return null;
    }
    
    // Clerk publicMetadata에서 역할 가져오기
    const role = user.publicMetadata?.role as string | undefined;
    
    // 캐시 업데이트
    roleCache.set(clerkUserId, { role: role || null, timestamp: now });
    return role || null;
  } catch (error) {
    console.error('Clerk에서 사용자 역할 조회 중 오류:', error);
    return null;
  }
}

// [로그인 전용] Clerk를 통한 인증 함수
export async function getAuth(request?: NextRequest): Promise<{userId: string | null, role: string | null}> {
  try {
    // Clerk의 auth 사용하여 userId와 세션 정보 가져오기
    const { userId, sessionClaims } = await clerkAuth();
    
    if (!userId) {
      return { userId: null, role: null };
    }
    
    // Clerk 세션 정보에서 역할 확인
    const metadata = sessionClaims?.metadata as Record<string, unknown> || {};
    const role = metadata.role as string | undefined;
    
    return { userId, role: role || null };
  } catch (error) {
    console.error('인증 정보 확인 중 오류:', error);
    return { userId: null, role: null };
  }
}

/**
 * [로그인 전용] Clerk 기반 인증 검증 유틸리티 함수
 */
export async function checkAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<NextResponse | null> {
  try {
    // 사용자 인증 확인
    const { userId, role } = await getAuth();
    
    // 인증되지 않은 경우
    if (!userId) {
      console.error('인증되지 않은 사용자의 API 접근');
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // 역할 검증이 필요한 경우
    if (allowedRoles && allowedRoles.length > 0) {
      if (!role || !allowedRoles.includes(role)) {
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

/**
 * [모든 API용] Supabase를 통한 인증 함수
 * Supabase 세션을 사용하여 사용자의 인증 정보와 역할을 가져옵니다.
 * 
 * @returns 사용자 ID와 역할 정보
 */
export async function getAuthSupabase(): Promise<{userId: string | null, role: string | null, email: string | null}> {
  try {
    // Supabase에서 현재 사용자 정보 가져오기
    const { data: { user }, error } = await serverSupabase.auth.getUser();
    
    if (error || !user) {
      console.error('Supabase 사용자 정보 가져오기 실패:', error);
      return { userId: null, role: null, email: null };
    }
    
    // 사용자 이메일이 없는 경우
    if (!user.email) {
      console.error('Supabase 사용자 이메일이 없음:', user.id);
      return { userId: user.id, role: null, email: null };
    }
    
    // 사용자 이메일로 DB에서 역할 정보 조회
    const userInfo = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });
    
    if (!userInfo) {
      console.error('사용자 정보를 DB에서 찾을 수 없음:', user.email);
      return { userId: user.id, role: null, email: user.email };
    }
    
    return { 
      userId: user.id, 
      role: userInfo.role, 
      email: user.email 
    };
  } catch (error) {
    console.error('Supabase 인증 정보 확인 중 오류:', error);
    return { userId: null, role: null, email: null };
  }
}

/**
 * [모든 API용] Clerk와 DB를 사용한 인증 검증 유틸리티 함수
 * Supabase 세션 문제를 해결하기 위해 Clerk 인증을 사용하고 DB에서 직접 역할을 조회합니다.
 * 
 * @param allowedRoles 허용할 역할 목록 (선택적)
 * @returns 응답 객체 또는 null (인증 성공 시)
 */
export async function checkAuthSupabase(
  allowedRoles?: string[]
): Promise<NextResponse | {userId: string, role: string, email: string} | null> {
  try {
    // Clerk에서 현재 사용자 정보 가져오기
    const user = await currentUser();
    
    // 인증되지 않은 경우
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      console.error('인증되지 않은 사용자의 API 접근');
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // 사용자 기본 이메일 주소 가져오기
    const primaryEmail = user.emailAddresses[0].emailAddress;
    
    // DB에서 사용자 정보와 역할 조회 (supabaseAdmin 또는 직접 db 쿼리 사용)
    const userInfo = await db.query.users.findFirst({
      where: eq(users.email, primaryEmail),
    });
    
    if (!userInfo) {
      console.error('사용자 정보를 DB에서 찾을 수 없음:', primaryEmail);
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 역할 검증이 필요한 경우
    if (allowedRoles && allowedRoles.length > 0) {
      if (!userInfo.role || !allowedRoles.includes(userInfo.role)) {
        console.error(`권한 부족: 요청된 역할 ${userInfo.role}, 필요한 역할 ${allowedRoles.join(', ')}`);
        return NextResponse.json(
          { error: "접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    }
    
    // 인증 및 권한 검증 성공 - 사용자 정보 반환
    return { 
      userId: user.id, 
      role: userInfo.role as string,
      email: primaryEmail 
    };
  } catch (error) {
    console.error('인증 검증 중 오류:', error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * KOL의 ID를 가져오는 유틸리티 함수
 * 
 * @param userId 사용자 ID
 * @returns KOL ID 또는 null
 */
export async function getKolId(userId: string): Promise<number | null> {
  try {
    // 사용자 정보 조회
    const userInfo = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!userInfo) {
      return null;
    }

    // KOL 정보 조회
    const kol = await db.query.kols.findFirst({
      where: eq(kols.userId, userInfo.id),
    });

    return kol ? kol.id : null;
  } catch (error) {
    console.error('KOL ID 조회 중 오류:', error);
    return null;
  }
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
  checkAuth,
  getAuthSupabase,
  checkAuthSupabase,
  getKolId,
  getClientRole,
};

export default authExports; 