import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import {
  validateProfileCreation,
  validateEmail,
  validateName,
  validateShopName,
  validateCommissionRate,
} from './validation';

// 사용자 프로필 자동 생성 (Auth 시스템과 연동)
export const ensureUserProfile = mutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
    name: v.string(),
    role: v.optional(
      v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner'))
    ),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 기존 프로필 확인
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .unique();

    if (existingProfile) {
      return existingProfile._id;
    }

    // 📋 데이터 검증
    const validation = validateProfileCreation({
      email: args.email,
      name: args.name,
      shop_name: args.shop_name || '매장명 미입력',
      commission_rate: args.commission_rate,
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();

    // 새 프로필 생성
    const profileId = await ctx.db.insert('profiles', {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: args.role || 'shop_owner',
      status: 'pending',
      shop_name: args.shop_name || '매장명 미입력',
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

// 프로필 완성도 조회
export const getProfileCompleteness = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .unique();

    if (!profile) {
      return null;
    }

    // 필수 필드 정의
    const requiredFields = ['name', 'shop_name', 'region'] as const;
    const missingFields = requiredFields.filter(field => !profile[field]);

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage: Math.round(
        ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
      ),
    };
  },
});

// 관리자의 사용자 승인
export const approveUserProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    approved: v.boolean(),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 📋 커미션율 검증
    if (args.commission_rate !== undefined && !validateCommissionRate(args.commission_rate)) {
      throw new Error('Commission rate must be between 0 and 100');
    }

    // 관리자 권한 확인
    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
      .unique();

    if (!adminProfile || adminProfile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const now = Date.now();

    await ctx.db.patch(args.profileId, {
      status: args.approved ? 'approved' : 'rejected',
      approved_at: args.approved ? now : undefined,
      approved_by: adminProfile._id,
      commission_rate: args.commission_rate,
      updated_at: now,
    });

    return { success: true };
  },
});

// 사용자 프로필 업데이트 (보안 검증 포함)
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // 📋 개별 필드 검증
    if (args.name !== undefined && !validateName(args.name)) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (args.shop_name !== undefined && !validateShopName(args.shop_name)) {
      throw new Error('Shop name must be at least 2 characters long');
    }

    const now = Date.now();

    const updateData: any = {
      updated_at: now,
    };

    // 제공된 필드들만 업데이트
    if (args.name !== undefined) updateData.name = args.name;
    if (args.shop_name !== undefined) updateData.shop_name = args.shop_name;
    if (args.region !== undefined) updateData.region = args.region;
    if (args.naver_place_link !== undefined) updateData.naver_place_link = args.naver_place_link;

    await ctx.db.patch(profile._id, updateData);

    return { success: true };
  },
});

// 온라인 상태 업데이트
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const now = Date.now();

    await ctx.db.patch(profile._id, {
      updated_at: now,
    });

    return { success: true };
  },
});

// 비활성 사용자 조회 (관리자 전용)
export const getInactiveUsers = query({
  args: {
    days: v.number(), // 비활성 기간 (일)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 📋 유효한 일수 검증
    if (args.days <= 0 || args.days > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    // 관리자 권한 확인
    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
      .unique();

    if (!adminProfile || adminProfile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const cutoffTime = Date.now() - args.days * 24 * 60 * 60 * 1000;

    // 비활성 사용자 조회 (updated_at 기준)
    const inactiveUsers = await ctx.db
      .query('profiles')
      .filter(q => q.lt(q.field('updated_at'), cutoffTime))
      .collect();

    return inactiveUsers.map(profile => ({
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      shop_name: profile.shop_name,
      role: profile.role,
      status: profile.status,
      updated_at: profile.updated_at,
    }));
  },
});
