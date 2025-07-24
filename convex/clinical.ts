/**
 * 임상 케이스 관리 (Clinical Case Management) Query & Mutation Functions
 * 기존 /api/clinical/cases/* 엔드포인트를 대체하는 Convex 함수들
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';
import {
  getCurrentUser,
  createAuditLog,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 임상 케이스 목록 조회 (페이지네이션, 필터링 지원)
 * 기존 GET /api/clinical/cases 대체
 */
export const listClinicalCases = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    status: v.optional(
      v.union(
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('paused'),
        v.literal('cancelled')
      )
    ),
    subject_type: v.optional(v.union(v.literal('self'), v.literal('customer'))),
    consent_status: v.optional(
      v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending'))
    ),
    treatment_item: v.optional(v.string()),

    // 정렬 옵션
    sortBy: v.optional(
      v.union(v.literal('created_at'), v.literal('start_date'), v.literal('name'), v.literal('age'))
    ),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 기본 쿼리 - 본인의 케이스만 조회
      let query = ctx.db
        .query('clinical_cases')
        .withIndex('by_shop', q => q.eq('shop_id', currentUser._id));

      // 필터 적용
      if (args.status) {
        query = query.filter(q => q.eq(q.field('status'), args.status));
      }
      if (args.subject_type) {
        query = query.filter(q => q.eq(q.field('subject_type'), args.subject_type));
      }
      if (args.consent_status) {
        query = query.filter(q => q.eq(q.field('consent_status'), args.consent_status));
      }
      if (args.treatment_item) {
        query = query.filter(q => q.eq(q.field('treatment_item'), args.treatment_item));
      }

      // 페이지네이션 적용
      const result = await query.paginate(args.paginationOpts);

      // 각 케이스에 대한 추가 정보 수집
      const casesWithDetails = await Promise.all(
        result.page.map(async clinicalCase => {
          // 사진 수 계산
          const photos = await ctx.db
            .query('clinical_photos')
            .withIndex('by_case', q => q.eq('clinical_case_id', clinicalCase._id))
            .collect();

          // 동의서 파일 확인
          const consentFile = await ctx.db
            .query('consent_files')
            .withIndex('by_case', q => q.eq('clinical_case_id', clinicalCase._id))
            .first();

          return {
            ...clinicalCase,
            photo_count: photos.length,
            has_consent_file: !!consentFile,
            photos: photos.length, // 기존 API 호환성
            consent_file: consentFile ? { id: consentFile._id } : null, // 기존 API 호환성
          };
        })
      );

      return {
        page: casesWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 특정 임상 케이스 상세 조회
 * 기존 GET /api/clinical/cases/[id] 대체
 */
export const getClinicalCase = query({
  args: {
    caseId: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 임상 케이스 조회
      const clinicalCase = await ctx.db.get(args.caseId);
      if (!clinicalCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      // 권한 확인 - 본인의 케이스만 조회 가능
      if (clinicalCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      // 관련 사진들 조회
      const photos = await ctx.db
        .query('clinical_photos')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .collect();

      // 동의서 파일 조회
      const consentFile = await ctx.db
        .query('consent_files')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .first();

      return {
        ...clinicalCase,
        photos: photos.map(photo => ({
          id: photo._id,
          session_number: photo.session_number,
          photo_type: photo.photo_type,
          file_path: photo.file_path,
          created_at: photo.created_at,
        })),
        consent_file: consentFile
          ? {
              id: consentFile._id,
              file_path: consentFile.file_path,
              file_name: consentFile.file_name,
              created_at: consentFile.created_at,
            }
          : null,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스 생성
 * 기존 POST /api/clinical/cases 대체
 */
export const createClinicalCase = mutation({
  args: {
    subject_type: v.union(v.literal('self'), v.literal('customer')),
    name: v.string(),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    age: v.optional(v.number()),
    treatment_item: v.optional(v.string()),
    consent_status: v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending')),
    marketing_consent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 입력 데이터 검증
      if (!args.name || args.name.trim().length < 2) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Name must be at least 2 characters long');
      }

      if (args.age !== undefined && (args.age < 0 || args.age > 150)) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Age must be between 0 and 150');
      }

      const now = Date.now();

      // 임상 케이스 생성
      const caseId = await ctx.db.insert('clinical_cases', {
        shop_id: currentUser._id,
        subject_type: args.subject_type,
        name: args.name.trim(),
        gender: args.gender,
        age: args.age,
        status: 'in_progress',
        treatment_item: args.treatment_item,
        start_date: now,
        total_sessions: 0,
        consent_status: args.consent_status,
        consent_date: args.consent_status === 'consented' ? now : undefined,
        marketing_consent: args.marketing_consent || false,
        notes: args.notes,
        tags: args.tags || [],
        custom_fields: {},
        photo_count: 0,
        latest_session: 0,
        created_at: now,
        updated_at: now,
        created_by: currentUser._id,
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: caseId,
        action: 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: null,
        newValues: {
          name: args.name,
          subject_type: args.subject_type,
          consent_status: args.consent_status,
        },
        changedFields: ['name', 'subject_type', 'consent_status'],
        metadata: {
          operation: 'clinical_case_created',
          timestamp: now,
        },
      });

      // 관리자에게 알림 생성 (동의한 케이스의 경우)
      if (args.consent_status === 'consented') {
        await createNotification(ctx, {
          userId: currentUser._id, // 향후 관리자 ID로 변경 필요
          type: 'clinical_progress',
          title: '새로운 임상 케이스 생성',
          message: `${currentUser.name}님이 새로운 임상 케이스를 생성했습니다: ${args.name}`,
          relatedType: 'clinical_case',
          relatedId: caseId,
          priority: 'normal',
        });
      }

      // 생성된 케이스 반환
      const createdCase = await ctx.db.get(caseId);
      return createdCase;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스 상태 업데이트
 */
export const updateClinicalCaseStatus = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    status: v.union(
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('paused'),
      v.literal('cancelled')
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 케이스 존재 및 권한 확인
      const existingCase = await ctx.db.get(args.caseId);
      if (!existingCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (existingCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      const now = Date.now();
      const oldStatus = existingCase.status;

      // 케이스 상태 업데이트
      await ctx.db.patch(args.caseId, {
        status: args.status,
        end_date: args.status === 'completed' ? now : existingCase.end_date,
        notes: args.notes || existingCase.notes,
        updated_at: now,
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: args.caseId,
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: { status: oldStatus },
        newValues: { status: args.status },
        changedFields: ['status'],
        metadata: {
          operation: 'status_update',
          timestamp: now,
        },
      });

      // 상태 변경 알림 생성
      if (oldStatus !== args.status) {
        await createNotification(ctx, {
          userId: currentUser._id,
          type: 'status_changed',
          title: '임상 케이스 상태 변경',
          message: `임상 케이스 "${existingCase.name}"의 상태가 ${oldStatus}에서 ${args.status}로 변경되었습니다.`,
          relatedType: 'clinical_case',
          relatedId: args.caseId,
          priority: 'normal',
        });
      }

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스 삭제
 */
export const deleteClinicalCase = mutation({
  args: {
    caseId: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 케이스 존재 및 권한 확인
      const existingCase = await ctx.db.get(args.caseId);
      if (!existingCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (existingCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      // 관련 사진들 삭제
      const photos = await ctx.db
        .query('clinical_photos')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .collect();

      for (const photo of photos) {
        // Storage에서 파일 삭제
        try {
          await ctx.storage.delete(photo.file_path as Id<'_storage'>);
        } catch (error) {
          console.warn('Failed to delete photo from storage:', error);
        }
        // DB에서 메타데이터 삭제
        await ctx.db.delete(photo._id);
      }

      // 관련 동의서 파일 삭제
      const consentFile = await ctx.db
        .query('consent_files')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .first();

      if (consentFile) {
        // Storage에서 파일 삭제
        try {
          await ctx.storage.delete(consentFile.file_path as Id<'_storage'>);
        } catch (error) {
          console.warn('Failed to delete consent file from storage:', error);
        }
        // DB에서 메타데이터 삭제
        await ctx.db.delete(consentFile._id);
      }

      // 케이스 삭제
      await ctx.db.delete(args.caseId);

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: args.caseId,
        action: 'DELETE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {
          name: existingCase.name,
          status: existingCase.status,
        },
        newValues: null,
        changedFields: ['deleted'],
        metadata: {
          operation: 'clinical_case_deleted',
          deletedPhotos: photos.length,
          deletedConsentFile: !!consentFile,
          timestamp: Date.now(),
        },
      });

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스 통계 조회
 */
export const getClinicalCaseStats = query({
  args: {},
  handler: async ctx => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);

      // 사용자의 모든 케이스 조회
      const allCases = await ctx.db
        .query('clinical_cases')
        .withIndex('by_shop', q => q.eq('shop_id', currentUser._id))
        .collect();

      // 통계 계산
      const stats = {
        total: allCases.length,
        byStatus: {
          in_progress: allCases.filter(c => c.status === 'in_progress').length,
          completed: allCases.filter(c => c.status === 'completed').length,
          paused: allCases.filter(c => c.status === 'paused').length,
          cancelled: allCases.filter(c => c.status === 'cancelled').length,
        },
        bySubjectType: {
          self: allCases.filter(c => c.subject_type === 'self').length,
          customer: allCases.filter(c => c.subject_type === 'customer').length,
        },
        byConsentStatus: {
          consented: allCases.filter(c => c.consent_status === 'consented').length,
          no_consent: allCases.filter(c => c.consent_status === 'no_consent').length,
          pending: allCases.filter(c => c.consent_status === 'pending').length,
        },
        recentCases: allCases.filter(c => {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return c.created_at > weekAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      throw formatError(error);
    }
  },
});
