/**
 * 사용자 관리 (User Management) Mutation Functions
 * 기존 POST/PUT/DELETE /api/users/* 엔드포인트를 대체하는 Convex Mutation 함수들
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * 사용자 정보 수정
 * 기존 PUT /api/users/[userId] 대체
 */
export const updateUser = mutation({
  args: {
    userId: v.id('profiles'),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(
        v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner'))
      ),
      status: v.optional(
        v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))
      ),
      shop_name: v.optional(v.string()),
      region: v.optional(v.string()),
      naver_place_link: v.optional(v.string()),
      commission_rate: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회 및 권한 확인
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 수정할 사용자 조회
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 이메일 중복 검사 (이메일이 변경되는 경우)
    if (args.updates.email && args.updates.email !== targetUser.email) {
      const existingUser = await ctx.db
        .query('profiles')
        .withIndex('by_email', q => q.eq('email', args.updates.email!))
        .first();

      if (existingUser && existingUser._id !== args.userId) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
    }

    // 상태가 승인으로 변경되는 경우 승인 정보 추가
    const updateData: any = {
      ...args.updates,
      updated_at: Date.now(),
    };

    if (args.updates.status === 'approved' && targetUser.status !== 'approved') {
      updateData.approved_at = Date.now();
      updateData.approved_by = currentUser._id;
    }

    // 사용자 정보 업데이트
    await ctx.db.patch(args.userId, updateData);

    // 감사 로그 생성
    await ctx.db.insert('audit_logs', {
      table_name: 'profiles',
      record_id: args.userId,
      action: 'UPDATE',
      user_id: currentUser._id,
      user_role: currentUser.role,
      old_values: {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
      },
      new_values: args.updates,
      changed_fields: Object.keys(args.updates),
      created_at: Date.now(),
    });

    return {
      success: true,
      userId: args.userId,
      message: '사용자 정보가 업데이트되었습니다.',
    };
  },
});

/**
 * 사용자 일괄 작업
 * 기존 POST /api/users/bulk-action 대체
 */
export const bulkUserAction = mutation({
  args: {
    userIds: v.array(v.id('profiles')),
    action: v.union(
      v.literal('approve'),
      v.literal('reject'),
      v.literal('activate'),
      v.literal('deactivate'),
      v.literal('delete')
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회 및 권한 확인
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    const results = [];
    const errors = [];

    // 각 사용자에 대해 작업 수행
    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) {
          errors.push({ userId, error: '사용자를 찾을 수 없습니다.' });
          continue;
        }

        let updateData: any = {
          updated_at: Date.now(),
        };

        switch (args.action) {
          case 'approve':
            updateData.status = 'approved';
            updateData.approved_at = Date.now();
            updateData.approved_by = currentUser._id;
            break;
          case 'reject':
            updateData.status = 'rejected';
            break;
          case 'activate':
            updateData.status = 'approved';
            break;
          case 'deactivate':
            updateData.status = 'pending';
            break;
          case 'delete':
            // 실제 삭제 대신 상태 변경 (soft delete)
            updateData.status = 'rejected';
            updateData.metadata = {
              ...user.metadata,
              deleted_at: Date.now(),
              deleted_by: currentUser._id,
              delete_reason: args.reason,
            };
            break;
        }

        await ctx.db.patch(userId, updateData);

        // 감사 로그 생성
        await ctx.db.insert('audit_logs', {
          table_name: 'profiles',
          record_id: userId,
          action: 'UPDATE',
          user_id: currentUser._id,
          user_role: currentUser.role,
          old_values: { status: user.status },
          new_values: { status: updateData.status },
          changed_fields: ['status'],
          metadata: {
            bulk_action: args.action,
            reason: args.reason,
          },
          created_at: Date.now(),
        });

        results.push({
          userId,
          success: true,
          message: `${args.action} 작업이 완료되었습니다.`,
        });
      } catch (error) {
        errors.push({
          userId,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    };
  },
});

/**
 * 사용자 승인
 * 개별 사용자 승인 처리
 */
export const approveUser = mutation({
  args: {
    userId: v.id('profiles'),
    commission_rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회 및 권한 확인
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 승인할 사용자 조회
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (user.status === 'approved') {
      throw new Error('이미 승인된 사용자입니다.');
    }

    // 사용자 승인 처리
    const updateData: any = {
      status: 'approved' as const,
      approved_at: Date.now(),
      approved_by: currentUser._id,
      updated_at: Date.now(),
    };

    // 수수료율이 제공된 경우 설정
    if (args.commission_rate !== undefined) {
      updateData.commission_rate = args.commission_rate;
    }

    await ctx.db.patch(args.userId, updateData);

    // 알림 생성
    await ctx.db.insert('notifications', {
      user_id: args.userId,
      type: 'status_changed',
      title: '계정 승인 완료',
      message: '귀하의 계정이 승인되었습니다. 이제 모든 서비스를 이용하실 수 있습니다.',
      is_read: false,
      priority: 'normal',
      created_at: Date.now(),
    });

    // 감사 로그 생성
    await ctx.db.insert('audit_logs', {
      table_name: 'profiles',
      record_id: args.userId,
      action: 'UPDATE',
      user_id: currentUser._id,
      user_role: currentUser.role,
      old_values: { status: user.status },
      new_values: { status: 'approved' },
      changed_fields: ['status', 'approved_at', 'approved_by'],
      metadata: {
        action_type: 'user_approval',
        commission_rate: args.commission_rate,
      },
      created_at: Date.now(),
    });

    return {
      success: true,
      userId: args.userId,
      message: '사용자가 승인되었습니다.',
    };
  },
});

/**
 * 사용자 거절
 * 개별 사용자 거절 처리
 */
export const rejectUser = mutation({
  args: {
    userId: v.id('profiles'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회 및 권한 확인
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 거절할 사용자 조회
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (user.status === 'rejected') {
      throw new Error('이미 거절된 사용자입니다.');
    }

    // 사용자 거절 처리
    await ctx.db.patch(args.userId, {
      status: 'rejected' as const,
      updated_at: Date.now(),
      metadata: {
        ...user.metadata,
        rejected_at: Date.now(),
        rejected_by: currentUser._id,
        rejection_reason: args.reason,
      },
    });

    // 알림 생성
    await ctx.db.insert('notifications', {
      user_id: args.userId,
      type: 'status_changed',
      title: '계정 승인 거절',
      message: args.reason
        ? `계정 승인이 거절되었습니다. 사유: ${args.reason}`
        : '계정 승인이 거절되었습니다.',
      is_read: false,
      priority: 'high',
      created_at: Date.now(),
    });

    // 감사 로그 생성
    await ctx.db.insert('audit_logs', {
      table_name: 'profiles',
      record_id: args.userId,
      action: 'UPDATE',
      user_id: currentUser._id,
      user_role: currentUser.role,
      old_values: { status: user.status },
      new_values: { status: 'rejected' },
      changed_fields: ['status'],
      metadata: {
        action_type: 'user_rejection',
        reason: args.reason,
      },
      created_at: Date.now(),
    });

    return {
      success: true,
      userId: args.userId,
      message: '사용자가 거절되었습니다.',
    };
  },
});

/**
 * 소속 관계 생성
 * 상위-하위 매장 관계 설정
 */
export const createRelationship = mutation({
  args: {
    shopOwnerId: v.id('profiles'),
    parentId: v.optional(v.id('profiles')),
    relationshipType: v.optional(
      v.union(v.literal('direct'), v.literal('transferred'), v.literal('temporary'))
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회 및 권한 확인
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 매장 소유자 조회
    const shopOwner = await ctx.db.get(args.shopOwnerId);
    if (!shopOwner) {
      throw new Error('매장 소유자를 찾을 수 없습니다.');
    }

    // 상위 사용자 조회 (선택사항)
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error('상위 사용자를 찾을 수 없습니다.');
      }

      // 순환 참조 방지 (간단한 체크)
      if (args.parentId === args.shopOwnerId) {
        throw new Error('자기 자신을 상위로 설정할 수 없습니다.');
      }
    }

    // 기존 활성 관계 확인
    const existingRelationship = await ctx.db
      .query('shop_relationships')
      .withIndex('by_shop_owner', q => q.eq('shop_owner_id', args.shopOwnerId))
      .filter(q => q.eq(q.field('is_active'), true))
      .first();

    if (existingRelationship) {
      // 기존 관계 비활성화
      await ctx.db.patch(existingRelationship._id, {
        is_active: false,
        ended_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    // 새 관계 생성
    const relationshipId = await ctx.db.insert('shop_relationships', {
      shop_owner_id: args.shopOwnerId,
      parent_id: args.parentId,
      started_at: Date.now(),
      is_active: true,
      relationship_type: args.relationshipType || 'direct',
      notes: args.notes,
      created_at: Date.now(),
      updated_at: Date.now(),
      created_by: currentUser._id,
    });

    // 하위 매장 수 업데이트 (상위 사용자가 있는 경우)
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent) {
        await ctx.db.patch(args.parentId, {
          total_subordinates: (parent.total_subordinates || 0) + 1,
          active_subordinates: (parent.active_subordinates || 0) + 1,
          updated_at: Date.now(),
        });
      }
    }

    // 감사 로그 생성
    await ctx.db.insert('audit_logs', {
      table_name: 'shop_relationships',
      record_id: relationshipId,
      action: 'INSERT',
      user_id: currentUser._id,
      user_role: currentUser.role,
      new_values: {
        shop_owner_id: args.shopOwnerId,
        parent_id: args.parentId,
        relationship_type: args.relationshipType,
      },
      metadata: {
        action_type: 'relationship_creation',
      },
      created_at: Date.now(),
    });

    return {
      success: true,
      relationshipId,
      message: '소속 관계가 생성되었습니다.',
    };
  },
});
