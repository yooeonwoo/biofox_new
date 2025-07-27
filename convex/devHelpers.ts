/**
 * 개발용 헬퍼 함수들
 * 개발 환경에서만 사용하는 도구들
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';

// 개발용: 프로필 직접 업데이트 (인증 없이)
export const devUpdateProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    updates: v.any(), // 간단하게 any 타입 사용
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, args.updates);
    return { success: true };
  },
});

// 개발용: 모든 프로필 조회
export const devGetAllProfiles = mutation({
  args: {},
  handler: async ctx => {
    const profiles = await ctx.db.query('profiles').collect();
    return profiles;
  },
});
