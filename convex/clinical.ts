/**
 * 임상 케이스 관리 (Clinical Case Management) Query & Mutation Functions
 * 기존 /api/clinical/cases/* 엔드포인트를 대체하는 Convex 함수들
 * ✅ 프론트엔드 호환성 강화 버전
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

// ✅ 프론트엔드-백엔드 상태 매핑 유틸리티
const mapStatusToBackend = (frontendStatus: string) => {
  const statusMap: Record<string, string> = {
    active: 'in_progress',
    in_progress: 'in_progress',
    completed: 'completed',
    paused: 'paused',
    cancelled: 'cancelled',
    archived: 'archived',
  };
  return statusMap[frontendStatus] || frontendStatus;
};

const mapStatusToFrontend = (backendStatus: string) => {
  const statusMap: Record<string, string> = {
    in_progress: 'active', // 기본적으로 'active'로 매핑
    active: 'active',
    completed: 'completed',
    paused: 'paused',
    cancelled: 'cancelled',
    archived: 'archived',
  };
  return statusMap[backendStatus] || backendStatus;
};

// ✅ 프론트엔드 호환성 필드 자동 설정 함수
const addFrontendCompatibilityFields = (clinicalCase: any) => {
  return {
    ...clinicalCase,
    // 프론트엔드에서 사용하는 alias 필드들
    customerName: clinicalCase.customerName || clinicalCase.name,
    consentReceived: clinicalCase.consentReceived ?? clinicalCase.consent_status === 'consented',
    is_personal:
      clinicalCase.is_personal ??
      (clinicalCase.subject_type === 'self' || clinicalCase.name?.trim() === '본인'),
    createdAt: clinicalCase.createdAt || new Date(clinicalCase.created_at).toISOString(),
    updatedAt: clinicalCase.updatedAt || new Date(clinicalCase.updated_at).toISOString(),

    // 상태 매핑
    status: mapStatusToFrontend(clinicalCase.status),
  };
};

/**
 * 임상 케이스 목록 조회 (페이지네이션, 필터링 지원)
 * 기존 GET /api/clinical/cases 대체
 * ✅ 프론트엔드 호환성 강화
 */
export const listClinicalCases = query({
  args: {
    // 프로필 ID 추가 (임시 해결책)
    profileId: v.optional(v.id('profiles')),

    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션 - 프론트엔드 상태 지원 추가
    status: v.optional(
      v.union(
        v.literal('active'), // 프론트엔드에서 사용하는 'active'
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('paused'),
        v.literal('cancelled'),
        v.literal('archived') // 프론트엔드에서 사용하는 'archived'
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

      // 필터 적용 - 프론트엔드 상태를 백엔드 상태로 변환
      if (args.status) {
        const backendStatus = mapStatusToBackend(args.status);
        query = query.filter(q => q.eq(q.field('status'), backendStatus));
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

      // 각 케이스에 대한 추가 정보 조합 + 프론트엔드 호환성 적용
      const casesWithDetails = result.page.map(clinicalCase => {
        const photos = photosByCase.get(clinicalCase._id) || [];
        const consentFile = consentFileByCase.get(clinicalCase._id);

        const caseWithBasicDetails = {
          ...clinicalCase,
          photo_count: photos.length,
          has_consent_file: !!consentFile,
          photos: photos.length, // 기존 API 호환성
          consent_file: consentFile ? { id: consentFile._id } : null, // 기존 API 호환성
        };

        // ✅ 프론트엔드 호환성 필드 추가
        return addFrontendCompatibilityFields(caseWithBasicDetails);
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
 * ✅ 프론트엔드 호환성 강화
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

      const caseWithDetails = {
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

      // ✅ 프론트엔드 호환성 필드 추가
      return addFrontendCompatibilityFields(caseWithDetails);
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 케이스 생성
 * 기존 POST /api/clinical/cases 대체
 * ✅ 프론트엔드 호환성 강화 - 모든 필드 지원
 */
export const createClinicalCase = mutation({
  args: {
    profileId: v.id('profiles'), // 프로필 ID를 직접 전달받음
    subject_type: v.optional(v.union(v.literal('self'), v.literal('customer'))),
    name: v.optional(v.string()),

    // 프론트엔드 호환성 필드들
    customerName: v.optional(v.string()), // 프론트엔드에서 주로 사용하는 고객명
    caseName: v.optional(v.string()), // case_title과 동일
    case_title: v.optional(v.string()),
    concernArea: v.optional(v.string()), // camelCase 버전
    concern_area: v.optional(v.string()),
    treatmentPlan: v.optional(v.string()), // camelCase 버전
    treatment_plan: v.optional(v.string()),
    consentReceived: v.optional(v.boolean()), // boolean 버전

    // 기본 정보
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    age: v.optional(v.number()),
    treatment_item: v.optional(v.string()),

    // 동의 관련
    consent_status: v.optional(
      v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending'))
    ),
    consent_date: v.optional(v.number()),
    marketing_consent: v.optional(v.boolean()),

    // 상태 - 프론트엔드 상태 포함
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('paused'),
        v.literal('cancelled'),
        v.literal('archived')
      )
    ),

    // 제품 사용 체크박스 (프론트엔드 types/clinical.ts 호환)
    cureBooster: v.optional(v.boolean()),
    cureMask: v.optional(v.boolean()),
    premiumMask: v.optional(v.boolean()),
    allInOneSerum: v.optional(v.boolean()),

    // 피부 타입 체크박스 (프론트엔드 types/clinical.ts 호환)
    skinRedSensitive: v.optional(v.boolean()),
    skinPigment: v.optional(v.boolean()),
    skinPore: v.optional(v.boolean()),
    skinTrouble: v.optional(v.boolean()),
    skinWrinkle: v.optional(v.boolean()),
    skinEtc: v.optional(v.boolean()),

    // 기타
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
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

      // 이름 설정 - customerName > name > 기본값 순서로 우선순위
      const finalName = args.customerName || args.name || '새 고객';

      // 입력 데이터 검증
      if (finalName.trim().length < 1) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Name must be at least 1 character long');
      }

      if (args.age !== undefined && (args.age < 0 || args.age > 150)) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Age must be between 0 and 150');
      }

      const now = Date.now();

      // consent_status 결정 - consentReceived가 있으면 그것을 우선 사용
      let consentStatus: 'no_consent' | 'consented' | 'pending' = 'pending';
      if (args.consentReceived !== undefined) {
        consentStatus = args.consentReceived ? 'consented' : 'no_consent';
      } else if (args.consent_status) {
        consentStatus = args.consent_status;
      }

      // 상태 결정 - 프론트엔드 상태를 백엔드 상태로 변환
      const finalStatus = args.status ? mapStatusToBackend(args.status) : 'in_progress';

      // 임상 케이스 생성
      console.log('[createClinicalCase] 케이스 데이터 생성 중...');
      const caseId = await ctx.db.insert('clinical_cases', {
        // 기본 필드들
        shop_id: args.profileId,
        subject_type: args.subject_type || 'customer',
        name: finalName.trim(),
        case_title: args.caseName || args.case_title || finalName + ' 케이스',
        concern_area: args.concernArea || args.concern_area || '',
        treatment_plan: args.treatmentPlan || args.treatment_plan || '',
        gender: args.gender,
        age: args.age,
        status: finalStatus as any,
        treatment_item: args.treatment_item,
        start_date: now,
        total_sessions: 0,
        consent_status: consentStatus,
        consent_date: consentStatus === 'consented' ? now : undefined,
        marketing_consent: args.marketing_consent || false,
        notes: args.notes,
        tags: args.tags || [],
        custom_fields: {},
        photo_count: 0,
        latest_session: 0,
        created_at: now,
        updated_at: now,
        created_by: args.profileId,

        // ✅ 프론트엔드 호환성 필드들 추가
        customerName: finalName.trim(),
        consentReceived: consentStatus === 'consented',
        is_personal: args.subject_type === 'self' || finalName.trim() === '본인',
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),

        // ✅ 제품 사용 체크박스 필드들
        cureBooster: args.cureBooster || false,
        cureMask: args.cureMask || false,
        premiumMask: args.premiumMask || false,
        allInOneSerum: args.allInOneSerum || false,

        // ✅ 피부 타입 체크박스 필드들
        skinRedSensitive: args.skinRedSensitive || false,
        skinPigment: args.skinPigment || false,
        skinPore: args.skinPore || false,
        skinTrouble: args.skinTrouble || false,
        skinWrinkle: args.skinWrinkle || false,
        skinEtc: args.skinEtc || false,

        // 메타데이터
        metadata: args.metadata,
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
          name: finalName,
          subject_type: args.subject_type || 'customer',
          consent_status: consentStatus,
          status: finalStatus,
        },
        changedFields: ['name', 'subject_type', 'consent_status', 'status'],
        metadata: {
          operation: 'clinical_case_created',
          timestamp: now,
        },
      });
      console.log('[createClinicalCase] 감사 로그 생성 완료');

      // 관리자에게 알림 생성 (동의한 케이스의 경우)
      if (consentStatus === 'consented') {
        console.log('[createClinicalCase] 알림 생성 중...');
        await createNotification(ctx, {
          userId: args.profileId, // 향후 관리자 ID로 변경 필요
          type: 'clinical_progress',
          title: '새로운 임상 케이스 생성',
          message: `${profile.name}님이 새로운 임상 케이스를 생성했습니다: ${finalName}`,
          relatedType: 'clinical_case',
          relatedId: caseId,
          priority: 'normal',
        });
        console.log('[createClinicalCase] 알림 생성 완료');
      }

      // 생성된 케이스 반환 - 프론트엔드 호환성 필드 포함
      console.log('[createClinicalCase] 케이스 조회 중...');
      const createdCase = await ctx.db.get(caseId);
      console.log('[createClinicalCase] 성공적으로 완료:', {
        caseId,
        name: createdCase?.name,
        shop_id: createdCase?.shop_id,
      });

      // ✅ 프론트엔드 호환성 필드 추가하여 반환
      return createdCase ? addFrontendCompatibilityFields(createdCase) : null;
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
 * ✅ 프론트엔드 상태 지원 추가
 */
export const updateClinicalCaseStatus = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    status: v.union(
      v.literal('active'), // 프론트엔드에서 사용하는 'active' 상태
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('paused'),
      v.literal('cancelled'),
      v.literal('archived') // 프론트엔드에서 사용하는 'archived' 상태
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

      // ✅ 프론트엔드 상태를 백엔드 상태로 변환
      const backendStatus = mapStatusToBackend(args.status);

      // 케이스 상태 업데이트 - 프론트엔드 호환성 필드들도 함께 업데이트
      await ctx.db.patch(args.caseId, {
        status: backendStatus as any,
        end_date: backendStatus === 'completed' ? now : existingCase.end_date,
        notes: args.notes || existingCase.notes,
        updated_at: now,

        // ✅ 프론트엔드 호환성 필드들 업데이트
        updatedAt: new Date(now).toISOString(),
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: args.caseId,
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: { status: oldStatus },
        newValues: { status: backendStatus },
        changedFields: ['status'],
        metadata: {
          operation: 'status_update',
          timestamp: now,
          frontendStatus: args.status, // 원래 프론트엔드 상태도 로그에 기록
          backendStatus: backendStatus,
        },
      });

      // 상태 변경 알림 생성
      if (oldStatus !== backendStatus) {
        await createNotification(ctx, {
          userId: currentUser._id,
          type: 'status_changed',
          title: '임상 케이스 상태 변경',
          message: `임상 케이스 "${existingCase.name}"의 상태가 ${mapStatusToFrontend(oldStatus)}에서 ${args.status}로 변경되었습니다.`,
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
 * ✅ 프론트엔드 호환성 필드들 지원
 */
export const updateClinicalCase = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    updates: v.object({
      // 기본 필드들
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

      // ✅ 프론트엔드 호환성 필드들
      customerName: v.optional(v.string()),
      caseName: v.optional(v.string()),
      concernArea: v.optional(v.string()),
      treatmentPlan: v.optional(v.string()),
      consentReceived: v.optional(v.boolean()),

      // 제품 사용 체크박스
      cureBooster: v.optional(v.boolean()),
      cureMask: v.optional(v.boolean()),
      premiumMask: v.optional(v.boolean()),
      allInOneSerum: v.optional(v.boolean()),

      // 피부 타입 체크박스
      skinRedSensitive: v.optional(v.boolean()),
      skinPigment: v.optional(v.boolean()),
      skinPore: v.optional(v.boolean()),
      skinTrouble: v.optional(v.boolean()),
      skinWrinkle: v.optional(v.boolean()),
      skinEtc: v.optional(v.boolean()),
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

      // ✅ 프론트엔드 필드들을 백엔드 필드로 매핑
      const processedUpdates = { ...args.updates };

      // customerName -> name 매핑
      if (args.updates.customerName) {
        processedUpdates.name = args.updates.customerName;
      }

      // caseName -> case_title 매핑
      if (args.updates.caseName) {
        processedUpdates.case_title = args.updates.caseName;
      }

      // concernArea -> concern_area 매핑
      if (args.updates.concernArea) {
        processedUpdates.concern_area = args.updates.concernArea;
      }

      // treatmentPlan -> treatment_plan 매핑
      if (args.updates.treatmentPlan) {
        processedUpdates.treatment_plan = args.updates.treatmentPlan;
      }

      // consentReceived -> consent_status 매핑
      if (args.updates.consentReceived !== undefined) {
        processedUpdates.consent_status = args.updates.consentReceived ? 'consented' : 'no_consent';
        processedUpdates.consent_date = args.updates.consentReceived ? now : undefined;
      }

      // 업데이트 수행 - 프론트엔드 호환성 필드들도 함께 업데이트
      await ctx.db.patch(args.caseId, {
        ...processedUpdates,
        updated_at: now,
        updatedAt: new Date(now).toISOString(), // 프론트엔드 호환성

        // is_personal 필드 업데이트 (name이 변경된 경우)
        is_personal: processedUpdates.name
          ? existingCase.subject_type === 'self' || processedUpdates.name.trim() === '본인'
          : existingCase.is_personal,
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'clinical_cases',
        recordId: args.caseId,
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: existingCase,
        newValues: processedUpdates,
        changedFields: Object.keys(processedUpdates),
        metadata: {
          operation: 'clinical_case_updated',
          timestamp: now,
          frontendFields: Object.keys(args.updates), // 원래 프론트엔드 필드명들도 기록
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
 * ✅ 프론트엔드 상태 매핑 적용
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
          byStatus: { active: 0, completed: 0, paused: 0, cancelled: 0, archived: 0 }, // 프론트엔드 상태로 변경
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

      // 통계 계산 - 백엔드 상태를 프론트엔드 상태로 매핑
      const stats = {
        total: allCases.length,
        byStatus: {
          active: allCases.filter(c => mapStatusToFrontend(c.status) === 'active').length,
          completed: allCases.filter(c => c.status === 'completed').length,
          paused: allCases.filter(c => c.status === 'paused').length,
          cancelled: allCases.filter(c => c.status === 'cancelled').length,
          archived: allCases.filter(c => c.status === 'archived').length,
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

        // ✅ 추가적인 프론트엔드 호환성 통계
        byPersonalType: {
          personal: allCases.filter(
            c => c.is_personal || c.subject_type === 'self' || c.name?.trim() === '본인'
          ).length,
          customer: allCases.filter(
            c => !c.is_personal && c.subject_type === 'customer' && c.name?.trim() !== '본인'
          ).length,
        },
      };

      return stats;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * ✅ 기존 데이터의 프론트엔드 호환성 필드 마이그레이션
 * 관리자만 실행 가능한 마이그레이션 함수
 */
export const migrateClinicalCasesForFrontendCompatibility = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // true면 실제 업데이트 없이 시뮬레이션만
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser || currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Admin access required');
      }

      console.log(`[마이그레이션] 시작 - ${args.dryRun ? 'DRY RUN' : 'LIVE RUN'}`);

      // 모든 clinical_cases 조회
      const allCases = await ctx.db.query('clinical_cases').collect();
      console.log(`[마이그레이션] 총 ${allCases.length}개 케이스 발견`);

      let updatedCount = 0;
      const updates = [];

      for (const case_ of allCases) {
        const needsUpdate =
          case_.customerName === undefined ||
          case_.consentReceived === undefined ||
          case_.is_personal === undefined ||
          case_.createdAt === undefined ||
          case_.updatedAt === undefined;

        if (needsUpdate) {
          const updateData = {
            // 프론트엔드 호환성 필드들 설정
            customerName: case_.customerName || case_.name,
            consentReceived: case_.consentReceived ?? case_.consent_status === 'consented',
            is_personal:
              case_.is_personal ?? (case_.subject_type === 'self' || case_.name?.trim() === '본인'),
            createdAt: case_.createdAt || new Date(case_.created_at).toISOString(),
            updatedAt: case_.updatedAt || new Date(case_.updated_at).toISOString(),

            // 제품/피부타입 체크박스 필드들 기본값 설정 (undefined인 경우에만)
            cureBooster: case_.cureBooster ?? false,
            cureMask: case_.cureMask ?? false,
            premiumMask: case_.premiumMask ?? false,
            allInOneSerum: case_.allInOneSerum ?? false,
            skinRedSensitive: case_.skinRedSensitive ?? false,
            skinPigment: case_.skinPigment ?? false,
            skinPore: case_.skinPore ?? false,
            skinTrouble: case_.skinTrouble ?? false,
            skinWrinkle: case_.skinWrinkle ?? false,
            skinEtc: case_.skinEtc ?? false,
          };

          updates.push({
            caseId: case_._id,
            currentData: {
              name: case_.name,
              status: case_.status,
              subject_type: case_.subject_type,
              consent_status: case_.consent_status,
            },
            updateData,
          });

          if (!args.dryRun) {
            await ctx.db.patch(case_._id, updateData);
            updatedCount++;
          }
        }
      }

      const summary = {
        totalCases: allCases.length,
        needsUpdate: updates.length,
        updated: args.dryRun ? 0 : updatedCount,
        dryRun: !!args.dryRun,
        updates: args.dryRun ? updates.slice(0, 5) : [], // DRY RUN일 때만 첫 5개 샘플 반환
      };

      console.log(`[마이그레이션] 완료:`, summary);

      // 마이그레이션 로그 생성
      if (!args.dryRun && updatedCount > 0) {
        await createAuditLog(ctx, {
          tableName: 'clinical_cases',
          recordId: 'MIGRATION',
          action: 'UPDATE',
          userId: currentUser._id,
          userRole: currentUser.role,
          oldValues: null,
          newValues: { migratedCases: updatedCount },
          changedFields: ['frontend_compatibility_migration'],
          metadata: {
            operation: 'frontend_compatibility_migration',
            timestamp: Date.now(),
            migratedCount: updatedCount,
          },
        });
      }

      return summary;
    } catch (error) {
      console.error('[마이그레이션] 에러:', error);
      throw formatError(error);
    }
  },
});
