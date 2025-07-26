/**
 * Supabase Auth 통합 함수들
 * Supabase JWT 검증 및 Convex 프로필 연동
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { getCachedProfile, invalidateProfileCache } from './authHelpers';

// Supabase 프로필 동기화
export const syncSupabaseProfile = mutation({
  args: {
    supabaseUserId: v.string(),
    email: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // 기존 프로필 확인 (supabaseUserId로)
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .unique();

    const now = Date.now();

    if (existingProfile) {
      // 기존 프로필 업데이트
      await ctx.db.patch(existingProfile._id, {
        email: args.email,
        updated_at: now,
      });
      return existingProfile._id;
    } else {
      // 새 프로필 생성
      const profileId = await ctx.db.insert('profiles', {
        supabaseUserId: args.supabaseUserId,
        userId: undefined, // Convex Auth는 사용하지 않음
        email: args.email,
        name: args.metadata?.name || args.metadata?.display_name || '이름 미입력',
        role: args.metadata?.role || 'shop_owner',
        status: 'pending',
        shop_name: args.metadata?.shop_name || '매장명 미입력',
        region: args.metadata?.region,
        naver_place_link: undefined,
        commission_rate: undefined,
        total_subordinates: 0,
        active_subordinates: 0,
        metadata: args.metadata || {},
        created_at: now,
        updated_at: now,
      });
      return profileId;
    }
  },
});

// Supabase userId로 프로필 조회 (캐싱 활용)
export const getProfileBySupabaseId = query({
  args: {
    supabaseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // 캐시된 프로필 먼저 확인
    const profile = await getCachedProfile(ctx, args.supabaseUserId);

    if (!profile) {
      return null;
    }

    return {
      _id: profile._id,
      supabaseUserId: profile.supabaseUserId,
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
    };
  },
});

// 프로필 완성도 체크 (Supabase 버전)
export const getProfileCompletenessBySupabaseId = query({
  args: {
    supabaseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
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

// 프로필 업데이트 (Supabase 버전)
export const updateProfileBySupabaseId = mutation({
  args: {
    supabaseUserId: v.string(),
    name: v.optional(v.string()),
    shop_name: v.optional(v.string()),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.supabaseUserId))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const updateData: any = {
      updated_at: Date.now(),
    };

    // 제공된 필드들만 업데이트
    if (args.name !== undefined) updateData.name = args.name;
    if (args.shop_name !== undefined) updateData.shop_name = args.shop_name;
    if (args.region !== undefined) updateData.region = args.region;
    if (args.naver_place_link !== undefined) updateData.naver_place_link = args.naver_place_link;

    await ctx.db.patch(profile._id, updateData);

    // 캐시 무효화
    invalidateProfileCache(args.supabaseUserId);

    return profile._id;
  },
});

// 관리자 권한 체크 (Supabase 버전)
export const requireAdminBySupabaseId = async (ctx: any, supabaseUserId: string) => {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_supabaseUserId', (q: any) => q.eq('supabaseUserId', supabaseUserId))
    .unique();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return profile;
};

// 역할 체크 (Supabase 버전)
export const requireRoleBySupabaseId = async (
  ctx: any,
  supabaseUserId: string,
  allowedRoles: string[]
) => {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_supabaseUserId', (q: any) => q.eq('supabaseUserId', supabaseUserId))
    .unique();

  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }

  return profile;
};
