import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// 모든 프로필 조회 (관리자 전용)
export const getAllProfiles = query({
  handler: async ctx => {
    return await ctx.db.query('profiles').collect();
  },
});

// ID로 프로필 조회
export const getProfileById = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

// 역할별 프로필 조회
export const getProfilesByRole = query({
  args: {
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_role', q => q.eq('role', args.role))
      .collect();
  },
});

// 이메일로 프로필 조회 (실제 인증 시스템용)
export const getProfileByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();
  },
});

// 승인 대기 중인 프로필 조회
export const getPendingProfiles = query({
  handler: async ctx => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_status', q => q.eq('status', 'pending'))
      .collect();
  },
});

// 새 프로필 생성
export const createProfile = mutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
    shop_name: v.string(),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const profileId = await ctx.db.insert('profiles', {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: args.role,
      status: 'pending', // 기본값
      shop_name: args.shop_name,
      region: args.region,
      naver_place_link: args.naver_place_link,
      commission_rate: args.commission_rate,
      total_subordinates: 0,
      active_subordinates: 0,
      metadata: {},
      created_at: now,
      updated_at: now,
    });

    return profileId;
  },
});

// 프로필 업데이트
export const updateProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    name: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updateData } = args;

    const now = Date.now();
    const updateFields: any = {
      updated_at: now,
    };

    // 제공된 필드들만 업데이트
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.shop_name !== undefined) updateFields.shop_name = updateData.shop_name;
    if (updateData.region !== undefined) updateFields.region = updateData.region;
    if (updateData.naver_place_link !== undefined)
      updateFields.naver_place_link = updateData.naver_place_link;
    if (updateData.commission_rate !== undefined)
      updateFields.commission_rate = updateData.commission_rate;

    await ctx.db.patch(profileId, updateFields);

    return profileId;
  },
});

// 프로필 삭제
export const deleteProfile = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.profileId);
    return { success: true };
  },
});

// 프로필 승인/거절
export const approveProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    approved: v.boolean(),
    approvedBy: v.id('profiles'),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.profileId, {
      status: args.approved ? 'approved' : 'rejected',
      approved_at: args.approved ? now : undefined,
      approved_by: args.approvedBy,
      commission_rate: args.commission_rate,
      updated_at: now,
    });

    return { success: true };
  },
});
