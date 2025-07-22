import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// 현재 인증된 사용자와 프로필 정보 조회
export const getCurrentUserWithProfile = query({
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // identity.subject를 사용해서 사용자 찾기
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('_id'), identity.subject))
      .first();

    if (!user) {
      // 사용자가 없으면 identity 정보로 기본 사용자 정보 반환
      return {
        user: {
          _id: identity.subject,
          name: identity.name,
          email: identity.email,
          image: identity.pictureUrl,
        },
        profile: null,
      };
    }

    // 연결된 비즈니스 프로필 찾기
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', user._id))
      .first();

    return {
      user,
      profile,
    };
  },
});

// 인증 시 자동으로 사용자 프로필 생성 또는 반환
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
    // 인증된 사용자 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // identity.subject로 직접 사용자 ID 사용 (타입 단언)
    const userId = identity.subject as Id<'users'>;

    // 이미 프로필이 있는지 확인
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // 새 프로필 생성
    const profileId = await ctx.db.insert('profiles', {
      userId: userId,
      email: args.email,
      name: args.name,
      display_name: args.display_name || args.name,
      role: args.role,
      status: 'pending', // 기본값은 승인 대기
      shop_name: args.shop_name,
      region: args.region,
      created_at: Date.now(),
      last_active: Date.now(),
    });

    return profileId;
  },
});

// 사용자 프로필 업데이트 (보안 검증 포함)
export const updateUserProfile = mutation({
  args: {
    display_name: v.optional(v.string()),
    bio: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // identity.subject로 직접 사용자 ID 사용 (타입 단언)
    const userId = identity.subject as Id<'users'>;

    // 사용자의 프로필 찾기
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // 프로필 업데이트 - 빈 객체여도 last_active는 항상 업데이트
    const updateData: Record<string, any> = {
      last_active: Date.now(), // 모든 업데이트에서 활성 시간 갱신
    };

    // 선택적 필드 업데이트
    if (args.display_name !== undefined) updateData.display_name = args.display_name;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.profile_image_url !== undefined) updateData.profile_image_url = args.profile_image_url;
    if (args.shop_name !== undefined) updateData.shop_name = args.shop_name;
    if (args.region !== undefined) updateData.region = args.region;
    if (args.naver_place_link !== undefined) updateData.naver_place_link = args.naver_place_link;

    await ctx.db.patch(profile._id, updateData);

    return profile._id;
  },
});

// 프로필 완성도 확인
export const getProfileCompleteness = query({
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject as Id<'users'>;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (!profile) {
      return { completeness: 0, missingFields: ['All profile fields'] };
    }

    // 필수 필드들 정의
    const requiredFields = [
      'display_name',
      'bio',
      'profile_image_url',
      'shop_name',
      'region',
    ] as const;

    const missingFields = requiredFields.filter(field => !profile[field]);
    const completeness = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    );

    return {
      completeness,
      missingFields,
    };
  },
});

// 관리자용: 사용자 프로필 승인
export const approveUserProfile = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 현재 사용자의 프로필 확인 (관리자 권한 체크)
    const userId = identity.subject as Id<'users'>;

    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (!adminProfile || adminProfile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // 대상 프로필 승인
    await ctx.db.patch(args.profileId, {
      status: 'approved',
      approved_at: Date.now(),
      approved_by: adminProfile._id,
    });

    return args.profileId;
  },
});

// 사용자 온라인 상태 업데이트
export const updateOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const userId = identity.subject as Id<'users'>;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // 온라인 상태 및 활성 시간 업데이트
    await ctx.db.patch(profile._id, {
      last_active: Date.now(),
      metadata: {
        ...profile.metadata,
        isOnline: args.isOnline,
      },
    });

    return profile._id;
  },
});

// 비활성 사용자 조회 (관리자용)
export const getInactiveUsers = query({
  args: {
    inactiveDays: v.optional(v.number()), // 기본값: 30일
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 관리자 권한 확인
    const userId = identity.subject as Id<'users'>;
    const adminProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();

    if (!adminProfile || adminProfile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const inactiveDays = args.inactiveDays || 30;
    const cutoffTime = Date.now() - inactiveDays * 24 * 60 * 60 * 1000;

    // 비활성 사용자 조회
    const inactiveUsers = await ctx.db
      .query('profiles')
      .filter(q =>
        q.and(
          q.neq(q.field('role'), 'admin'), // 관리자 제외
          q.lt(q.field('last_active'), cutoffTime) // 비활성 기간
        )
      )
      .collect();

    return inactiveUsers;
  },
});
