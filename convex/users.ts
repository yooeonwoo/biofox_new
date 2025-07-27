/**
 * 사용자 관리 (User Management) Query Functions
 * 기존 /api/users/* 엔드포인트를 대체하는 Convex Query 함수들
 */

import { query } from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import {
  requireAdmin,
  getCurrentUser,
  validateDateRange,
  validatePaginationOpts,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 사용자 목록 조회 (페이지네이션 및 필터링 지원)
 * 기존 GET /api/users 대체
 */
export const listUsers = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    search: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner'))
    ),
    status: v.optional(v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
    createdFrom: v.optional(v.string()), // ISO date string
    createdTo: v.optional(v.string()), // ISO date string

    // 정렬 옵션
    sortBy: v.optional(
      v.union(v.literal('created_at'), v.literal('name'), v.literal('email'), v.literal('status'))
    ),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 입력 검증
      validatePaginationOpts(args.paginationOpts);
      validateDateRange(args.createdFrom, args.createdTo);

      // 검색어 길이 검증
      if (args.search && args.search.length > 100) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          '검색어는 100자 이하로 입력해주세요.',
          400
        );
      }

      // 기본 쿼리 시작 - 역할별 필터링이 있으면 해당 인덱스 사용
      let orderedQuery;
      if (args.role) {
        orderedQuery = ctx.db
          .query('profiles')
          .withIndex('by_role', q => q.eq('role', args.role!))
          .order(args.sortOrder || 'desc');
      } else {
        // 그렇지 않으면 생성일 인덱스 사용
        orderedQuery = ctx.db
          .query('profiles')
          .withIndex('by_created_at')
          .order(args.sortOrder || 'desc');
      }

      // 텍스트 검색 필터 (간단한 contains 검색)
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        orderedQuery = orderedQuery.filter(q =>
          q.or(
            q.gte(q.field('name'), searchLower),
            q.gte(q.field('email'), searchLower),
            q.gte(q.field('shop_name'), searchLower)
          )
        );
      }

      // 상태 필터
      if (args.status) {
        orderedQuery = orderedQuery.filter(q => q.eq(q.field('status'), args.status!));
      }

      // 날짜 범위 필터
      if (args.createdFrom) {
        const fromDate = new Date(args.createdFrom).getTime();
        orderedQuery = orderedQuery.filter(q => q.gte(q.field('_creationTime'), fromDate));
      }

      if (args.createdTo) {
        const toDate = new Date(args.createdTo).getTime();
        orderedQuery = orderedQuery.filter(q => q.lte(q.field('_creationTime'), toDate));
      }

      // 페이지네이션 실행
      const result = await orderedQuery.paginate(args.paginationOpts);

      // 결과 변환 (민감한 정보 제외)
      const transformedUsers = result.page.map((user: any) => ({
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        shop_name: user.shop_name,
        region: user.region,
        commission_rate: user.commission_rate,
        total_subordinates: user.total_subordinates || 0,
        active_subordinates: user.active_subordinates || 0,
        naver_place_link: user.naver_place_link,
        approved_at: user.approved_at,
        created_at: user._creationTime,
        updated_at: user._creationTime,
      }));

      return {
        page: transformedUsers,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 특정 사용자 상세 조회
 * 기존 GET /api/users/[userId] 대체
 */
export const getUserById = query({
  args: {
    userId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 사용자 조회
      const user = await ctx.db.get(args.userId);

      if (!user) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.', 404);
      }

      // 결과 변환
      return {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        shop_name: user.shop_name,
        region: user.region,
        commission_rate: user.commission_rate,
        total_subordinates: user.total_subordinates || 0,
        active_subordinates: user.active_subordinates || 0,
        naver_place_link: user.naver_place_link,
        approved_at: user.approved_at,
        created_at: user._creationTime,
        updated_at: user._creationTime,
        metadata: user.metadata,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 사용자 검색 (자동완성용)
 * 이름, 이메일, 전문점명으로 검색
 */
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()), // 기본 10개
    role: v.optional(
      v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner'))
    ),
  },
  handler: async (ctx, args) => {
    try {
      // 인증 확인
      await getCurrentUser(ctx);

      // 검색어 검증
      if (args.searchTerm.length < 2) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          '검색어는 최소 2자 이상 입력해주세요.',
          400
        );
      }

      if (args.searchTerm.length > 50) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '검색어는 50자 이하로 입력해주세요.', 400);
      }

      const limit = Math.min(args.limit || 10, 50); // 최대 50개로 제한

      // 기본 쿼리로 검색 (전체 테이블 스캔)
      let query = ctx.db.query('profiles').withIndex('by_status', q => q.eq('status', 'approved'));

      // 역할 필터 추가
      if (args.role) {
        query = query.filter(q => q.eq(q.field('role'), args.role!));
      }

      // 텍스트 필터 추가
      const searchLower = args.searchTerm.toLowerCase();
      query = query.filter(q =>
        q.or(
          q.gte(q.field('name'), searchLower),
          q.gte(q.field('email'), searchLower),
          q.gte(q.field('shop_name'), searchLower)
        )
      );

      const results = await query.take(limit);

      // 결과 변환 (기본 정보만)
      return results.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        shop_name: user.shop_name,
        role: user.role,
      }));
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 사용자 통계 조회
 * 대시보드용 요약 정보
 */
export const getUserStats = query({
  args: {},
  handler: async ctx => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 전체 사용자 조회
      const allUsers = await ctx.db.query('profiles').collect();

      // 통계 계산
      const stats = {
        total: allUsers.length,
        byStatus: {
          pending: allUsers.filter(u => u.status === 'pending').length,
          approved: allUsers.filter(u => u.status === 'approved').length,
          rejected: allUsers.filter(u => u.status === 'rejected').length,
        },
        byRole: {
          admin: allUsers.filter(u => u.role === 'admin').length,
          kol: allUsers.filter(u => u.role === 'kol').length,
          ol: allUsers.filter(u => u.role === 'ol').length,
          shop_owner: allUsers.filter(u => u.role === 'shop_owner').length,
        },
        recentSignups: allUsers.filter(u => {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return u._creationTime > weekAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 사용자의 소속 관계 조회
 * 특정 사용자의 상/하위 관계 정보
 */
export const getUserRelationships = query({
  args: {
    userId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 사용자 조회
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.', 404);
      }

      // 상위 관계 조회 (이 사용자가 shop_owner인 경우)
      const parentRelationships = await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_owner', q => q.eq('shop_owner_id', args.userId))
        .filter(q => q.eq(q.field('is_active'), true))
        .collect();

      // 하위 관계 조회 (이 사용자가 parent인 경우)
      const childRelationships = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent', q => q.eq('parent_id', args.userId))
        .filter(q => q.eq(q.field('is_active'), true))
        .collect();

      // 상위 사용자 정보 조회
      const parentUsers = await Promise.all(
        parentRelationships.map(async rel => {
          if (!rel.parent_id) return null;
          const parent = await ctx.db.get(rel.parent_id);
          return parent
            ? {
                id: parent._id,
                name: parent.name,
                email: parent.email,
                role: parent.role,
                shop_name: parent.shop_name,
                relationship: rel,
              }
            : null;
        })
      );

      // 하위 사용자 정보 조회
      const childUsers = await Promise.all(
        childRelationships.map(async rel => {
          const child = await ctx.db.get(rel.shop_owner_id);
          return child
            ? {
                id: child._id,
                name: child.name,
                email: child.email,
                role: child.role,
                shop_name: child.shop_name,
                relationship: rel,
              }
            : null;
        })
      );

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          shop_name: user.shop_name,
        },
        parents: parentUsers.filter(Boolean),
        children: childUsers.filter(Boolean),
        totalSubordinates: user.total_subordinates || 0,
        activeSubordinates: user.active_subordinates || 0,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 역할별 사용자 목록 조회
 * 드롭다운이나 선택용
 */
export const getUsersByRole = query({
  args: {
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
    status: v.optional(v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // 인증 확인
      await getCurrentUser(ctx);

      const limit = Math.min(args.limit || 100, 500); // 최대 500개로 제한
      const status = args.status || 'approved';

      // 쿼리 실행 (복합 인덱스 사용으로 수정)
      let query = ctx.db
        .query('profiles')
        .withIndex('by_role_status', q => q.eq('role', args.role).eq('status', status));

      const users = await query.take(limit);

      // 기본 정보만 반환
      return users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        shop_name: user.shop_name,
        role: user.role,
        status: user.status,
      }));
    } catch (error) {
      throw formatError(error);
    }
  },
});
