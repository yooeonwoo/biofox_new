/**
 * 알림 관리 (Notification Management) Query & Mutation Functions
 * 기존 /api/kol-new/notifications/* 엔드포인트를 대체하는 Convex 함수들
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import {
  getCurrentUser,
  requireRole,
  createAuditLog,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 사용자의 알림 목록 조회 (페이지네이션 지원)
 */
export const getUserNotifications = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    isRead: v.optional(v.boolean()),
    type: v.optional(
      v.union(
        v.literal('system'),
        v.literal('crm_update'),
        v.literal('order_created'),
        v.literal('commission_paid'),
        v.literal('clinical_progress'),
        v.literal('approval_required'),
        v.literal('status_changed'),
        v.literal('reminder')
      )
    ),
    priority: v.optional(v.union(v.literal('low'), v.literal('normal'), v.literal('high'))),

    // 정렬 옵션
    sortBy: v.optional(v.union(v.literal('created_at'), v.literal('priority'))),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await getCurrentUser(ctx);

      // 알림 조회 쿼리 구성
      let notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('by_user', q => q.eq('user_id', currentUser._id));

      const allNotifications = await notificationsQuery.collect();

      // 필터링
      let filteredNotifications = allNotifications.filter(notification => {
        // 읽음 상태 필터
        if (args.isRead !== undefined && notification.is_read !== args.isRead) {
          return false;
        }

        // 타입 필터
        if (args.type && notification.type !== args.type) {
          return false;
        }

        // 우선순위 필터
        if (args.priority && notification.priority !== args.priority) {
          return false;
        }

        return true;
      });

      // 정렬
      const sortBy = args.sortBy || 'created_at';
      const sortOrder = args.sortOrder || 'desc';

      filteredNotifications.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'priority':
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            break;
          default: // created_at
            aValue = a.created_at;
            bValue = b.created_at;
        }

        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      // 알림 데이터 변환
      const notifications = filteredNotifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        priority: notification.priority,
        relatedType: notification.related_type,
        relatedId: notification.related_id,
        createdAt: notification.created_at,
        metadata: notification.metadata,
      }));

      // 페이지네이션 적용
      const startIndex = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor) : 0;
      const endIndex = startIndex + args.paginationOpts.numItems;
      const paginatedNotifications = notifications.slice(startIndex, endIndex);
      const hasMore = endIndex < notifications.length;

      return {
        page: paginatedNotifications,
        isDone: !hasMore,
        continueCursor: hasMore ? endIndex.toString() : null,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 읽지 않은 알림 개수 조회
 */
export const getUnreadNotificationCount = query({
  args: {},
  handler: async ctx => {
    try {
      // 현재 사용자 조회
      const currentUser = await getCurrentUser(ctx);

      // 읽지 않은 알림 개수 조회
      const unreadNotifications = await ctx.db
        .query('notifications')
        .withIndex('by_user', q => q.eq('user_id', currentUser._id))
        .filter(q => q.eq(q.field('is_read'), false))
        .collect();

      return {
        unreadCount: unreadNotifications.length,
        hasHighPriority: unreadNotifications.some(n => n.priority === 'high'),
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 특정 알림을 읽음으로 표시
 */
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await getCurrentUser(ctx);

      // 알림 조회
      const notification = await ctx.db.get(args.notificationId);
      if (!notification) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '알림을 찾을 수 없습니다.');
      }

      // 권한 확인 (본인의 알림인지)
      if (notification.user_id !== currentUser._id) {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '다른 사용자의 알림에 접근할 수 없습니다.');
      }

      // 이미 읽은 알림인 경우 그냥 반환
      if (notification.is_read) {
        return { success: true, alreadyRead: true };
      }

      // 읽음 상태 업데이트
      await ctx.db.patch(args.notificationId, {
        is_read: true,
        read_at: Date.now(),
      });

      return { success: true, alreadyRead: false };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 모든 알림을 읽음으로 표시
 */
export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async ctx => {
    try {
      // 현재 사용자 조회
      const currentUser = await getCurrentUser(ctx);

      // 읽지 않은 알림들 조회
      const unreadNotifications = await ctx.db
        .query('notifications')
        .withIndex('by_user', q => q.eq('user_id', currentUser._id))
        .filter(q => q.eq(q.field('is_read'), false))
        .collect();

      // 모든 읽지 않은 알림을 읽음으로 표시
      const readTime = Date.now();
      for (const notification of unreadNotifications) {
        await ctx.db.patch(notification._id, {
          is_read: true,
          read_at: readTime,
        });
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'notifications',
        recordId: 'bulk_mark_read',
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: { is_read: false },
        newValues: { is_read: true },
        changedFields: ['is_read', 'read_at'],
        metadata: {
          action_type: 'mark_all_notifications_read',
          count: unreadNotifications.length,
        },
      });

      return {
        success: true,
        markedCount: unreadNotifications.length,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 알림 삭제 (소프트 삭제 또는 완전 삭제)
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
    permanent: v.optional(v.boolean()), // 완전 삭제 여부 (기본: false)
  },
  handler: async (ctx, args) => {
    try {
      // 현재 사용자 조회
      const currentUser = await getCurrentUser(ctx);

      // 알림 조회
      const notification = await ctx.db.get(args.notificationId);
      if (!notification) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '알림을 찾을 수 없습니다.');
      }

      // 권한 확인 (본인의 알림인지)
      if (notification.user_id !== currentUser._id) {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '다른 사용자의 알림을 삭제할 수 없습니다.');
      }

      if (args.permanent) {
        // 완전 삭제
        await ctx.db.delete(args.notificationId);
      } else {
        // 소프트 삭제 (메타데이터에 삭제 표시)
        await ctx.db.patch(args.notificationId, {
          metadata: {
            ...notification.metadata,
            deleted: true,
            deleted_at: Date.now(),
          },
        });
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'notifications',
        recordId: args.notificationId,
        action: 'DELETE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {
          type: notification.type,
          title: notification.title,
        },
        newValues: {},
        changedFields: ['deleted'],
        metadata: {
          action_type: args.permanent ? 'permanent_delete' : 'soft_delete',
        },
      });

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 알림 생성 (관리자용)
 */
export const createNotification = mutation({
  args: {
    userId: v.id('profiles'),
    type: v.union(
      v.literal('system'),
      v.literal('crm_update'),
      v.literal('order_created'),
      v.literal('commission_paid'),
      v.literal('clinical_progress'),
      v.literal('approval_required'),
      v.literal('status_changed'),
      v.literal('reminder')
    ),
    title: v.string(),
    message: v.string(),
    priority: v.optional(v.union(v.literal('low'), v.literal('normal'), v.literal('high'))),
    relatedType: v.optional(v.string()),
    relatedId: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireRole(ctx, ['admin']);

      // 타겟 사용자 존재 확인
      const targetUser = await ctx.db.get(args.userId);
      if (!targetUser) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '대상 사용자를 찾을 수 없습니다.');
      }

      // 알림 생성
      const notificationId = await ctx.db.insert('notifications', {
        user_id: args.userId,
        type: args.type,
        title: args.title,
        message: args.message,
        is_read: false,
        priority: args.priority || 'normal',
        related_type: args.relatedType,
        related_id: args.relatedId,
        metadata: args.metadata || {},
        created_at: Date.now(),
      });

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'notifications',
        recordId: notificationId,
        action: 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {},
        newValues: {
          user_id: args.userId,
          type: args.type,
          title: args.title,
        },
        changedFields: ['user_id', 'type', 'title', 'message'],
        metadata: {
          action_type: 'admin_create_notification',
          target_user_id: args.userId,
        },
      });

      return {
        success: true,
        notificationId,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 일괄 알림 생성 (관리자용)
 */
export const createBulkNotifications = mutation({
  args: {
    userIds: v.array(v.id('profiles')),
    type: v.union(
      v.literal('system'),
      v.literal('crm_update'),
      v.literal('order_created'),
      v.literal('commission_paid'),
      v.literal('clinical_progress'),
      v.literal('approval_required'),
      v.literal('status_changed'),
      v.literal('reminder')
    ),
    title: v.string(),
    message: v.string(),
    priority: v.optional(v.union(v.literal('low'), v.literal('normal'), v.literal('high'))),
    relatedType: v.optional(v.string()),
    relatedId: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireRole(ctx, ['admin']);

      let created = 0;
      let errors = [];

      for (const userId of args.userIds) {
        try {
          // 사용자 존재 확인
          const targetUser = await ctx.db.get(userId);
          if (!targetUser) {
            errors.push(`User ${userId} not found`);
            continue;
          }

          // 알림 생성
          await ctx.db.insert('notifications', {
            user_id: userId,
            type: args.type,
            title: args.title,
            message: args.message,
            is_read: false,
            priority: args.priority || 'normal',
            related_type: args.relatedType,
            related_id: args.relatedId,
            metadata: args.metadata || {},
            created_at: Date.now(),
          });

          created++;
        } catch (error) {
          errors.push(`Error for user ${userId}: ${(error as Error).message}`);
        }
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'notifications',
        recordId: 'bulk_notification_creation',
        action: 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {},
        newValues: {
          type: args.type,
          title: args.title,
          bulk_creation: true,
        },
        changedFields: ['bulk_notifications'],
        metadata: {
          action_type: 'bulk_create_notifications',
          target_user_count: args.userIds.length,
          created_count: created,
          error_count: errors.length,
        },
      });

      return {
        success: errors.length === 0,
        created,
        failed: errors.length,
        errors: errors.slice(0, 10), // 최대 10개 에러만 반환
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});
