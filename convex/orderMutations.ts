/**
 * 주문 관리 (Order Management) Mutation Functions
 * 기존 POST/PUT/DELETE /api/orders/* 엔드포인트를 대체하는 Convex Mutation 함수들
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import {
  requireAdmin,
  getCurrentUser,
  validateAmount,
  validateCommissionRate,
  generateOrderNumber,
  createAuditLog,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 주문 생성
 * 기존 POST /api/orders 대체
 */
export const createOrder = mutation({
  args: {
    shopId: v.id('profiles'),
    orderDate: v.number(),
    orderNumber: v.optional(v.string()),
    totalAmount: v.number(),
    commissionRate: v.optional(v.number()),
    orderStatus: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('completed'),
        v.literal('cancelled'),
        v.literal('refunded')
      )
    ),
    isSelfShopOrder: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.optional(v.id('products')),
        productName: v.string(),
        productCode: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
        itemCommissionRate: v.optional(v.number()),
      })
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated or profile not found');
      }

      // 권한 확인 (관리자 또는 본인 매장 주문)
      if (currentUser.role !== 'admin' && currentUser._id !== args.shopId) {
        throw new ApiError(
          ERROR_CODES.FORBIDDEN,
          '해당 매장의 주문을 생성할 권한이 없습니다.',
          403
        );
      }

      // 입력 검증
      validateAmount(args.totalAmount, '주문 총액');
      if (args.commissionRate !== undefined) {
        validateCommissionRate(args.commissionRate);
      }

      // 매장 조회
      const shop = await ctx.db.get(args.shopId);
      if (!shop) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '매장을 찾을 수 없습니다.', 404);
      }

      if (shop.status !== 'approved') {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '승인된 매장만 주문을 생성할 수 있습니다.', 403);
      }

      // 주문 번호 생성 (제공되지 않은 경우)
      let orderNumber = args.orderNumber;
      if (!orderNumber) {
        orderNumber = generateOrderNumber();
      }

      // 수수료 계산
      const commissionRate = args.commissionRate || shop.commission_rate || 0.1;
      const commissionAmount = args.totalAmount * commissionRate;

      // 주문 생성
      const orderId = await ctx.db.insert('orders', {
        shop_id: args.shopId,
        order_date: args.orderDate,
        order_number: orderNumber,
        total_amount: args.totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        commission_status: 'calculated',
        order_status: args.orderStatus || 'pending',
        is_self_shop_order: args.isSelfShopOrder || false,
        notes: args.notes,
        metadata: args.metadata,
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: currentUser._id,
      });

      // 주문 항목 생성
      for (const item of args.items) {
        const subtotal = item.quantity * item.unitPrice;
        const itemCommissionRate = item.itemCommissionRate || commissionRate;
        const itemCommissionAmount = subtotal * itemCommissionRate;

        await ctx.db.insert('order_items', {
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          product_code: item.productCode,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: subtotal,
          item_commission_rate: itemCommissionRate,
          item_commission_amount: itemCommissionAmount,
          created_at: Date.now(),
        });
      }

      // 알림 생성 (매장 소유자에게)
      if (currentUser.role === 'admin' && currentUser._id !== args.shopId) {
        await ctx.db.insert('notifications', {
          user_id: args.shopId,
          type: 'order_created',
          title: '새 주문이 생성되었습니다',
          message: `주문번호 ${orderNumber}이 생성되었습니다. 총 금액: ${args.totalAmount.toLocaleString()}원`,
          related_type: 'order',
          related_id: orderId,
          is_read: false,
          priority: 'normal',
          created_at: Date.now(),
        });
      }

      // 감사 로그 생성
      await ctx.db.insert('audit_logs', {
        table_name: 'orders',
        record_id: orderId,
        action: 'INSERT',
        user_id: currentUser._id,
        user_role: currentUser.role,
        new_values: {
          shop_id: args.shopId,
          order_number: orderNumber,
          total_amount: args.totalAmount,
        },
        metadata: {
          action_type: 'order_creation',
          item_count: args.items.length,
        },
        created_at: Date.now(),
      });

      return {
        success: true,
        orderId,
        orderNumber,
        message: '주문이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 주문 수정
 * 기존 PUT /api/orders/[orderId] 대체
 */
export const updateOrder = mutation({
  args: {
    orderId: v.id('orders'),
    updates: v.object({
      orderStatus: v.optional(
        v.union(
          v.literal('pending'),
          v.literal('completed'),
          v.literal('cancelled'),
          v.literal('refunded')
        )
      ),
      totalAmount: v.optional(v.number()),
      commissionRate: v.optional(v.number()),
      notes: v.optional(v.string()),
      metadata: v.optional(v.any()),
    }),
    recalculateCommission: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // 사용자 인증 확인
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated or profile not found');
      }

      // 주문 조회
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      // 권한 확인 (관리자 또는 본인 매장 주문)
      if (currentUser.role !== 'admin' && currentUser._id !== order.shop_id) {
        throw new ApiError(ERROR_CODES.FORBIDDEN, '해당 주문을 수정할 권한이 없습니다.', 403);
      }

      // 업데이트 데이터 준비
      const updateData: any = {
        ...args.updates,
        updated_at: Date.now(),
      };

      // 수수료 재계산이 요청된 경우
      if (args.recalculateCommission || args.updates.totalAmount || args.updates.commissionRate) {
        const newTotalAmount = args.updates.totalAmount || order.total_amount;
        const newCommissionRate = args.updates.commissionRate || order.commission_rate || 0;
        updateData.commission_amount = newTotalAmount * newCommissionRate;
        updateData.commission_status = 'calculated';
      }

      // 주문 상태가 완료로 변경되는 경우
      if (args.updates.orderStatus === 'completed' && order.order_status !== 'completed') {
        updateData.commission_status = 'calculated';

        // 완료 알림 생성
        await ctx.db.insert('notifications', {
          user_id: order.shop_id,
          type: 'status_changed',
          title: '주문이 완료되었습니다',
          message: `주문번호 ${order.order_number}이 완료되었습니다.`,
          related_type: 'order',
          related_id: args.orderId,
          is_read: false,
          priority: 'normal',
          created_at: Date.now(),
        });
      }

      // 주문 업데이트
      await ctx.db.patch(args.orderId, updateData);

      // 감사 로그 생성
      await ctx.db.insert('audit_logs', {
        table_name: 'orders',
        record_id: args.orderId,
        action: 'UPDATE',
        user_id: currentUser._id,
        user_role: currentUser.role,
        old_values: {
          order_status: order.order_status,
          total_amount: order.total_amount,
          commission_rate: order.commission_rate,
        },
        new_values: args.updates,
        changed_fields: Object.keys(args.updates),
        metadata: {
          action_type: 'order_update',
          recalculated_commission: args.recalculateCommission,
        },
        created_at: Date.now(),
      });

      return {
        success: true,
        orderId: args.orderId,
        message: '주문이 업데이트되었습니다.',
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 주문 삭제
 * 기존 DELETE /api/orders/[orderId] 대체
 */
export const deleteOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    // 주문 조회
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다.');
    }

    // 권한 확인 (관리자만 삭제 가능)
    if (currentUser.role !== 'admin') {
      throw new Error('관리자만 주문을 삭제할 수 있습니다.');
    }

    // 이미 완료된 주문은 삭제 불가
    if (order.order_status === 'completed' && order.commission_status === 'paid') {
      throw new Error('이미 완료되고 수수료가 지급된 주문은 삭제할 수 없습니다.');
    }

    // Soft delete: 상태를 cancelled로 변경하고 메타데이터에 삭제 정보 추가
    await ctx.db.patch(args.orderId, {
      order_status: 'cancelled' as const,
      commission_status: 'cancelled' as const,
      updated_at: Date.now(),
      metadata: {
        ...order.metadata,
        deleted_at: Date.now(),
        deleted_by: currentUser._id,
        delete_reason: args.reason,
      },
    });

    // 관련 주문 항목들도 메타데이터 업데이트
    const orderItems = await ctx.db
      .query('order_items')
      .withIndex('by_order', q => q.eq('order_id', args.orderId))
      .collect();

    for (const item of orderItems) {
      await ctx.db.patch(item._id, {
        item_commission_amount: 0, // 수수료 취소
      });
    }

    // 삭제 알림 생성
    await ctx.db.insert('notifications', {
      user_id: order.shop_id,
      type: 'status_changed',
      title: '주문이 취소되었습니다',
      message: args.reason
        ? `주문번호 ${order.order_number}이 취소되었습니다. 사유: ${args.reason}`
        : `주문번호 ${order.order_number}이 취소되었습니다.`,
      related_type: 'order',
      related_id: args.orderId,
      is_read: false,
      priority: 'high',
      created_at: Date.now(),
    });

    // 감사 로그 생성
    await ctx.db.insert('audit_logs', {
      table_name: 'orders',
      record_id: args.orderId,
      action: 'DELETE',
      user_id: currentUser._id,
      user_role: currentUser.role,
      old_values: {
        order_status: order.order_status,
        commission_status: order.commission_status,
      },
      new_values: {
        order_status: 'cancelled',
        commission_status: 'cancelled',
      },
      changed_fields: ['order_status', 'commission_status'],
      metadata: {
        action_type: 'order_deletion',
        reason: args.reason,
      },
      created_at: Date.now(),
    });

    return {
      success: true,
      orderId: args.orderId,
      message: '주문이 삭제되었습니다.',
    };
  },
});

/**
 * 주문 일괄 처리
 * 기존 POST /api/orders/bulk-action 대체
 */
export const bulkOrderAction = mutation({
  args: {
    orderIds: v.array(v.id('orders')),
    action: v.union(
      v.literal('complete'),
      v.literal('cancel'),
      v.literal('approve_commission'),
      v.literal('pay_commission')
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

    // 각 주문에 대해 작업 수행
    for (const orderId of args.orderIds) {
      try {
        const order = await ctx.db.get(orderId);
        if (!order) {
          errors.push({ orderId, error: '주문을 찾을 수 없습니다.' });
          continue;
        }

        let updateData: any = {
          updated_at: Date.now(),
        };

        let notificationMessage = '';

        switch (args.action) {
          case 'complete':
            if (order.order_status === 'completed') {
              errors.push({ orderId, error: '이미 완료된 주문입니다.' });
              continue;
            }
            updateData.order_status = 'completed';
            updateData.commission_status = 'calculated';
            notificationMessage = '주문이 완료되었습니다.';
            break;

          case 'cancel':
            if (order.order_status === 'cancelled') {
              errors.push({ orderId, error: '이미 취소된 주문입니다.' });
              continue;
            }
            updateData.order_status = 'cancelled';
            updateData.commission_status = 'cancelled';
            notificationMessage = '주문이 취소되었습니다.';
            break;

          case 'approve_commission':
            if (order.commission_status === 'paid') {
              errors.push({ orderId, error: '이미 지급된 수수료입니다.' });
              continue;
            }
            updateData.commission_status = 'approved';
            notificationMessage = '수수료가 승인되었습니다.';
            break;

          case 'pay_commission':
            if (order.commission_status === 'paid') {
              errors.push({ orderId, error: '이미 지급된 수수료입니다.' });
              continue;
            }
            updateData.commission_status = 'paid';
            notificationMessage = '수수료가 지급되었습니다.';

            // 수수료 지급 기록 생성 (commission_calculations 테이블과 연동 가능)
            const currentMonth = new Date().getFullYear() * 100 + new Date().getMonth() + 1;

            // 해당 월의 수수료 계산서 조회 또는 생성
            let commissionCalc = await ctx.db
              .query('commission_calculations')
              .withIndex('by_kol_month', q =>
                q.eq('kol_id', order.shop_id).eq('calculation_month', currentMonth)
              )
              .first();

            if (!commissionCalc) {
              // 새로운 수수료 계산서 생성
              await ctx.db.insert('commission_calculations', {
                kol_id: order.shop_id,
                calculation_month: currentMonth,
                subordinate_sales: 0,
                subordinate_commission: 0,
                self_shop_sales: order.total_amount,
                self_shop_commission: order.commission_amount || 0,
                device_count: 0,
                device_commission: 0,
                manual_adjustment: 0,
                total_commission: order.commission_amount || 0,
                status: 'paid',
                payment_date: Date.now(),
                calculated_at: Date.now(),
                paid_at: Date.now(),
                created_by: currentUser._id,
                created_at: Date.now(),
                updated_at: Date.now(),
              });
            } else {
              // 기존 수수료 계산서 업데이트
              await ctx.db.patch(commissionCalc._id, {
                self_shop_sales: (commissionCalc.self_shop_sales || 0) + order.total_amount,
                self_shop_commission:
                  (commissionCalc.self_shop_commission || 0) + (order.commission_amount || 0),
                total_commission:
                  (commissionCalc.total_commission || 0) + (order.commission_amount || 0),
                updated_at: Date.now(),
              });
            }
            break;
        }

        await ctx.db.patch(orderId, updateData);

        // 알림 생성
        await ctx.db.insert('notifications', {
          user_id: order.shop_id,
          type: 'status_changed',
          title: '주문 상태 변경',
          message: `주문번호 ${order.order_number}: ${notificationMessage}`,
          related_type: 'order',
          related_id: orderId,
          is_read: false,
          priority: 'normal',
          created_at: Date.now(),
        });

        // 감사 로그 생성
        await ctx.db.insert('audit_logs', {
          table_name: 'orders',
          record_id: orderId,
          action: 'UPDATE',
          user_id: currentUser._id,
          user_role: currentUser.role,
          old_values: {
            order_status: order.order_status,
            commission_status: order.commission_status,
          },
          new_values: {
            order_status: updateData.order_status || order.order_status,
            commission_status: updateData.commission_status || order.commission_status,
          },
          changed_fields: Object.keys(updateData),
          metadata: {
            bulk_action: args.action,
            reason: args.reason,
          },
          created_at: Date.now(),
        });

        results.push({
          orderId,
          success: true,
          message: `${args.action} 작업이 완료되었습니다.`,
        });
      } catch (error) {
        errors.push({
          orderId,
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
 * 주문 항목 수정
 * 개별 주문 항목 수정
 */
export const updateOrderItem = mutation({
  args: {
    itemId: v.id('order_items'),
    quantity: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    itemCommissionRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    // 현재 사용자 조회
    const currentUser = await ctx.db
      .query('profiles')
      .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
      .first();

    if (!currentUser) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    // 주문 항목 조회
    const orderItem = await ctx.db.get(args.itemId);
    if (!orderItem) {
      throw new Error('주문 항목을 찾을 수 없습니다.');
    }

    // 연관된 주문 조회
    const order = await ctx.db.get(orderItem.order_id);
    if (!order) {
      throw new Error('연관된 주문을 찾을 수 없습니다.');
    }

    // 권한 확인
    if (currentUser.role !== 'admin' && currentUser._id !== order.shop_id) {
      throw new Error('해당 주문 항목을 수정할 권한이 없습니다.');
    }

    // 업데이트 데이터 계산
    const newQuantity = args.quantity || orderItem.quantity;
    const newUnitPrice = args.unitPrice || orderItem.unit_price;
    const newCommissionRate = args.itemCommissionRate || orderItem.item_commission_rate || 0;

    const newSubtotal = newQuantity * newUnitPrice;
    const newCommissionAmount = newSubtotal * newCommissionRate;

    // 주문 항목 업데이트
    await ctx.db.patch(args.itemId, {
      quantity: newQuantity,
      unit_price: newUnitPrice,
      subtotal: newSubtotal,
      item_commission_rate: newCommissionRate,
      item_commission_amount: newCommissionAmount,
    });

    // 주문 총액 재계산
    const allItems = await ctx.db
      .query('order_items')
      .withIndex('by_order', q => q.eq('order_id', order._id))
      .collect();

    const newTotalAmount = allItems.reduce((sum, item) => {
      if (item._id === args.itemId) {
        return sum + newSubtotal;
      }
      return sum + item.subtotal;
    }, 0);

    const newTotalCommission = allItems.reduce((sum, item) => {
      if (item._id === args.itemId) {
        return sum + newCommissionAmount;
      }
      return sum + (item.item_commission_amount || 0);
    }, 0);

    // 주문 업데이트
    await ctx.db.patch(order._id, {
      total_amount: newTotalAmount,
      commission_amount: newTotalCommission,
      updated_at: Date.now(),
    });

    return {
      success: true,
      itemId: args.itemId,
      orderId: order._id,
      newSubtotal,
      newTotalAmount,
      message: '주문 항목이 업데이트되었습니다.',
    };
  },
});
