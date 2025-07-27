/**
 * Supabase Auth와 Convex 프로필을 연결하는 함수들
 * Supabase로 로그인한 사용자의 Convex 프로필을 관리합니다.
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * Supabase 사용자 ID로 프로필 조회
 *
 * @param supabaseUserId - Supabase Auth에서 발급한 사용자 UUID
 * @returns 해당 사용자의 Convex 프로필 또는 null
 */
export const getProfileBySupabaseId = query({
  args: {
    supabaseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .first();
  },
});

/**
 * Supabase 프로필 동기화
 *
 * Supabase 사용자 정보를 기반으로 Convex 프로필을 생성하거나 업데이트합니다.
 *
 * @param supabaseUserId - Supabase Auth 사용자 ID
 * @param email - 사용자 이메일
 * @param metadata - 추가 사용자 정보 (이름, 전화번호 등)
 */
export const syncSupabaseProfile = mutation({
  args: {
    supabaseUserId: v.string(),
    email: v.string(),
    metadata: v.optional(
      v.object({
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        shop_name: v.optional(v.string()),
        region: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 기존 프로필 확인
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .first();

    if (existingProfile) {
      // 기존 프로필 업데이트
      await ctx.db.patch(existingProfile._id, {
        email: args.email,
        updated_at: now,
        // 메타데이터가 제공된 경우에만 업데이트
        ...(args.metadata?.name && { name: args.metadata.name }),
        ...(args.metadata?.phone && { phone: args.metadata.phone }),
        ...(args.metadata?.shop_name && { shop_name: args.metadata.shop_name }),
        ...(args.metadata?.region && { region: args.metadata.region }),
      });

      return existingProfile._id;
    }

    // 이메일로 기존 프로필 확인 (마이그레이션 케이스)
    const profileByEmail = await ctx.db
      .query('profiles')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (profileByEmail && !profileByEmail.supabaseUserId) {
      // 기존 프로필에 Supabase ID 연결
      await ctx.db.patch(profileByEmail._id, {
        supabaseUserId: args.supabaseUserId,
        updated_at: now,
      });

      return profileByEmail._id;
    }

    // 새 프로필 생성
    const newProfileId = await ctx.db.insert('profiles', {
      supabaseUserId: args.supabaseUserId,
      email: args.email,
      name: args.metadata?.name || args.email.split('@')[0],
      role: (args.metadata?.role as any) || 'shop_owner',
      status: 'pending',
      shop_name: args.metadata?.shop_name || '',
      region: args.metadata?.region,
      created_at: now,
      updated_at: now,
    });

    return newProfileId;
  },
});

/**
 * 기존 프로필 마이그레이션
 *
 * 이메일로만 연결된 기존 프로필에 Supabase ID를 추가합니다.
 *
 * @param email - 사용자 이메일
 * @param supabaseUserId - Supabase Auth 사용자 ID
 */
export const migrateExistingProfile = mutation({
  args: {
    email: v.string(),
    supabaseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (!profile) {
      throw new Error(`Profile not found for email: ${args.email}`);
    }

    if (profile.supabaseUserId && profile.supabaseUserId !== args.supabaseUserId) {
      throw new Error('Profile already linked to a different Supabase user');
    }

    if (!profile.supabaseUserId) {
      await ctx.db.patch(profile._id, {
        supabaseUserId: args.supabaseUserId,
        updated_at: Date.now(),
      });
    }

    return profile._id;
  },
});

/**
 * 프로필 승인 상태 확인
 *
 * @param supabaseUserId - Supabase Auth 사용자 ID
 * @returns 프로필 승인 여부 및 상태 정보
 */
export const checkProfileApproval = query({
  args: {
    supabaseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .first();

    if (!profile) {
      return {
        exists: false,
        approved: false,
        status: null,
        role: null,
      };
    }

    return {
      exists: true,
      approved: profile.status === 'approved',
      status: profile.status,
      role: profile.role,
      profileId: profile._id,
    };
  },
});

/**
 * 프로필 업데이트
 *
 * 사용자가 자신의 프로필 정보를 업데이트합니다.
 *
 * @param supabaseUserId - Supabase Auth 사용자 ID
 * @param updates - 업데이트할 프로필 정보
 */
export const updateProfile = mutation({
  args: {
    supabaseUserId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      shop_name: v.optional(v.string()),
      region: v.optional(v.string()),
      naver_place_link: v.optional(v.string()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .first();

    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.patch(profile._id, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return profile._id;
  },
});
