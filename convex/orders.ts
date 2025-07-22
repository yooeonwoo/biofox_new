import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// 매장별 주문 조회
export const getOrdersByShop = query({
  args: { shop_id: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_shop', q => q.eq('shop_id', args.shop_id))
      .order('desc')
      .collect();
  },
});

// 주문 ID로 조회 (주문 항목 포함)
export const getOrderWithItems = query({
  args: { order_id: v.id('orders') },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.order_id);
    if (!order) return null;

    const items = await ctx.db
      .query('order_items')
      .withIndex('by_order', q => q.eq('order_id', args.order_id))
      .collect();

    return { ...order, items };
  },
});

// 날짜 범위별 주문 조회
export const getOrdersByDateRange = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    start_date: v.number(),
    end_date: v.number(),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.shop_id !== undefined) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id))
        .collect();
    } else {
      orders = await ctx.db.query('orders').collect();
    }

    return orders.filter(
      order => order.order_date >= args.start_date && order.order_date <= args.end_date
    );
  },
});

// 새 주문 생성 (주문 항목과 함께)
export const createOrder = mutation({
  args: {
    shop_id: v.id('profiles'),
    order_number: v.optional(v.string()),
    total_amount: v.number(),
    commission_rate: v.optional(v.number()),
    is_self_shop_order: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    created_by: v.id('profiles'),
    items: v.array(
      v.object({
        product_id: v.optional(v.id('products')),
        product_name: v.string(),
        product_code: v.optional(v.string()),
        quantity: v.number(),
        unit_price: v.number(),
        item_commission_rate: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { items, ...orderData } = args;

    // 주문 생성
    const orderId = await ctx.db.insert('orders', {
      ...orderData,
      order_date: Date.now(),
      commission_amount: (orderData.total_amount * (orderData.commission_rate || 0)) / 100,
      commission_status: 'calculated',
      order_status: 'pending',
      metadata: {},
    });

    // 주문 항목들 생성
    for (const item of items) {
      const subtotal = item.quantity * item.unit_price;
      const item_commission_amount = item.item_commission_rate
        ? (subtotal * item.item_commission_rate) / 100
        : undefined;

      await ctx.db.insert('order_items', {
        order_id: orderId,
        ...item,
        subtotal,
        item_commission_amount,
      });
    }

    return orderId;
  },
});

// 주문 상태 업데이트
export const updateOrderStatus = mutation({
  args: {
    order_id: v.id('orders'),
    order_status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('refunded')
    ),
    commission_status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('adjusted'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
  },
  handler: async (ctx, args) => {
    const { order_id, ...updates } = args;

    await ctx.db.patch(order_id, updates);
    return order_id;
  },
});

// 월별 주문 통계
export const getMonthlyOrderStats = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const startOfNextMonth = new Date(args.year, args.month, 1).getTime();

    let orders;

    if (args.shop_id) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id))
        .collect();
    } else {
      orders = await ctx.db.query('orders').collect();
    }
    const monthlyOrders = orders.filter(
      order => order.order_date >= startOfMonth && order.order_date < startOfNextMonth
    );

    const totalOrders = monthlyOrders.length;
    const totalAmount = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalCommission = monthlyOrders.reduce(
      (sum, order) => sum + (order.commission_amount || 0),
      0
    );

    return {
      totalOrders,
      totalAmount,
      totalCommission,
      averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
    };
  },
});
