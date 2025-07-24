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
