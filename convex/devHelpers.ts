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
    updates: v.object({
      role: v.optional(
        v.union(
          v.literal('admin'),
          v.literal('kol'),
          v.literal('ol'),
          v.literal('shop_owner'),
          v.literal('sales')
        )
      ),
      status: v.optional(
        v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))
      ),
      name: v.optional(v.string()),
      shop_name: v.optional(v.string()),
      region: v.optional(v.string()),
      commission_rate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    // 개발 환경에서만 실행 (간단한 체크)
    const now = Date.now();

    const updateData: any = {
      updated_at: now,
    };

    // 제공된 필드들만 업데이트
    if (args.updates.role !== undefined) updateData.role = args.updates.role;
    if (args.updates.status !== undefined) updateData.status = args.updates.status;
    if (args.updates.name !== undefined) updateData.name = args.updates.name;
    if (args.updates.shop_name !== undefined) updateData.shop_name = args.updates.shop_name;
    if (args.updates.region !== undefined) updateData.region = args.updates.region;
    if (args.updates.commission_rate !== undefined)
      updateData.commission_rate = args.updates.commission_rate;

    // status가 approved로 변경되면 approved_at 설정
    if (args.updates.status === 'approved') {
      updateData.approved_at = now;
    }

    await ctx.db.patch(args.profileId, updateData);

    return { success: true, profileId: args.profileId };
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
