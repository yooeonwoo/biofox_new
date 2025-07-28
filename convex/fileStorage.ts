import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { getCurrentUser } from './utils';

// 🔗 업로드 URL 생성 Mutations

/**
 * 파일 업로드를 위한 임시 URL 생성
 * Convex 3단계 업로드 프로세스의 Step 1
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * 보안이 필요한 파일 업로드를 위한 URL 생성 (인증 필요)
 */
export const generateSecureUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    // 사용자 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to upload files');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// 💾 파일 메타데이터 저장 Mutations

/**
 * 임상 사진 메타데이터 저장
 * Convex 3단계 업로드 프로세스의 Step 3
 */
export const saveClinicalPhoto = mutation({
  args: {
    storageId: v.id('_storage'),
    clinical_case_id: v.id('clinical_cases'),
    session_number: v.number(),
    photo_type: v.union(v.literal('front'), v.literal('left_side'), v.literal('right_side')),
    file_size: v.optional(v.number()),
    metadata: v.optional(v.any()),
    profileId: v.optional(v.string()), // UUID 문자열로 받음
  },
  handler: async (ctx, args) => {
    // profileId가 제공되면 사용, 아니면 getCurrentUser 사용
    let userId: Id<'profiles'>;
    if (args.profileId) {
      // UUID로 profiles 테이블에서 실제 Convex ID 조회
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.profileId))
        .first();

      if (!profile) {
        throw new Error('Profile not found');
      }
      userId = profile._id;
    } else {
      const user = await getCurrentUser(ctx);
      if (!user) {
        // 인증 정보가 없으면 더 명확한 에러 메시지
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error('User profile not found. Please complete your profile setup.');
      }
      userId = user._id;
    }

    // 기존 같은 세션/타입의 사진이 있는지 확인
    const existingPhoto = await ctx.db
      .query('clinical_photos')
      .withIndex('by_session_type', q =>
        q
          .eq('clinical_case_id', args.clinical_case_id)
          .eq('session_number', args.session_number)
          .eq('photo_type', args.photo_type)
      )
      .first();

    // 기존 사진이 있으면 삭제
    if (existingPhoto) {
      try {
        await ctx.storage.delete(existingPhoto.file_path as Id<'_storage'>);
      } catch (error) {
        console.warn('Failed to delete old file from storage:', error);
      }
      await ctx.db.delete(existingPhoto._id);
    }

    const photoId = await ctx.db.insert('clinical_photos', {
      clinical_case_id: args.clinical_case_id,
      session_number: args.session_number,
      photo_type: args.photo_type,
      file_path: args.storageId, // storageId를 file_path에 저장
      file_size: args.file_size,
      metadata: args.metadata,
      upload_date: Date.now(),
      created_at: Date.now(),
      uploaded_by: userId,
    });

    return photoId;
  },
});

/**
 * 동의서 파일 메타데이터 저장
 */
export const saveConsentFile = mutation({
  args: {
    storageId: v.id('_storage'),
    clinical_case_id: v.id('clinical_cases'),
    file_name: v.string(),
    file_size: v.optional(v.number()),
    file_type: v.optional(v.string()),
    metadata: v.optional(v.any()),
    profileId: v.optional(v.string()), // UUID 문자열로 받음
  },
  handler: async (ctx, args) => {
    // profileId가 제공되면 사용, 아니면 현재 사용자 프로필 조회
    let userId: Id<'profiles'>;
    if (args.profileId) {
      // UUID로 profiles 테이블에서 실제 Convex ID 조회
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', args.profileId))
        .first();

      if (!profile) {
        throw new Error('Profile not found');
      }
      userId = profile._id;
    } else {
      // getCurrentUser 함수 사용하여 일관성 유지
      const user = await getCurrentUser(ctx);
      if (!user) {
        // 인증 정보가 없으면 더 명확한 에러 메시지
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error('User profile not found. Please complete your profile setup.');
      }
      userId = user._id;
    }

    // 기존 동의서 파일이 있는지 확인
    const existingConsent = await ctx.db
      .query('consent_files')
      .withIndex('by_case', q => q.eq('clinical_case_id', args.clinical_case_id))
      .first();

    // 기존 동의서가 있으면 삭제
    if (existingConsent) {
      // Storage에서 이전 파일 삭제
      try {
        await ctx.storage.delete(existingConsent.file_path as Id<'_storage'>);
      } catch (error) {
        console.warn('Failed to delete old consent file from storage:', error);
      }

      // DB에서 기존 레코드 삭제
      await ctx.db.delete(existingConsent._id);
    }

    // 새 동의서 메타데이터 저장
    const consentId = await ctx.db.insert('consent_files', {
      clinical_case_id: args.clinical_case_id,
      file_path: args.storageId, // storageId를 file_path에 저장
      file_name: args.file_name,
      file_size: args.file_size,
      file_type: args.file_type,
      metadata: args.metadata,
      upload_date: Date.now(),
      created_at: Date.now(),
      uploaded_by: userId,
    });

    return consentId;
  },
});

/**
 * 일반 파일 메타데이터 저장
 */
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id('_storage'),
    bucket_name: v.string(),
    file_name: v.string(),
    file_size: v.optional(v.number()),
    mime_type: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // 사용자 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in');
    }

    // 현재 사용자 프로필 조회
    const userProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
      .first();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // 파일 메타데이터 저장
    const fileId = await ctx.db.insert('file_metadata', {
      bucket_name: args.bucket_name,
      file_path: args.storageId, // storageId를 file_path에 저장
      file_name: args.file_name,
      file_size: args.file_size,
      mime_type: args.mime_type,
      uploaded_by: userProfile._id,
      metadata: args.metadata,
      created_at: Date.now(),
    });

    return fileId;
  },
});

// 📖 파일 조회 Queries

/**
 * 파일 URL 생성 (공개 접근 가능한 URL)
 */
export const getFileUrl = query({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * 임상 케이스의 모든 사진 조회
 */
export const getClinicalPhotos = query({
  args: {
    clinical_case_id: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query('clinical_photos')
      .withIndex('by_case', q => q.eq('clinical_case_id', args.clinical_case_id))
      .collect();

    // 각 사진에 URL 추가
    return await Promise.all(
      photos.map(async photo => ({
        ...photo,
        url: await ctx.storage.getUrl(photo.file_path as Id<'_storage'>),
      }))
    );
  },
});

/**
 * 임상 케이스의 동의서 파일 조회
 */
export const getConsentFile = query({
  args: {
    clinical_case_id: v.id('clinical_cases'),
  },
  handler: async (ctx, args) => {
    const consent = await ctx.db
      .query('consent_files')
      .withIndex('by_case', q => q.eq('clinical_case_id', args.clinical_case_id))
      .first();

    if (!consent) {
      return null;
    }

    return {
      ...consent,
      url: await ctx.storage.getUrl(consent.file_path as Id<'_storage'>),
    };
  },
});

/**
 * 파일 메타데이터와 URL 조회
 */
export const getFileWithUrl = query({
  args: {
    fileId: v.id('file_metadata'),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    return {
      ...file,
      url: await ctx.storage.getUrl(file.file_path as Id<'_storage'>),
    };
  },
});

// 🗑️ 파일 삭제 Mutations

/**
 * 임상 사진 삭제 (임시로 인증 제거)
 */
export const deleteClinicalPhoto = mutation({
  args: {
    photoId: v.id('clinical_photos'),
  },
  handler: async (ctx, args) => {
    // 임시로 인증 확인 제거
    // TODO: 나중에 적절한 인증 메커니즘 추가

    // 사진 정보 조회
    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    // Storage에서 파일 삭제
    try {
      await ctx.storage.delete(photo.file_path as Id<'_storage'>);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }

    // DB에서 메타데이터 삭제
    await ctx.db.delete(args.photoId);

    return { success: true };
  },
});

/**
 * 동의서 파일 삭제 (임시로 인증 제거)
 */
export const deleteConsentFile = mutation({
  args: {
    consentId: v.id('consent_files'),
  },
  handler: async (ctx, args) => {
    // 임시로 인증 확인 제거
    // TODO: 나중에 적절한 인증 메커니즘 추가

    // 동의서 정보 조회
    const consent = await ctx.db.get(args.consentId);
    if (!consent) {
      throw new Error('Consent file not found');
    }

    // Storage에서 파일 삭제
    try {
      await ctx.storage.delete(consent.file_path as Id<'_storage'>);
    } catch (error) {
      console.warn('Failed to delete consent file from storage:', error);
    }

    // DB에서 메타데이터 삭제
    await ctx.db.delete(args.consentId);

    return { success: true };
  },
});

/**
 * 일반 파일 삭제
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id('file_metadata'),
  },
  handler: async (ctx, args) => {
    // 사용자 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in');
    }

    // 파일 정보 조회
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // Storage에서 파일 삭제
    try {
      await ctx.storage.delete(file.file_path as Id<'_storage'>);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }

    // DB에서 메타데이터 삭제
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

// 🔍 고급 조회 Queries

/**
 * 사용자가 업로드한 모든 파일 조회
 */
export const getUserFiles = query({
  args: {
    userId: v.optional(v.id('profiles')),
    bucket_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 사용자 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in');
    }

    let targetUserId: Id<'profiles'>;

    // userId가 제공되지 않으면 현재 사용자의 파일만 조회
    if (!args.userId) {
      const userProfile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', q => q.eq('userId', identity.subject as Id<'users'>))
        .first();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      targetUserId = userProfile._id;
    } else {
      targetUserId = args.userId;
    }

    // 파일 조회 (bucket_name으로 필터링 가능)
    let query = ctx.db
      .query('file_metadata')
      .withIndex('by_uploader', q => q.eq('uploaded_by', targetUserId));

    if (args.bucket_name) {
      query = ctx.db
        .query('file_metadata')
        .withIndex('by_bucket_uploader', q =>
          q.eq('bucket_name', args.bucket_name!).eq('uploaded_by', targetUserId)
        );
    }

    const files = await query.collect();

    // 각 파일에 URL 추가
    return await Promise.all(
      files.map(async file => ({
        ...file,
        url: await ctx.storage.getUrl(file.file_path as Id<'_storage'>),
      }))
    );
  },
});

/**
 * 세션별 임상 사진 조회 (정렬된 결과)
 */
export const getClinicalPhotosBySession = query({
  args: {
    clinical_case_id: v.id('clinical_cases'),
    session_number: v.number(),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query('clinical_photos')
      .withIndex('by_session', q =>
        q.eq('clinical_case_id', args.clinical_case_id).eq('session_number', args.session_number)
      )
      .collect();

    // photo_type 순으로 정렬하고 URL 추가
    const sortedPhotos = photos.sort((a, b) => {
      const order = { front: 0, left_side: 1, right_side: 2 };
      return order[a.photo_type] - order[b.photo_type];
    });

    return await Promise.all(
      sortedPhotos.map(async photo => ({
        ...photo,
        url: await ctx.storage.getUrl(photo.file_path as Id<'_storage'>),
      }))
    );
  },
});
