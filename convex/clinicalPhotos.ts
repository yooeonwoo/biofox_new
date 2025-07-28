/**
 * 임상 사진 관련 추가 함수들
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { getCurrentUser, createAuditLog, ApiError, ERROR_CODES, formatError } from './utils';

/**
 * 케이스의 사진 목록 조회
 */
export const getClinicalPhotos = query({
  args: {
    caseId: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    try {
      const photos = await ctx.db
        .query('clinical_photos')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .order('asc')
        .collect();

      return photos;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 사진 업로드 (메타데이터 저장)
 */
export const uploadClinicalPhoto = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    sessionNumber: v.number(),
    photoType: v.union(v.literal('front'), v.literal('left_side'), v.literal('right_side')),
    storageId: v.id('_storage'),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    profileId: v.optional(v.string()), // UUID 문자열로 받음
  },
  handler: async (ctx, args) => {
    try {
      // 프로필 확인
      let currentUser: { _id: Id<'profiles'>; role: string } | null = null;
      if (args.profileId) {
        // UUID로 profiles 테이블에서 실제 Convex ID 조회
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.profileId))
          .first();
        currentUser = profile;
      } else {
        currentUser = await getCurrentUser(ctx);
      }

      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
      }

      // 케이스 권한 확인
      const clinicalCase = await ctx.db.get(args.caseId);
      if (!clinicalCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (clinicalCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      const now = Date.now();

      // 사진 메타데이터 저장
      const photoId = await ctx.db.insert('clinical_photos', {
        clinical_case_id: args.caseId,
        session_number: args.sessionNumber,
        photo_type: args.photoType,
        file_path: args.storageId,
        file_size: args.fileSize,
        metadata: {
          fileName: args.fileName,
          uploadedBy: currentUser._id,
        },
        upload_date: now,
        created_at: now,
        uploaded_by: currentUser._id,
      });

      // 케이스의 사진 수 업데이트
      const photoCount = await ctx.db
        .query('clinical_photos')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .collect();

      await ctx.db.patch(args.caseId, {
        photo_count: photoCount.length,
        latest_session: Math.max(...photoCount.map(p => p.session_number || 1)),
        updated_at: now,
      });

      // 감사 로그
      await createAuditLog(ctx, {
        tableName: 'clinical_photos',
        recordId: photoId,
        action: 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: null,
        newValues: {
          clinical_case_id: args.caseId,
          session_number: args.sessionNumber,
          photo_type: args.photoType,
          file_path: args.storageId,
        },
        changedFields: ['clinical_case_id', 'session_number', 'photo_type', 'file_path'],
        metadata: {
          operation: 'upload_clinical_photo',
          timestamp: now,
        },
      });

      return photoId;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 임상 사진 삭제
 */
export const deleteClinicalPhoto = mutation({
  args: {
    photoId: v.id('clinical_photos'),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
      }

      // 사진 조회
      const photo = await ctx.db.get(args.photoId);
      if (!photo) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Photo not found');
      }

      // 케이스 권한 확인
      const clinicalCase = await ctx.db.get(photo.clinical_case_id);
      if (!clinicalCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (clinicalCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      // 사진 삭제
      await ctx.db.delete(args.photoId);

      // 케이스의 사진 수 업데이트
      const remainingPhotos = await ctx.db
        .query('clinical_photos')
        .withIndex('by_case', q => q.eq('clinical_case_id', photo.clinical_case_id))
        .collect();

      await ctx.db.patch(photo.clinical_case_id, {
        photo_count: remainingPhotos.length,
        latest_session:
          remainingPhotos.length > 0
            ? Math.max(...remainingPhotos.map(p => p.session_number || 1))
            : 0,
        updated_at: Date.now(),
      });

      // 감사 로그
      await createAuditLog(ctx, {
        tableName: 'clinical_photos',
        recordId: args.photoId,
        action: 'DELETE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {
          clinical_case_id: photo.clinical_case_id,
          session_number: photo.session_number,
          photo_type: photo.photo_type,
        },
        newValues: null,
        changedFields: ['deleted'],
        metadata: {
          operation: 'delete_clinical_photo',
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
 * 동의서 파일 조회
 */
export const getConsentFile = query({
  args: {
    caseId: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    try {
      const consentFile = await ctx.db
        .query('consent_files')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .first();

      return consentFile;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 동의서 파일 저장
 */
export const saveConsentFile = mutation({
  args: {
    caseId: v.id('clinical_cases'),
    storageId: v.id('_storage'),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
      }

      // 케이스 권한 확인
      const clinicalCase = await ctx.db.get(args.caseId);
      if (!clinicalCase) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'Clinical case not found');
      }

      if (clinicalCase.shop_id !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Access denied');
      }

      const now = Date.now();

      // 기존 동의서 파일이 있는지 확인
      const existingFile = await ctx.db
        .query('consent_files')
        .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
        .first();

      let fileId: Id<'consent_files'>;

      if (existingFile) {
        // 기존 파일 업데이트
        await ctx.db.patch(existingFile._id, {
          file_path: args.storageId,
          file_name: args.fileName,
          file_size: args.fileSize,
          file_type: args.fileType || 'application/octet-stream',
          upload_date: now,
          uploaded_by: currentUser._id,
        });
        fileId = existingFile._id;
      } else {
        // 새 파일 생성
        fileId = await ctx.db.insert('consent_files', {
          clinical_case_id: args.caseId,
          file_path: args.storageId,
          file_name: args.fileName,
          file_size: args.fileSize || 0,
          file_type: args.fileType || 'application/octet-stream',
          upload_date: now,
          uploaded_by: currentUser._id,
          created_at: now,
        });
      }

      // 케이스의 동의서 상태 업데이트
      await ctx.db.patch(args.caseId, {
        consent_status: 'consented',
        consent_date: now,
        updated_at: now,
      });

      // 감사 로그
      await createAuditLog(ctx, {
        tableName: 'consent_files',
        recordId: fileId,
        action: existingFile ? 'UPDATE' : 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: existingFile
          ? {
              file_path: existingFile.file_path,
              file_name: existingFile.file_name,
            }
          : null,
        newValues: {
          file_path: args.storageId,
          file_name: args.fileName,
        },
        changedFields: ['file_path', 'file_name'],
        metadata: {
          operation: existingFile ? 'update_consent_file' : 'upload_consent_file',
          caseId: args.caseId,
          timestamp: now,
        },
      });

      return fileId;
    } catch (error) {
      throw formatError(error);
    }
  },
});
