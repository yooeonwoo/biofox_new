/**
 * 주문 관리 (Orders Management) - 간단한 구현
 * 기존 /api/orders/* 엔드포인트를 대체하는 Convex 함수들
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { requireAdmin } from './auth';

/**
 * 주문 목록 조회 (기본)
 */
export const getOrders = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    const limit = args.limit || 20;

    let orders;
    if (args.shop_id) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id!))
        .order('desc')
        .take(limit);
    } else {
      orders = await ctx.db.query('orders').order('desc').take(limit);
    }

    // 각 주문에 대해 관련 데이터 조회
    const ordersWithDetails = await Promise.all(
      orders.map(async order => {
        // Shop 정보 조회
        const shop = await ctx.db.get(order.shop_id);

        // 주문 아이템 조회
        const orderItems = await ctx.db
          .query('order_items')
          .withIndex('by_order', q => q.eq('order_id', order._id))
          .collect();

        return {
          ...order,
          shop: shop
            ? {
                _id: shop._id,
                name: shop.name,
                shop_name: shop.shop_name,
                email: shop.email,
                role: shop.role,
              }
            : null,
          order_items: orderItems,
        };
      })
    );

    return ordersWithDetails;
  },
});

/**
 * 주문 생성 (간단한 버전)
 */
export const createSimpleOrder = mutation({
  args: {
    shop_id: v.id('profiles'),
    order_date: v.string(),
    total_amount: v.number(),
    order_number: v.optional(v.string()),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        product_name: v.string(),
        quantity: v.number(),
        unit_price: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    const { profile } = await requireAdmin(ctx);

    const now = Date.now();
    const orderDate = new Date(args.order_date).getTime();

    // 주문 생성
    const orderId = await ctx.db.insert('orders', {
      shop_id: args.shop_id,
      order_date: orderDate,
      order_number: args.order_number,
      total_amount: args.total_amount,
      commission_rate: 0,
      commission_amount: 0,
      commission_status: 'calculated',
      order_status: 'completed',
      is_self_shop_order: false,
      notes: args.notes,
      created_by: profile._id,
      created_at: now,
      updated_at: now,
    });

    // 주문 아이템 생성
    for (const item of args.items) {
      await ctx.db.insert('order_items', {
        order_id: orderId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
        created_at: now,
      });
    }

    return { orderId, success: true };
  },
});

/**
 * 주문 통계 조회
 */
export const getOrdersStats = query({
  args: {},
  handler: async ctx => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    const orders = await ctx.db.query('orders').collect();

    const stats = {
      total_orders: orders.length,
      total_sales: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      total_commission: orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0),
    };

    return stats;
  },
});

/**
 * 월별 매출 통계 조회 (Dashboard용)
 */
export const getMonthlySales = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    year: v.number(),
    month: v.number(), // 1-12
    includeSubordinates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { shop_id, year, month, includeSubordinates = false } = args;

    // 해당 월의 시작과 끝 타임스탬프 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    let orders;

    if (shop_id) {
      // 특정 매장의 주문들
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', shop_id))
        .filter(q =>
          q.and(
            q.gte(q.field('order_date'), startTimestamp),
            q.lte(q.field('order_date'), endTimestamp)
          )
        )
        .collect();

      // 하위 매장 포함 옵션
      if (includeSubordinates) {
        const subordinates = await ctx.db
          .query('shop_relationships')
          .withIndex('by_parent_active', q => q.eq('parent_id', shop_id).eq('is_active', true))
          .collect();

        for (const subordinate of subordinates) {
          const subordinateOrders = await ctx.db
            .query('orders')
            .withIndex('by_shop', q => q.eq('shop_id', subordinate.shop_owner_id))
            .filter(q =>
              q.and(
                q.gte(q.field('order_date'), startTimestamp),
                q.lte(q.field('order_date'), endTimestamp)
              )
            )
            .collect();
          orders.push(...subordinateOrders);
        }
      }
    } else {
      // 전체 주문 조회
      orders = await ctx.db
        .query('orders')
        .withIndex('by_date', q =>
          q.gte('order_date', startTimestamp).lte('order_date', endTimestamp)
        )
        .collect();
    }

    // 매출 통계 계산
    const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalCommission = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
    const orderCount = orders.length;

    // 상품별 매출 (order_items에서 계산)
    let productSales = 0;
    let deviceSales = 0;

    for (const order of orders) {
      const orderItems = await ctx.db
        .query('order_items')
        .withIndex('by_order', q => q.eq('order_id', order._id))
        .collect();

      for (const item of orderItems) {
        const product = item.product_id ? await ctx.db.get(item.product_id) : null;
        const itemTotal = item.quantity * item.unit_price;

        if (product?.category === 'device') {
          deviceSales += itemTotal;
        } else {
          productSales += itemTotal;
        }
      }
    }

    return {
      year,
      month,
      totalSales,
      totalCommission,
      orderCount,
      productSales,
      deviceSales,
      averageOrderValue: orderCount > 0 ? Math.round(totalSales / orderCount) : 0,
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        commissionAmount: order.commission_amount || 0,
        orderDate: order.order_date,
        status: order.order_status,
      })),
    };
  },
});

/**
 * Dashboard용 요약 통계 조회
 */
export const getDashboardStats = query({
  args: {
    kolId: v.id('profiles'),
    includeSubordinates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { kolId, includeSubordinates = true } = args;

    // 현재 월과 이전 월 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    // 현재 월 데이터 직접 계산
    const currentMonthData = {
      totalSales: 0,
      totalCommission: 0,
      orderCount: 0,
    };

    // 이전 월 데이터 직접 계산
    const previousMonthData = {
      totalSales: 0,
      totalCommission: 0,
      orderCount: 0,
    };

    // 현재 월 주문 조회
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1).getTime();
    const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999).getTime();

    let currentOrders = await ctx.db
      .query('orders')
      .withIndex('by_shop', q => q.eq('shop_id', kolId))
      .filter(q =>
        q.and(
          q.gte(q.field('order_date'), currentMonthStart),
          q.lte(q.field('order_date'), currentMonthEnd)
        )
      )
      .collect();

    if (includeSubordinates) {
      const subordinates = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kolId).eq('is_active', true))
        .collect();

      for (const subordinate of subordinates) {
        const subordinateOrders = await ctx.db
          .query('orders')
          .withIndex('by_shop', q => q.eq('shop_id', subordinate.shop_owner_id))
          .filter(q =>
            q.and(
              q.gte(q.field('order_date'), currentMonthStart),
              q.lte(q.field('order_date'), currentMonthEnd)
            )
          )
          .collect();
        currentOrders.push(...subordinateOrders);
      }
    }

    currentMonthData.totalSales = currentOrders.reduce((sum, order) => sum + order.total_amount, 0);
    currentMonthData.totalCommission = currentOrders.reduce(
      (sum, order) => sum + (order.commission_amount || 0),
      0
    );
    currentMonthData.orderCount = currentOrders.length;

    // 이전 월 주문 조회
    const previousMonthStart = new Date(previousYear, previousMonth - 1, 1).getTime();
    const previousMonthEnd = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999).getTime();

    let previousOrders = await ctx.db
      .query('orders')
      .withIndex('by_shop', q => q.eq('shop_id', kolId))
      .filter(q =>
        q.and(
          q.gte(q.field('order_date'), previousMonthStart),
          q.lte(q.field('order_date'), previousMonthEnd)
        )
      )
      .collect();

    if (includeSubordinates) {
      const subordinates = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kolId).eq('is_active', true))
        .collect();

      for (const subordinate of subordinates) {
        const subordinateOrders = await ctx.db
          .query('orders')
          .withIndex('by_shop', q => q.eq('shop_id', subordinate.shop_owner_id))
          .filter(q =>
            q.and(
              q.gte(q.field('order_date'), previousMonthStart),
              q.lte(q.field('order_date'), previousMonthEnd)
            )
          )
          .collect();
        previousOrders.push(...subordinateOrders);
      }
    }

    previousMonthData.totalSales = previousOrders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    previousMonthData.totalCommission = previousOrders.reduce(
      (sum, order) => sum + (order.commission_amount || 0),
      0
    );
    previousMonthData.orderCount = previousOrders.length;

    // 성장률 계산
    const salesGrowth = calculateGrowthRate(
      currentMonthData.totalSales,
      previousMonthData.totalSales
    );
    const commissionGrowth = calculateGrowthRate(
      currentMonthData.totalCommission,
      previousMonthData.totalCommission
    );

    return {
      currentMonth: {
        sales: currentMonthData.totalSales,
        commission: currentMonthData.totalCommission,
        orderCount: currentMonthData.orderCount,
      },
      previousMonth: {
        sales: previousMonthData.totalSales,
        commission: previousMonthData.totalCommission,
        orderCount: previousMonthData.orderCount,
      },
      growth: {
        sales: salesGrowth,
        commission: commissionGrowth,
      },
    };
  },
});

// 헬퍼 함수
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
