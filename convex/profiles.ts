import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// 모든 프로필 조회
export const getAllProfiles = query({
  args: {},
  handler: async ctx => {
    return await ctx.db.query('profiles').collect();
  },
});

// ID로 프로필 조회
export const getProfile = query({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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

// 이메일로 프로필 조회
export const getProfileByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_email', q => q.eq('email', args.email))
      .unique();
  },
});

// 새 프로필 생성
export const createProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
    shop_name: v.string(),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profileId = await ctx.db.insert('profiles', {
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
    });

    return profileId;
  },
});

// 프로필 업데이트
export const updateProfile = mutation({
  args: {
    id: v.id('profiles'),
    name: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    commission_rate: v.optional(v.number()),
    status: v.optional(v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // 빈 값 제거
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

// 프로필 승인
export const approveProfile = mutation({
  args: {
    id: v.id('profiles'),
    approved_by: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: 'approved',
      approved_at: Date.now(),
      approved_by: args.approved_by,
    });
    return args.id;
  },
});

// 프로필 삭제
export const deleteProfile = mutation({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
