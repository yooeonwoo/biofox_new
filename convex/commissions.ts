/**
 * 커미션 관리 (Commission Management) Query & Mutation Functions
 * 기존 /api/commissions/* 엔드포인트를 대체하는 Convex 함수들
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import {
  requireAdmin,
  getCurrentUser,
  validateAmount,
  validateCommissionRate,
  createAuditLog,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 커미션 목록 조회 (페이지네이션, 필터링, 정렬 지원)
 */
export const listCommissions = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    month: v.optional(v.string()), // YYYY-MM 형식
    kolId: v.optional(v.id('profiles')),
    status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('adjusted'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),

    // 정렬 옵션
    sortBy: v.optional(
      v.union(v.literal('created_at'), v.literal('commission_amount'), v.literal('order_date'))
    ),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 월 필터 처리
      let startDate: number | undefined, endDate: number | undefined;
      if (args.month) {
        const [year, month] = args.month.split('-').map(Number);
        if (!year || !month || month < 1 || month > 12) {
          throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '잘못된 월 형식입니다.');
        }
        startDate = new Date(year, month - 1, 1).getTime();
        endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      }

      // 주문 조회 (커미션 정보 포함)
      let allOrders;
      if (args.kolId) {
        allOrders = await ctx.db
          .query('orders')
          .withIndex('by_shop', q => q.eq('shop_id', args.kolId))
          .collect();
      } else {
        allOrders = await ctx.db.query('orders').collect();
      }

      // 필터링
      let filteredOrders = allOrders.filter(order => {
        // 날짜 필터
        if (startDate && endDate) {
          if (order.order_date < startDate || order.order_date > endDate) {
            return false;
          }
        }

        // 상태 필터
        if (args.status && order.commission_status !== args.status) {
          return false;
        }

        // 금액 필터
        if (args.minAmount && (order.commission_amount || 0) < args.minAmount) {
          return false;
        }
        if (args.maxAmount && (order.commission_amount || 0) > args.maxAmount) {
          return false;
        }

        return true;
      });

      // 정렬
      const sortBy = args.sortBy || 'created_at';
      const sortOrder = args.sortOrder || 'desc';

      filteredOrders.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'commission_amount':
            aValue = a.commission_amount || 0;
            bValue = b.commission_amount || 0;
            break;
          case 'order_date':
            aValue = a.order_date;
            bValue = b.order_date;
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

      // 커미션 데이터 변환
      const commissions = await Promise.all(
        filteredOrders.map(async order => {
          const shop = await ctx.db.get(order.shop_id);
          return {
            id: order._id,
            orderId: order._id,
            orderNumber: order.order_number || `ORD-${order._id}`,
            shopId: order.shop_id,
            shopName: shop?.shop_name || shop?.name || 'Unknown Shop',
            kolName: shop?.name || 'Unknown KOL',
            orderDate: order.order_date,
            orderAmount: order.total_amount,
            commissionRate: order.commission_rate || 0,
            commissionAmount: order.commission_amount || 0,
            commissionStatus: order.commission_status,
            orderStatus: order.order_status,
            notes: order.notes,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
          };
        })
      );

      // 페이지네이션 적용
      const { page, isDone, continueCursor } = await ctx.db
        .query('orders')
        .order('desc')
        .paginate(args.paginationOpts);

      return {
        page: commissions.slice(0, args.paginationOpts.numItems),
        isDone: commissions.length <= args.paginationOpts.numItems,
        continueCursor: commissions.length > args.paginationOpts.numItems ? 'next' : null,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 커미션 요약 정보 조회
 */
export const getCommissionSummary = query({
  args: {
    month: v.optional(v.string()), // YYYY-MM 형식
    kolId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 월 필터 처리
      let startDate: number | undefined, endDate: number | undefined;
      if (args.month) {
        const [year, month] = args.month.split('-').map(Number);
        startDate = new Date(year, month - 1, 1).getTime();
        endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      }

      // 주문 조회
      let allOrders;
      if (args.kolId) {
        allOrders = await ctx.db
          .query('orders')
          .withIndex('by_shop', q => q.eq('shop_id', args.kolId))
          .collect();
      } else {
        allOrders = await ctx.db.query('orders').collect();
      }

      // 필터링
      const orders = allOrders.filter(order => {
        if (startDate && endDate) {
          return order.order_date >= startDate && order.order_date <= endDate;
        }
        return true;
      });

      // 요약 계산
      const summary = {
        totalOrders: orders.length,
        totalSales: orders.reduce((sum, order) => sum + order.total_amount, 0),
        totalCommissions: orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0),

        // 상태별 통계
        calculated: orders.filter(o => o.commission_status === 'calculated').length,
        adjusted: orders.filter(o => o.commission_status === 'adjusted').length,
        paid: orders.filter(o => o.commission_status === 'paid').length,
        cancelled: orders.filter(o => o.commission_status === 'cancelled').length,

        // 금액별 통계
        calculatedAmount: orders
          .filter(o => o.commission_status === 'calculated')
          .reduce((sum, order) => sum + (order.commission_amount || 0), 0),
        adjustedAmount: orders
          .filter(o => o.commission_status === 'adjusted')
          .reduce((sum, order) => sum + (order.commission_amount || 0), 0),
        paidAmount: orders
          .filter(o => o.commission_status === 'paid')
          .reduce((sum, order) => sum + (order.commission_amount || 0), 0),
      };

      return summary;
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 월별 커미션 계산 (새로운 커미션 생성)
 */
export const calculateMonthlyCommissions = mutation({
  args: {
    month: v.string(), // YYYY-MM 형식
    forceRecalculate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireAdmin(ctx);

      // 월 형식 검증
      const [year, month] = args.month.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '잘못된 월 형식입니다.');
      }

      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      // 해당 월의 완료된 주문들 조회
      const allOrders = await ctx.db.query('orders').collect();
      const monthlyOrders = allOrders.filter(
        order =>
          order.order_date >= startDate &&
          order.order_date <= endDate &&
          order.order_status === 'completed' &&
          (args.forceRecalculate || order.commission_status === 'calculated')
      );

      let processed = 0;
      let errors = [];

      for (const order of monthlyOrders) {
        try {
          // 매장 정보 조회
          const shop = await ctx.db.get(order.shop_id);
          if (!shop) {
            errors.push(`Shop not found for order ${order._id}`);
            continue;
          }

          // 커미션 재계산
          const commissionRate = order.commission_rate || shop.commission_rate || 0.1;
          const commissionAmount = order.total_amount * commissionRate;

          // 주문 업데이트
          await ctx.db.patch(order._id, {
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            commission_status: 'calculated',
            updated_at: Date.now(),
          });

          processed++;
        } catch (error) {
          errors.push(`Error processing order ${order._id}: ${(error as Error).message}`);
        }
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'orders',
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {},
        newValues: { commission_calculation: args.month },
        changedFields: ['commission_amount', 'commission_status'],
        metadata: {
          action_type: 'monthly_commission_calculation',
          month: args.month,
          processed_count: processed,
          error_count: errors.length,
        },
      });

      return {
        success: errors.length === 0,
        processed,
        failed: errors.length,
        errors: errors.slice(0, 10), // 최대 10개 에러만 반환
        month: args.month,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 커미션 상태 업데이트
 */
export const updateCommissionStatus = mutation({
  args: {
    orderIds: v.array(v.id('orders')),
    status: v.union(
      v.literal('calculated'),
      v.literal('adjusted'),
      v.literal('paid'),
      v.literal('cancelled')
    ),
    adjustmentAmount: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireAdmin(ctx);

      // 조정 금액 검증
      if (args.adjustmentAmount !== undefined) {
        validateAmount(args.adjustmentAmount, 'Adjustment amount');
      }

      let processed = 0;
      let errors = [];

      for (const orderId of args.orderIds) {
        try {
          const order = await ctx.db.get(orderId);
          if (!order) {
            errors.push(`Order ${orderId} not found`);
            continue;
          }

          const updateData: any = {
            commission_status: args.status,
            updated_at: Date.now(),
          };

          // 조정된 상태인 경우 조정 금액 적용
          if (args.status === 'adjusted' && args.adjustmentAmount !== undefined) {
            updateData.commission_amount = args.adjustmentAmount;
          }

          // 주문 업데이트
          await ctx.db.patch(orderId, updateData);

          // 감사 로그 생성
          await createAuditLog(ctx, {
            tableName: 'orders',
            recordId: orderId,
            action: 'UPDATE',
            userId: currentUser._id,
            userRole: currentUser.role,
            oldValues: {
              commission_status: order.commission_status,
              commission_amount: order.commission_amount,
            },
            newValues: updateData,
            changedFields: Object.keys(updateData),
            metadata: {
              action_type: 'commission_status_update',
              reason: args.reason,
            },
          });

          // 지급 완료 시 알림 생성
          if (args.status === 'paid') {
            await createNotification(ctx, {
              userId: order.shop_id,
              type: 'commission_paid',
              title: '커미션 지급 완료',
              message: `${order.order_number || order._id} 주문의 커미션이 지급되었습니다.`,
              relatedType: 'order',
              relatedId: orderId,
              priority: 'normal',
            });
          }

          processed++;
        } catch (error) {
          errors.push(`Error updating order ${orderId}: ${(error as Error).message}`);
        }
      }

      return {
        success: errors.length === 0,
        processed,
        failed: errors.length,
        errors: errors.slice(0, 10),
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 커미션 상세 정보 조회
 */
export const getCommissionDetail = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '주문을 찾을 수 없습니다.');
      }

      // 주문 항목들 조회
      const orderItems = await ctx.db
        .query('order_items')
        .withIndex('by_order', q => q.eq('order_id', args.orderId))
        .collect();

      // 매장 정보 조회
      const shop = await ctx.db.get(order.shop_id);

      // 관련 감사 로그 조회
      const auditLogs = await ctx.db
        .query('audit_logs')
        .filter(q => q.eq(q.field('record_id'), args.orderId))
        .order('desc')
        .take(10);

      return {
        order: {
          id: order._id,
          orderNumber: order.order_number,
          orderDate: order.order_date,
          orderStatus: order.order_status,
          totalAmount: order.total_amount,
          commissionRate: order.commission_rate,
          commissionAmount: order.commission_amount,
          commissionStatus: order.commission_status,
          notes: order.notes,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        },
        shop: shop
          ? {
              id: shop._id,
              name: shop.name,
              shopName: shop.shop_name,
              email: shop.email,
              region: shop.region,
            }
          : null,
        items: orderItems.map(item => ({
          id: item._id,
          productName: item.product_name,
          productCode: item.product_code,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
          itemCommissionRate: item.item_commission_rate,
          itemCommissionAmount: item.item_commission_amount,
        })),
        auditLogs: auditLogs.map(log => ({
          id: log._id,
          action: log.action,
          changedFields: log.changed_fields,
          oldValues: log.old_values,
          newValues: log.new_values,
          userRole: log.user_role,
          createdAt: log.created_at,
          metadata: log.metadata,
        })),
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});
