import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import {
  validateOrderCreation,
  validateTotalAmount,
  validateCommissionRate,
  validateQuantity,
  validatePrice,
} from './validation';

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
    // 📋 날짜 범위 검증
    if (args.start_date > args.end_date) {
      throw new Error('Start date must be before end date');
    }

    let orders;

    if (args.shop_id) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id!))
        .collect();
    } else {
      orders = await ctx.db.query('orders').collect();
    }

    // 날짜 범위 필터링
    return orders.filter(
      order => order.order_date >= args.start_date && order.order_date <= args.end_date
    );
  },
});

// 새 주문 생성
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
    const now = Date.now();

    // 📋 주문 데이터 검증
    const orderValidation = validateOrderCreation({
      total_amount: orderData.total_amount,
      commission_rate: orderData.commission_rate,
      order_date: now,
    });

    if (!orderValidation.isValid) {
      throw new Error(`Order validation failed: ${orderValidation.errors.join(', ')}`);
    }

    // 📋 주문 항목 검증
    for (const item of items) {
      if (!validateQuantity(item.quantity)) {
        throw new Error(`Invalid quantity for item: ${item.product_name}`);
      }

      if (!validatePrice(item.unit_price)) {
        throw new Error(`Invalid unit price for item: ${item.product_name}`);
      }

      if (
        item.item_commission_rate !== undefined &&
        !validateCommissionRate(item.item_commission_rate)
      ) {
        throw new Error(`Invalid commission rate for item: ${item.product_name}`);
      }

      // 소계 검증
      const expectedSubtotal = item.quantity * item.unit_price;
      if (Math.abs(expectedSubtotal) > 999999999) {
        throw new Error(`Subtotal out of range for item: ${item.product_name}`);
      }
    }

    // 📋 총액과 항목 합계 일치성 검증
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const tolerance = 0.01; // 1센트 허용 오차
    if (Math.abs(itemsTotal - orderData.total_amount) > tolerance) {
      throw new Error('Total amount does not match sum of items');
    }

    // 주문 생성
    const orderId = await ctx.db.insert('orders', {
      ...orderData,
      order_date: now,
      commission_amount: (orderData.total_amount * (orderData.commission_rate || 0)) / 100,
      commission_status: 'calculated',
      order_status: 'pending',
      metadata: {},
      created_at: now,
      updated_at: now,
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
        created_at: now,
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
    commission_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { order_id, ...updateData } = args;

    // 📋 커미션 금액 검증
    if (updateData.commission_amount !== undefined) {
      if (!validateTotalAmount(updateData.commission_amount)) {
        throw new Error('Commission amount is out of valid range');
      }
    }

    await ctx.db.patch(order_id, {
      ...updateData,
      updated_at: Date.now(),
    });

    return order_id;
  },
});

// 월별 매출 조회
export const getMonthlySales = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    // 📋 연도 및 월 검증
    if (args.year < 2000 || args.year > 3000) {
      throw new Error('Year must be between 2000 and 3000');
    }

    if (args.month < 1 || args.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    // 해당 월의 시작과 끝 타임스탬프 계산
    const startDate = new Date(args.year, args.month - 1, 1);
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59, 999);

    let orders;

    if (args.shop_id) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id!))
        .collect();
    } else {
      orders = await ctx.db.query('orders').collect();
    }

    // 날짜 범위 필터링 및 완료된 주문만
    const monthlyOrders = orders.filter(
      order =>
        order.order_date >= startDate.getTime() &&
        order.order_date <= endDate.getTime() &&
        order.order_status === 'completed'
    );

    const totalSales = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalCommission = monthlyOrders.reduce(
      (sum, order) => sum + (order.commission_amount || 0),
      0
    );

    return {
      totalSales,
      totalCommission,
      orderCount: monthlyOrders.length,
      orders: monthlyOrders,
    };
  },
});
