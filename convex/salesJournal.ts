/**
 * 영업일지 관리 (Sales Journal Management) Query & Mutation Functions
 * Supabase /api/kol-new/sales-journal/* 엔드포인트와 완전 호환되는 Convex 구현
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';
import {
  requireRole,
  getCurrentUser,
  createAuditLog,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 영업일지 목록 조회 (페이지네이션, 필터링, 정렬 지원)
 * GET /api/kol-new/sales-journal 대체
 */
export const getSalesJournals = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    date: v.optional(v.string()), // YYYY-MM-DD 형식
    date_from: v.optional(v.string()), // 시작일
    date_to: v.optional(v.string()), // 종료일
    shop_name: v.optional(v.string()), // 샵명 검색
    user_id: v.optional(v.id('profiles')), // 특정 사용자 (관리자용)

    // 정렬 옵션
    sortBy: v.optional(v.union(v.literal('date'), v.literal('created_at'))),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회 (KOL 권한 필요)
      const currentUser = await requireRole(ctx, ['kol', 'ol', 'admin']);

      // 관리자가 아닌 경우 본인 데이터만 조회 가능
      const targetUserId =
        currentUser.role === 'admin' && args.user_id ? args.user_id : currentUser._id;

      // 영업일지 조회 쿼리 구성
      let journalsQuery = ctx.db
        .query('sales_journals')
        .withIndex('by_user_created', q => q.eq('user_id', targetUserId));

      const allJournals = await journalsQuery.collect();

      // 필터링
      let filteredJournals = allJournals.filter(journal => {
        // 특정 날짜 필터
        if (args.date && journal.date !== args.date) {
          return false;
        }

        // 날짜 범위 필터
        if (args.date_from && journal.date < args.date_from) {
          return false;
        }
        if (args.date_to && journal.date > args.date_to) {
          return false;
        }

        // 샵명 검색 (부분 일치)
        if (
          args.shop_name &&
          !journal.shop_name.toLowerCase().includes(args.shop_name.toLowerCase())
        ) {
          return false;
        }

        return true;
      });

      // 정렬
      const sortBy = args.sortBy || 'date';
      const sortOrder = args.sortOrder || 'desc';

      filteredJournals.sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
        } else {
          // created_at (number)
          return sortOrder === 'asc' ? a.created_at - b.created_at : b.created_at - a.created_at;
        }
      });

      // 샵 정보 조회 (관련된 샵들) - profiles 테이블에서 조회
      const shopIds = filteredJournals.map(j => j.shop_id).filter(Boolean) as Id<'profiles'>[];
      const shops = shopIds.length > 0 ? await Promise.all(shopIds.map(id => ctx.db.get(id))) : [];

      // 영업일지 데이터 변환
      const journals = filteredJournals.map(journal => {
        const shop = shops.find(s => s && s._id === journal.shop_id);

        return {
          id: journal._id,
          user_id: journal.user_id,
          shop_id: journal.shop_id,
          date: journal.date,
          shop_name: journal.shop_name,
          content: journal.content,
          special_notes: journal.special_notes,
          created_at: new Date(journal.created_at).toISOString(),
          updated_at: new Date(journal.updated_at).toISOString(),
          // 샵 정보 추가 (있는 경우) - profiles 테이블 필드 사용
          shop: shop
            ? {
                id: shop._id,
                shop_name: shop.shop_name,
                name: shop.name, // profiles.name 필드 사용
                region: shop.region,
              }
            : null,
        };
      });

      // 페이지네이션 적용
      const startIndex = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor) : 0;
      const endIndex = startIndex + args.paginationOpts.numItems;
      const paginatedJournals = journals.slice(startIndex, endIndex);
      const hasMore = endIndex < journals.length;

      return {
        page: paginatedJournals,
        isDone: !hasMore,
        continueCursor: hasMore ? endIndex.toString() : null,
        total: journals.length,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 개별 영업일지 상세 조회
 * GET /api/kol-new/sales-journal/[id] 대체
 */
export const getSalesJournal = query({
  args: {
    journalId: v.id('sales_journals'),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await requireRole(ctx, ['kol', 'ol', 'admin']);

      // 영업일지 조회
      const journal = await ctx.db.get(args.journalId);
      if (!journal) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '영업일지를 찾을 수 없습니다.');
      }

      // 권한 확인 (본인 또는 관리자만 조회 가능)
      if (currentUser.role !== 'admin' && journal.user_id !== currentUser._id) {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '다른 사용자의 영업일지에 접근할 수 없습니다.');
      }

      // 샵 정보 조회 (있는 경우)
      const shop = journal.shop_id ? await ctx.db.get(journal.shop_id) : null;

      return {
        id: journal._id,
        user_id: journal.user_id,
        shop_id: journal.shop_id,
        date: journal.date,
        shop_name: journal.shop_name,
        content: journal.content,
        special_notes: journal.special_notes,
        created_at: new Date(journal.created_at).toISOString(),
        updated_at: new Date(journal.updated_at).toISOString(),
        shop: shop
          ? {
              id: shop._id,
              shop_name: shop.shop_name,
              name: shop.name, // profiles.name 필드 사용
              region: shop.region,
            }
          : null,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 영업일지 생성 또는 업데이트 (UPSERT)
 * POST /api/kol-new/sales-journal 대체
 */
export const upsertSalesJournal = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD 형식
    shop_name: v.string(),
    content: v.string(),
    special_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회 (KOL 권한 필요)
      const currentUser = await requireRole(ctx, ['kol', 'ol']);

      // 입력 데이터 검증
      if (!args.date || !args.shop_name?.trim() || !args.content?.trim()) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '날짜, 샵명, 내용은 필수 입력사항입니다.');
      }

      // 날짜 형식 검증
      const parsedDate = new Date(args.date);
      if (isNaN(parsedDate.getTime())) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '올바른 날짜 형식이 아닙니다.');
      }

      const currentTime = Date.now();

      // 샵 ID 찾기 (선택적) - profiles 테이블에서 shop_name으로 검색
      let shopId: Id<'profiles'> | undefined = undefined;

      // shop_name으로 profiles를 검색 (정확한 매치)
      const allProfiles = await ctx.db.query('profiles').collect();
      const shopProfile = allProfiles.find(profile => profile.shop_name === args.shop_name.trim());

      if (shopProfile) {
        shopId = shopProfile._id;
      }

      // 동일한 날짜의 기존 영업일지 확인 (UPSERT 구현)
      const existingJournal = await ctx.db
        .query('sales_journals')
        .withIndex('by_user_date', q => q.eq('user_id', currentUser._id).eq('date', args.date))
        .first();

      let journalId: Id<'sales_journals'>;
      let isUpdate = false;

      if (existingJournal) {
        // 기존 영업일지 업데이트
        isUpdate = true;
        journalId = existingJournal._id;

        await ctx.db.patch(journalId, {
          shop_id: shopId,
          shop_name: args.shop_name.trim(),
          content: args.content.trim(),
          special_notes: args.special_notes?.trim() || undefined,
          updated_at: currentTime,
        });
      } else {
        // 새로운 영업일지 생성
        journalId = await ctx.db.insert('sales_journals', {
          user_id: currentUser._id,
          shop_id: shopId,
          date: args.date,
          shop_name: args.shop_name.trim(),
          content: args.content.trim(),
          special_notes: args.special_notes?.trim() || undefined,
          created_at: currentTime,
          updated_at: currentTime,
        });
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'sales_journals',
        recordId: journalId,
        action: isUpdate ? 'UPDATE' : 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: isUpdate
          ? {
              shop_name: existingJournal!.shop_name,
              content: existingJournal!.content,
            }
          : {},
        newValues: {
          shop_name: args.shop_name.trim(),
          content: args.content.trim(),
        },
        changedFields: isUpdate
          ? ['shop_name', 'content', 'special_notes', 'updated_at']
          : ['user_id', 'shop_name', 'content', 'date', 'created_at'],
        metadata: {
          action_type: isUpdate ? 'update_sales_journal' : 'create_sales_journal',
          date: args.date,
        },
      });

      // 업데이트된 영업일지 조회 후 반환
      const updatedJournal = await ctx.db.get(journalId);
      if (!updatedJournal) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '영업일지 저장 후 조회에 실패했습니다.');
      }

      // 샵 정보 조회 (있는 경우)
      const shop = shopId ? await ctx.db.get(shopId) : null;

      return {
        success: true,
        isUpdate,
        data: {
          id: updatedJournal._id,
          user_id: updatedJournal.user_id,
          shop_id: updatedJournal.shop_id,
          date: updatedJournal.date,
          shop_name: updatedJournal.shop_name,
          content: updatedJournal.content,
          special_notes: updatedJournal.special_notes,
          created_at: new Date(updatedJournal.created_at).toISOString(),
          updated_at: new Date(updatedJournal.updated_at).toISOString(),
          shop: shop
            ? {
                id: shop._id,
                shop_name: shop.shop_name,
                name: shop.name,
                region: shop.region,
              }
            : null,
        },
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 영업일지 삭제
 * DELETE /api/kol-new/sales-journal/[id] 대체
 */
export const deleteSalesJournal = mutation({
  args: {
    journalId: v.id('sales_journals'),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await requireRole(ctx, ['kol', 'ol', 'admin']);

      // 영업일지 조회
      const journal = await ctx.db.get(args.journalId);
      if (!journal) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '영업일지를 찾을 수 없습니다.');
      }

      // 권한 확인 (본인 또는 관리자만 삭제 가능)
      if (currentUser.role !== 'admin' && journal.user_id !== currentUser._id) {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '다른 사용자의 영업일지를 삭제할 수 없습니다.');
      }

      // 영업일지 삭제
      await ctx.db.delete(args.journalId);

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'sales_journals',
        recordId: args.journalId,
        action: 'DELETE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {
          date: journal.date,
          shop_name: journal.shop_name,
          content: journal.content,
        },
        newValues: {},
        changedFields: ['deleted'],
        metadata: {
          action_type: 'delete_sales_journal',
          date: journal.date,
        },
      });

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 영업일지 통계 조회
 * 관리자용 대시보드나 분석용
 */
export const getSalesJournalStats = query({
  args: {
    user_id: v.optional(v.id('profiles')), // 특정 사용자 (관리자용)
    date_from: v.optional(v.string()),
    date_to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await requireRole(ctx, ['kol', 'ol', 'admin']);

      // 관리자가 아닌 경우 본인 데이터만 조회 가능
      const targetUserId =
        currentUser.role === 'admin' && args.user_id ? args.user_id : currentUser._id;

      // 영업일지 조회
      let journalsQuery = ctx.db
        .query('sales_journals')
        .withIndex('by_user_created', q => q.eq('user_id', targetUserId));

      const allJournals = await journalsQuery.collect();

      // 날짜 필터링
      const filteredJournals = allJournals.filter(journal => {
        if (args.date_from && journal.date < args.date_from) {
          return false;
        }
        if (args.date_to && journal.date > args.date_to) {
          return false;
        }
        return true;
      });

      // 통계 계산
      const totalJournals = filteredJournals.length;
      const uniqueDates = new Set(filteredJournals.map(j => j.date)).size;
      const uniqueShops = new Set(filteredJournals.map(j => j.shop_name)).size;

      // 최근 영업일지 (최대 5개)
      const recentJournals = filteredJournals
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 5)
        .map(journal => ({
          id: journal._id,
          date: journal.date,
          shop_name: journal.shop_name,
          content: journal.content.substring(0, 100) + (journal.content.length > 100 ? '...' : ''),
          created_at: new Date(journal.created_at).toISOString(),
        }));

      return {
        totalJournals,
        uniqueDates,
        uniqueShops,
        recentJournals,
        dateRange: {
          from: args.date_from,
          to: args.date_to,
        },
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});
