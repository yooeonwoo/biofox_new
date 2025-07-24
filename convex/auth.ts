/**
 * Convex Auth 기반 인증 시스템
 * JWT 토큰 기반 인증 및 사용자 프로필 관리
 */

import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import {
  validateProfileCreation,
  validateEmail,
  validateName,
  validateShopName,
  validateCommissionRate,
} from './validation';

// =====================================
// Convex Auth 설정
// =====================================

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // 이메일/패스워드 인증 설정
      profile: params => ({
        email: params.email as string,
        name: params.name as string,
      }),
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { existingUserId, userId }) {
      // 새 사용자 생성 시 프로필 자동 생성
      if (!existingUserId) {
        const user = await ctx.db.get(userId);
        if (user?.email) {
          await ctx.db.insert('profiles', {
            userId: userId,
            email: user.email,
            name: user.name || '이름 미입력',
            role: 'shop_owner', // 기본 역할
            status: 'pending',
            shop_name: '매장명 미입력',
            region: undefined,
            naver_place_link: undefined,
            commission_rate: undefined,
            total_subordinates: 0,
            active_subordinates: 0,
            metadata: {},
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        }
      }
    },
  },
});

// =====================================
// 사용자 프로필 관리 함수들
// =====================================

// 현재 인증된 사용자와 프로필 정보 조회
export const getCurrentUserWithProfile = query({
  args: {},
  handler: async ctx => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { user: null, profile: null };
    }

    // 사용자 정보 조회
    const user = await ctx.db.get(userId);
    if (!user) {
      return { user: null, profile: null };
    }

    // 사용자 프로필 조회
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .unique();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      profile: profile
        ? {
            _id: profile._id,
            userId: profile.userId,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            status: profile.status,
            shop_name: profile.shop_name,
            region: profile.region,
            naver_place_link: profile.naver_place_link,
            commission_rate: profile.commission_rate,
            total_subordinates: profile.total_subordinates,
            active_subordinates: profile.active_subordinates,
            approved_at: profile.approved_at,
            approved_by: profile.approved_by,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          }
        : null,
    };
  },
});

// 프로필 완성도 조회 (인증된 사용자만)
export const getProfileCompleteness = query({
  args: {},
  handler: async ctx => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null; // 인증되지 않은 경우 null 반환 (예외 던지지 않음)
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
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

// 사용자 프로필 생성/확인 함수 (회원가입용)
export const ensureUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
    shop_name: v.string(),
    display_name: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // 입력 검증
    if (!validateEmail(args.email)) {
      throw new Error('Invalid email format');
    }

    if (!validateName(args.name)) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!validateShopName(args.shop_name)) {
      throw new Error('Shop name must be at least 2 characters long');
    }

    // 기존 프로필 확인
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .unique();

    const now = Date.now();

    if (existingProfile) {
      // 기존 프로필 업데이트
      await ctx.db.patch(existingProfile._id, {
        email: args.email,
        name: args.display_name || args.name,
        role: args.role,
        shop_name: args.shop_name,
        region: args.region,
        updated_at: now,
      });
      return existingProfile._id;
    } else {
      // 새 프로필 생성
      const profileId = await ctx.db.insert('profiles', {
        userId: userId,
        email: args.email,
        name: args.display_name || args.name,
        role: args.role,
        status: 'pending',
        shop_name: args.shop_name,
        region: args.region,
        naver_place_link: undefined,
        commission_rate: undefined,
        total_subordinates: 0,
        active_subordinates: 0,
        metadata: {},
        created_at: now,
        updated_at: now,
      });
      return profileId;
    }
  },
});

// 사용자 프로필 업데이트 (보안 검증 포함)
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    display_name: v.optional(v.string()),
    bio: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
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
    if (args.display_name !== undefined) updateData.name = args.display_name;
    if (args.shop_name !== undefined) updateData.shop_name = args.shop_name;
    if (args.region !== undefined) updateData.region = args.region;
    if (args.naver_place_link !== undefined) updateData.naver_place_link = args.naver_place_link;

    await ctx.db.patch(profile._id, updateData);

    return profile._id;
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
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // 📋 커미션율 검증
    if (args.commission_rate !== undefined && !validateCommissionRate(args.commission_rate)) {
      throw new Error('Commission rate must be between 0 and 100');
    }

    // 관리자 권한 확인
    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
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

// 온라인 상태 업데이트
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
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
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // 📋 유효한 일수 검증
    if (args.days <= 0 || args.days > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    // 관리자 권한 확인
    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
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

// =====================================
// 권한 체크 헬퍼 함수들
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
    .withIndex('by_userId', q => q.eq('userId', userId))
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
    .withIndex('by_userId', q => q.eq('userId', userId))
    .unique();

  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }

  return { userId, profile };
};

// =====================================
// 사용자 관리 함수들 (관리자용)
// =====================================

export const getAllUsers = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const page = args.page || 1;
    const limit = args.limit || 20;

    let profilesQuery = ctx.db.query('profiles');

    // 역할별 필터링
    if (args.role) {
      profilesQuery = profilesQuery.filter(q => q.eq(q.field('role'), args.role));
    }

    // 상태별 필터링
    if (args.status) {
      profilesQuery = profilesQuery.filter(q => q.eq(q.field('status'), args.status));
    }

    let profiles = await profilesQuery.collect();

    // 검색 필터링
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      profiles = profiles.filter(
        profile =>
          profile.name?.toLowerCase().includes(searchTerm) ||
          profile.email.toLowerCase().includes(searchTerm) ||
          profile.shop_name?.toLowerCase().includes(searchTerm)
      );
    }

    // 페이지네이션
    const total = profiles.length;
    const start = (page - 1) * limit;
    const paginatedProfiles = profiles.slice(start, start + limit);

    return {
      data: paginatedProfiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
});

export const updateUserRole = mutation({
  args: {
    profileId: v.id('profiles'),
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.profileId, {
      role: args.role,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
