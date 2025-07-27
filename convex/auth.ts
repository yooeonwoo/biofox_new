/**
 * Convex Auth 기반 인증 시스템 (하이브리드 모드)
 * 기존 Convex Auth와 새로운 Supabase Auth를 동시에 지원
 */

import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// =====================================
// Convex Auth 설정 (레거시 호환성)
// =====================================

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile: params => ({
        email: params.email as string,
        name: params.name as string,
      }),
    }),
  ],
});

// =====================================
// 권한 체크 헬퍼 함수들 (레거시 호환성)
// =====================================

export const requireAuth = async (ctx: any) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
};

export const requireAdmin = async (ctx: any) => {
  const userId = await requireAuth(ctx);

  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q: any) => q.eq('userId', userId))
    .unique();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return { userId, profile };
};

export const requireRole = async (ctx: any, allowedRoles: string[]) => {
  const userId = await requireAuth(ctx);

  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q: any) => q.eq('userId', userId))
    .unique();

  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }

  return { userId, profile };
};

// =====================================
// 주의: 새로운 코드는 supabaseAuth.ts 사용
// =====================================
// 이 파일은 기존 코드와의 호환성을 위해 유지됩니다.
// 새로운 기능은 다음 파일들을 사용하세요:
// - supabaseAuth.ts: Supabase 인증 통합
// - authHelpers.ts: 성능 최적화 헬퍼
