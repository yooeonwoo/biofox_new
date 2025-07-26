/**
 * Supabase JWT 검증 및 성능 최적화 헬퍼
 *
 * Convex 함수에서 Supabase 인증을 효율적으로 처리하기 위한 헬퍼 함수들
 */

import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// 메모리 캐시: Supabase userId -> Convex profile 매핑
const profileCache = new Map<string, { profile: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * Supabase userId로 프로필을 조회하고 캐싱
 * 성능 최적화를 위해 5분간 캐시 유지
 */
export const getCachedProfile = async (ctx: any, supabaseUserId: string) => {
  // 캐시 확인
  const cached = profileCache.get(supabaseUserId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.profile;
  }

  // DB에서 조회
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_supabaseUserId', (q: any) => q.eq('supabaseUserId', supabaseUserId))
    .unique();

  // 캐시 저장
  if (profile) {
    profileCache.set(supabaseUserId, {
      profile,
      timestamp: Date.now(),
    });
  }

  return profile;
};

/**
 * 캐시 무효화
 * 프로필이 업데이트되었을 때 호출
 */
export const invalidateProfileCache = (supabaseUserId: string) => {
  profileCache.delete(supabaseUserId);
};

/**
 * 전체 캐시 클리어
 */
export const clearProfileCache = () => {
  profileCache.clear();
};

/**
 * 요청 컨텍스트에서 Supabase 사용자 ID 추출
 * (클라이언트에서 전달받은 경우)
 */
export const getSupabaseUserIdFromContext = (ctx: any): string | null => {
  // 클라이언트에서 전달받은 사용자 정보
  // 실제 구현시 헤더나 토큰에서 추출
  return null;
};

/**
 * 권한 체크 헬퍼 (캐싱 활용)
 */
export const requireAuthWithCache = async (ctx: any, supabaseUserId: string) => {
  const profile = await getCachedProfile(ctx, supabaseUserId);

  if (!profile) {
    throw new Error('Profile not found');
  }

  if (profile.status !== 'approved') {
    throw new Error('Profile not approved');
  }

  return profile;
};

/**
 * 역할 기반 권한 체크 (캐싱 활용)
 */
export const requireRoleWithCache = async (
  ctx: any,
  supabaseUserId: string,
  allowedRoles: string[]
) => {
  const profile = await requireAuthWithCache(ctx, supabaseUserId);

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }

  return profile;
};

/**
 * 관리자 권한 체크 (캐싱 활용)
 */
export const requireAdminWithCache = async (ctx: any, supabaseUserId: string) => {
  return requireRoleWithCache(ctx, supabaseUserId, ['admin']);
};
