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
    // 프로필 ID 추가 (임시 해결책)
    profileId: v.optional(v.id('profiles')),

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
      // 사용자 인증 확인 - profileId가 있으면 그것을 사용
      let profileId: Id<'profiles'> | null = null;

      if (args.profileId) {
        profileId = args.profileId;
      } else {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) {
          // 인증되지 않았거나 프로필이 없는 사용자는 빈 결과를 반환
          return { page: [], isDone: true, continueCursor: null };
        }
        profileId = currentUser._id;
      }

      // 기본 쿼리 - 본인의 케이스만 조회
      let query = ctx.db
        .query('clinical_cases')
        .withIndex('by_shop', q => q.eq('shop_id', profileId));

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

      // N+1 문제를 해결하기 위한 최적화
      const caseIds = result.page.map(c => c._id);

      // 관련된 모든 사진과 동의서 파일을 한 번의 쿼리로 가져오기
      const allPhotos =
        caseIds.length > 0
          ? await ctx.db
              .query('clinical_photos')
              .withIndex('by_case')
              .filter(q => q.or(...caseIds.map(id => q.eq(q.field('clinical_case_id'), id))))
              .collect()
          : [];

      const allConsentFiles =
        caseIds.length > 0
          ? await ctx.db
              .query('consent_files')
              .withIndex('by_case')
              .filter(q => q.or(...caseIds.map(id => q.eq(q.field('clinical_case_id'), id))))
              .collect()
          : [];

      // 메모리에서 데이터 그룹화
      const photosByCase = new Map<Id<'clinical_cases'>, any[]>();
      allPhotos.forEach(p => {
        if (!photosByCase.has(p.clinical_case_id)) {
          photosByCase.set(p.clinical_case_id, []);
        }
        photosByCase.get(p.clinical_case_id)!.push(p);
      });

      const consentFileByCase = new Map<Id<'clinical_cases'>, any>();
      allConsentFiles.forEach(f => {
        consentFileByCase.set(f.clinical_case_id, f);
      });

      // 각 케이스에 대한 추가 정보 조합
      const casesWithDetails = result.page.map(clinicalCase => {
        const photos = photosByCase.get(clinicalCase._id) || [];
        const consentFile = consentFileByCase.get(clinicalCase._id);

        return {
          ...clinicalCase,
          photo_count: photos.length,
          has_consent_file: !!consentFile,
          photos: photos.length, // 기존 API 호환성
          consent_file: consentFile ? { id: consentFile._id } : null, // 기존 API 호환성
        };
      });

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
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        currentUser = profile;
      } else {
        currentUser = await getCurrentUser(ctx);
      }

      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated or profile not found');
      }

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
    profileId: v.id('profiles'), // 프로필 ID를 직접 전달받음
    subject_type: v.union(v.literal('self'), v.literal('customer')),
    name: v.string(),
    case_title: v.optional(v.string()), // 추가
    concern_area: v.optional(v.string()), // 추가
    treatment_plan: v.optional(v.string()), // 추가
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    age: v.optional(v.number()),
    treatment_item: v.optional(v.string()),
    consent_status: v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending')),
    consent_date: v.optional(v.number()),
    marketing_consent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()), // 추가
  },
  handler: async (ctx, args) => {
    try {
      console.log('[createClinicalCase] 시작:', { profileId: args.profileId, name: args.name });

      // 프로필 존재 확인
      const profile = await ctx.db.get(args.profileId);
      if (!profile) {
        console.error('[createClinicalCase] 프로필을 찾을 수 없음:', args.profileId);
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Profile not found');
      }
      console.log('[createClinicalCase] 프로필 확인 완료:', profile.name);

      // 입력 데이터 검증
      if (!args.name || args.name.trim().length < 2) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Name must be at least 2 characters long');
      }

      if (args.age !== undefined && (args.age < 0 || args.age > 150)) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Age must be between 0 and 150');
      }

      const now = Date.now();

      // 임상 케이스 생성
      console.log('[createClinicalCase] 케이스 데이터 생성 중...');
      const caseId = await ctx.db.insert('clinical_cases', {
        shop_id: args.profileId, // KOL의 프로필 ID를 그대로 사용
        subject_type: args.subject_type,
        name: args.name.trim(),
        case_title: args.case_title,
        concern_area: args.concern_area,
        treatment_plan: args.treatment_plan,
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
        metadata: args.metadata,
        custom_fields: {},
        photo_count: 0,
        latest_session: 0,
        created_at: now,
        updated_at: now,
        created_by: args.profileId,
      });
      console.log('[createClinicalCase] 케이스 생성 완료:', caseId);

      // 감사 로그 생성
      console.log('[createClinicalCase] 감사 로그 생성 중...');
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: caseId,
        action: 'INSERT',
        userId: args.profileId,
        userRole: profile.role,
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
      console.log('[createClinicalCase] 감사 로그 생성 완료');

      // 관리자에게 알림 생성 (동의한 케이스의 경우)
      if (args.consent_status === 'consented') {
        console.log('[createClinicalCase] 알림 생성 중...');
        await createNotification(ctx, {
          userId: args.profileId, // 향후 관리자 ID로 변경 필요
          type: 'clinical_progress',
          title: '새로운 임상 케이스 생성',
          message: `${profile.name}님이 새로운 임상 케이스를 생성했습니다: ${args.name}`,
          relatedType: 'clinical_case',
          relatedId: caseId,
          priority: 'normal',
        });
        console.log('[createClinicalCase] 알림 생성 완료');
      }

      // 생성된 케이스 반환
      console.log('[createClinicalCase] 케이스 조회 중...');
      const createdCase = await ctx.db.get(caseId);
      console.log('[createClinicalCase] 성공적으로 완료:', {
        caseId,
        name: createdCase?.name,
        shop_id: createdCase?.shop_id,
      });
      return createdCase;
    } catch (error) {
      console.error('[createClinicalCase] 에러 발생:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Unexpected error in createClinicalCase:', error);
      throw new Error('임상 케이스 생성 중 오류가 발생했습니다.');
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
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        if (!profile) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, 'Profile not found');
        }
        currentUser = profile;
      } else {
        const user = await getCurrentUser(ctx);
        if (!user) {
          throw new ApiError(
            ERROR_CODES.UNAUTHORIZED,
            'User not authenticated or profile not found'
          );
        }
        currentUser = user;
      }

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
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        if (!profile) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, 'Profile not found');
        }
        currentUser = profile;
      } else {
        const user = await getCurrentUser(ctx);
        if (!user) {
          throw new ApiError(
            ERROR_CODES.UNAUTHORIZED,
            'User not authenticated or profile not found'
          );
        }
        currentUser = user;
      }

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
 * 임상 케이스 필드 업데이트
 */
export const updateClinicalCase = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    updates: v.object({
      name: v.optional(v.string()),
      case_title: v.optional(v.string()),
      concern_area: v.optional(v.string()),
      treatment_plan: v.optional(v.string()),
      gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
      age: v.optional(v.number()),
      consent_status: v.optional(
        v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending'))
      ),
      consent_date: v.optional(v.number()),
      marketing_consent: v.optional(v.boolean()),
      notes: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    }),
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        if (!profile) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, 'Profile not found');
        }
        currentUser = profile;
      } else {
        const user = await getCurrentUser(ctx);
        if (!user) {
          throw new ApiError(
            ERROR_CODES.UNAUTHORIZED,
            'User not authenticated or profile not found'
          );
        }
        currentUser = user;
      }

      // 케이스 존재 및 권한 확인
      const existingCase = await ctx.db.get(args.caseId);
      if (!existingCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (existingCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      const now = Date.now();

      // 업데이트 수행
      await ctx.db.patch(args.caseId, {
        ...args.updates,
        updated_at: now,
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: args.caseId,
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: existingCase,
        newValues: args.updates,
        changedFields: Object.keys(args.updates),
        metadata: {
          operation: 'clinical_case_updated',
          timestamp: now,
        },
      });

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 라운드별 고객 정보 저장
 */
export const saveRoundCustomerInfo = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    roundNumber: v.number(),
    info: v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
      treatmentType: v.optional(v.string()),
      treatmentDate: v.optional(v.string()),
      products: v.optional(v.array(v.string())),
      skinTypes: v.optional(v.array(v.string())),
      memo: v.optional(v.string()),
    }),
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        if (!profile) {
          throw new ApiError(ERROR_CODES.NOT_FOUND, 'Profile not found');
        }
        currentUser = profile;
      } else {
        const user = await getCurrentUser(ctx);
        if (!user) {
          throw new ApiError(
            ERROR_CODES.UNAUTHORIZED,
            'User not authenticated or profile not found'
          );
        }
        currentUser = user;
      }

      // 케이스 존재 및 권한 확인
      const existingCase = await ctx.db.get(args.caseId);
      if (!existingCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (existingCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      // 메타데이터에 라운드 정보 저장
      const currentMetadata = (existingCase.metadata as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        roundInfo: {
          ...(currentMetadata.roundInfo || {}),
          [args.roundNumber]: args.info,
        },
      };

      const now = Date.now();

      // 케이스 업데이트
      await ctx.db.patch(args.caseId, {
        metadata: updatedMetadata,
        updated_at: now,
      });

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스의 라운드별 고객 정보 조회
 */
export const getRoundCustomerInfo = query({
  args: {
    caseId: v.id('clinical_cases'),
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        currentUser = profile;
      } else {
        currentUser = await getCurrentUser(ctx);
      }

      if (!currentUser) {
        return [];
      }

      // 케이스 권한 확인
      const clinicalCase = await ctx.db.get(args.caseId);
      if (!clinicalCase) {
        return [];
      }

      if (clinicalCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        return [];
      }

      // 메타데이터에서 라운드 정보 추출
      const metadata = (clinicalCase.metadata as any) || {};
      const roundInfoFromMetadata = metadata.roundInfo || {};
      const roundInfo = [];

      // 저장된 라운드 정보가 있으면 사용
      if (Object.keys(roundInfoFromMetadata).length > 0) {
        for (const [roundNumber, info] of Object.entries(roundInfoFromMetadata)) {
          const roundData = info as any;
          roundInfo.push({
            round_number: parseInt(roundNumber),
            age: roundData.age || clinicalCase.age,
            gender: roundData.gender || clinicalCase.gender,
            treatment_type: roundData.treatmentType || clinicalCase.treatment_item || '',
            products: roundData.products || [],
            skin_types: roundData.skinTypes || [],
            memo: roundData.memo || '',
            treatment_date:
              roundData.treatmentDate ||
              (clinicalCase.start_date
                ? new Date(clinicalCase.start_date).toISOString().split('T')[0]
                : ''),
          });
        }
      } else {
        // 라운드 정보가 없으면 기본 정보로 1라운드 생성
        roundInfo.push({
          round_number: 1,
          age: clinicalCase.age,
          gender: clinicalCase.gender,
          treatment_type: clinicalCase.treatment_item || '',
          products: [], // metadata에서 제품 정보 추출 가능
          skin_types: [], // metadata에서 피부타입 정보 추출 가능
          memo: clinicalCase.treatment_plan || '',
          treatment_date: clinicalCase.start_date
            ? new Date(clinicalCase.start_date).toISOString().split('T')[0]
            : '',
        });
      }

      return roundInfo;
    } catch (error) {
      console.error('Failed to get round customer info:', error);
      return [];
    }
  },
});

/**
 * 임상 케이스 통계 조회
 */
export const getClinicalCaseStats = query({
  args: {
    profileId: v.optional(v.id('profiles')), // 프로필 ID 추가
  },
  handler: async (ctx, args) => {
    try {
      // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        const profile = await ctx.db.get(args.profileId);
        currentUser = profile;
      } else {
        currentUser = await getCurrentUser(ctx);
      }

      if (!currentUser) {
        // 데이터가 없는 것으로 처리
        return {
          total: 0,
          byStatus: { in_progress: 0, completed: 0, paused: 0, cancelled: 0 },
          bySubjectType: { self: 0, customer: 0 },
          byConsentStatus: { consented: 0, no_consent: 0, pending: 0 },
          recentCases: 0,
        };
      }

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
