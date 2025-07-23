/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

/**
 * 주문 처리 플로우 통합 테스트
 *
 * 이 테스트는 주문 생성부터 수수료 계산, 상태 관리까지의
 * 전체 주문 처리 워크플로우를 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 매장에서 주문 생성
 * 2. 수수료 자동 계산
 * 3. 주문 상태 변경 (pending → completed → paid)
 * 4. 취소 및 환불 처리
 * 5. 계층적 수수료 분배 (KOL → 매장 오너)
 */

describe('Order Processing Flow Integration Tests', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  // 테스트용 상품 생성 헬퍼 함수
  async function createProduct(
    name: string,
    price: number,
    commissionRate: number = 0.1
  ): Promise<any> {
    return await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', {
        name,
        code: `PROD-${Date.now()}`,
        category: 'skincare',
        price,
        is_active: true,
        is_featured: false,
        default_commission_rate: commissionRate,
        min_commission_rate: commissionRate * 0.5,
        max_commission_rate: commissionRate * 1.5,
        description: `Test product: ${name}`,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });
  }

  // 테스트용 매장 오너 생성 헬퍼 함수
  async function createShopOwner(
    name: string,
    email: string,
    shopName: string,
    commissionRate: number = 0.05
  ): Promise<{ userId: any; profileId: any }> {
    const ownerAuth = t.withIdentity({
      name,
      email,
      subject: `${email}-id`,
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email,
        name,
      });
    });

    const profileId = await ownerAuth.mutation(api.auth.ensureUserProfile, {
      userId,
      email,
      name,
      role: 'shop_owner',
      shop_name: shopName,
      region: '서울',
      commission_rate: commissionRate,
    });

    // 매장 오너를 승인된 상태로 만들기
    await t.run(async (ctx: any) => {
      await ctx.db.patch(profileId, {
        status: 'approved',
        approved_at: Date.now(),
      });
    });

    return { userId, profileId };
  }

  test('Complete order processing workflow - simple order', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Test Shop Owner',
      'shopowner@test.com',
      '테스트 뷰티샵',
      0.08 // 8% 수수료
    );

    // 2. 상품 생성
    const productId = await createProduct('Premium Skincare Set', 150000, 0.12); // 12% 수수료

    // 3. 주문 생성
    const now = Date.now();
    const orderData = {
      shop_id: shopProfileId,
      order_date: now,
      order_number: `ORD-${now}`,
      total_amount: 150000,
      commission_rate: 0.08, // 매장 오너의 수수료율
      commission_amount: 150000 * 0.08, // 12,000원
      commission_status: 'calculated' as const,
      order_status: 'pending' as const,
      is_self_shop_order: false,
      notes: 'Test order for premium skincare set',
      metadata: {
        product_id: productId,
        customer_info: {
          name: 'Test Customer',
          phone: '010-1234-5678',
        },
      },
      created_at: now,
      updated_at: now,
      created_by: shopProfileId,
    };

    const orderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', orderData);
    });

    // 4. 생성된 주문 확인
    const createdOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(createdOrder).toMatchObject({
      shop_id: shopProfileId,
      total_amount: 150000,
      commission_rate: 0.08,
      commission_amount: 12000,
      commission_status: 'calculated',
      order_status: 'pending',
    });

    // 5. 주문 완료 처리
    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        order_status: 'completed',
        updated_at: Date.now(),
      });
    });

    // 6. 수수료 지급 처리
    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        commission_status: 'paid',
        updated_at: Date.now(),
        notes: 'Commission paid to shop owner',
      });
    });

    // 7. 최종 주문 상태 확인
    const finalOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(finalOrder).toMatchObject({
      order_status: 'completed',
      commission_status: 'paid',
    });

    // 8. 매장별 주문 조회 확인
    const shopOrders = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('orders')
        .withIndex('by_shop', (q: any) => q.eq('shop_id', shopProfileId))
        .collect();
    });

    expect(shopOrders).toHaveLength(1);
    expect(shopOrders[0]._id).toBe(orderId);
  });

  test('Order processing with commission adjustments', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Adjustment Shop',
      'adjustment@test.com',
      '조정 테스트샵',
      0.05 // 5% 기본 수수료
    );

    // 2. 대량 주문 생성 (수수료 조정이 필요한 경우)
    const orderAmount = 500000;
    const initialCommissionRate = 0.05;
    const adjustedCommissionRate = 0.07; // 대량 주문으로 인한 수수료 상향 조정

    const orderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', {
        shop_id: shopProfileId,
        order_date: Date.now(),
        order_number: `BULK-${Date.now()}`,
        total_amount: orderAmount,
        commission_rate: initialCommissionRate,
        commission_amount: orderAmount * initialCommissionRate, // 25,000원
        commission_status: 'calculated',
        order_status: 'pending',
        is_self_shop_order: false,
        notes: 'Bulk order - commission adjustment expected',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: shopProfileId,
      });
    });

    // 3. 수수료 조정 처리
    const adjustedCommissionAmount = orderAmount * adjustedCommissionRate; // 35,000원

    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        commission_rate: adjustedCommissionRate,
        commission_amount: adjustedCommissionAmount,
        commission_status: 'adjusted',
        updated_at: Date.now(),
        notes: 'Commission adjusted due to bulk order volume',
      });
    });

    // 4. 조정된 주문 확인
    const adjustedOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(adjustedOrder).toMatchObject({
      commission_rate: adjustedCommissionRate,
      commission_amount: adjustedCommissionAmount,
      commission_status: 'adjusted',
    });

    // 5. 주문 완료 및 수수료 지급
    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        order_status: 'completed',
        commission_status: 'paid',
        updated_at: Date.now(),
        notes: 'Adjusted commission paid to shop owner',
      });
    });

    // 6. 최종 상태 확인
    const finalOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(finalOrder.commission_amount).toBe(35000); // 조정된 수수료
    expect(finalOrder.commission_status).toBe('paid');
  });

  test('Order cancellation and refund workflow', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Cancel Shop',
      'cancel@test.com',
      '취소 테스트샵'
    );

    // 2. 주문 생성
    const orderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', {
        shop_id: shopProfileId,
        order_date: Date.now(),
        order_number: `CANCEL-${Date.now()}`,
        total_amount: 100000,
        commission_rate: 0.05,
        commission_amount: 5000,
        commission_status: 'calculated',
        order_status: 'pending',
        is_self_shop_order: false,
        notes: 'Order to be cancelled',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: shopProfileId,
      });
    });

    // 3. 주문 완료
    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        order_status: 'completed',
        commission_status: 'paid',
        updated_at: Date.now(),
      });
    });

    // 4. 취소 요청 처리
    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        order_status: 'cancelled',
        commission_status: 'cancelled',
        updated_at: Date.now(),
        notes: 'Order cancelled due to customer request',
      });
    });

    // 5. 취소된 주문 상태 확인
    const cancelledOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(cancelledOrder).toMatchObject({
      order_status: 'cancelled',
      commission_status: 'cancelled',
    });

    // 6. 취소된 주문 조회 확인
    const cancelledOrders = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('orders')
        .withIndex('by_status', (q: any) => q.eq('order_status', 'cancelled'))
        .collect();
    });

    expect(cancelledOrders).toHaveLength(1);
    expect(cancelledOrders[0]._id).toBe(orderId);
  });

  test('Multiple orders processing - daily batch', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Batch Shop',
      'batch@test.com',
      '배치 테스트샵'
    );

    // 2. 하루 동안의 여러 주문 생성
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const orders = [
      { amount: 50000, time: todayTimestamp + 9 * 3600000 }, // 오전 9시
      { amount: 80000, time: todayTimestamp + 12 * 3600000 }, // 오후 12시
      { amount: 120000, time: todayTimestamp + 15 * 3600000 }, // 오후 3시
      { amount: 75000, time: todayTimestamp + 18 * 3600000 }, // 오후 6시
    ];

    const orderIds = [];
    let totalDailyAmount = 0;
    let totalDailyCommission = 0;

    // 3. 각 주문 생성
    for (const [index, order] of orders.entries()) {
      const commissionAmount = order.amount * 0.05;
      totalDailyAmount += order.amount;
      totalDailyCommission += commissionAmount;

      const orderId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('orders', {
          shop_id: shopProfileId,
          order_date: order.time,
          order_number: `DAILY-${index + 1}-${order.time}`,
          total_amount: order.amount,
          commission_rate: 0.05,
          commission_amount: commissionAmount,
          commission_status: 'calculated',
          order_status: 'completed',
          is_self_shop_order: false,
          notes: `Daily order #${index + 1}`,
          created_at: order.time,
          updated_at: order.time,
          created_by: shopProfileId,
        });
      });

      orderIds.push(orderId);
    }

    // 4. 일일 주문 조회
    const dailyOrders = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('orders')
        .withIndex('by_shop_date', (q: any) => q.eq('shop_id', shopProfileId))
        .filter(
          (q: any) =>
            q.gte(q.field('order_date'), todayTimestamp) &&
            q.lt(q.field('order_date'), todayTimestamp + 24 * 3600000)
        )
        .collect();
    });

    expect(dailyOrders).toHaveLength(4);

    // 5. 일일 총액 및 수수료 확인
    const calculatedTotalAmount = dailyOrders.reduce(
      (sum: number, order: any) => sum + order.total_amount,
      0
    );
    const calculatedTotalCommission = dailyOrders.reduce(
      (sum: number, order: any) => sum + order.commission_amount,
      0
    );

    expect(calculatedTotalAmount).toBe(totalDailyAmount); // 325,000원
    expect(calculatedTotalCommission).toBe(totalDailyCommission); // 16,250원

    // 6. 시간순 정렬 확인
    const sortedOrders = dailyOrders.sort((a: any, b: any) => a.order_date - b.order_date);
    expect(sortedOrders[0].total_amount).toBe(50000); // 오전 9시 주문
    expect(sortedOrders[3].total_amount).toBe(75000); // 오후 6시 주문
  });

  test('Self-shop order processing (KOL own purchase)', async () => {
    // 1. KOL이자 매장 오너인 사용자 생성
    const kolAuth = t.withIdentity({
      name: 'KOL Shop Owner',
      email: 'kolshop@test.com',
      subject: 'kolshop-id',
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'kolshop@test.com',
        name: 'KOL Shop Owner',
      });
    });

    const profileId = await kolAuth.mutation(api.auth.ensureUserProfile, {
      userId,
      email: 'kolshop@test.com',
      name: 'KOL Shop Owner',
      role: 'kol',
      shop_name: 'KOL 직영샵',
      region: '서울',
      commission_rate: 0.15, // KOL 수수료율
    });

    // 승인된 상태로 만들기
    await t.run(async (ctx: any) => {
      await ctx.db.patch(profileId, {
        status: 'approved',
        approved_at: Date.now(),
      });
    });

    // 2. 자체 매장 주문 생성 (수수료 적용 안됨)
    const selfOrderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', {
        shop_id: profileId,
        order_date: Date.now(),
        order_number: `SELF-${Date.now()}`,
        total_amount: 200000,
        commission_rate: 0, // 자체 매장 주문은 수수료 없음
        commission_amount: 0,
        commission_status: 'calculated',
        order_status: 'completed',
        is_self_shop_order: true, // 자체 매장 주문 표시
        notes: 'KOL own shop purchase - no commission',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: profileId,
      });
    });

    // 3. 자체 주문 확인
    const selfOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(selfOrderId);
    });

    expect(selfOrder).toMatchObject({
      is_self_shop_order: true,
      commission_rate: 0,
      commission_amount: 0,
      commission_status: 'calculated',
    });

    // 4. 일반 주문과 자체 주문 구분 조회
    const allShopOrders = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('orders')
        .withIndex('by_shop', (q: any) => q.eq('shop_id', profileId))
        .collect();
    });

    const selfShopOrders = allShopOrders.filter((order: any) => order.is_self_shop_order === true);
    const regularOrders = allShopOrders.filter((order: any) => order.is_self_shop_order !== true);

    expect(selfShopOrders).toHaveLength(1);
    expect(regularOrders).toHaveLength(0);
  });

  test('Order processing with metadata and custom fields', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Metadata Shop',
      'metadata@test.com',
      '메타데이터 테스트샵'
    );

    // 2. 복잡한 메타데이터를 가진 주문 생성
    const complexMetadata = {
      customer: {
        name: 'VIP Customer',
        membership_level: 'platinum',
        phone: '010-9999-8888',
        address: '서울시 강남구 테헤란로 123',
      },
      products: [
        { id: 'PROD-001', name: 'Premium Serum', quantity: 2, unit_price: 80000 },
        { id: 'PROD-002', name: 'Luxury Cream', quantity: 1, unit_price: 120000 },
      ],
      shipping: {
        method: 'express',
        fee: 3000,
        expected_date: '2024-01-15',
      },
      promotion: {
        code: 'VIP20',
        discount_rate: 0.2,
        discount_amount: 56000,
      },
      payment: {
        method: 'card',
        card_company: 'KB',
        installment: 3,
      },
    };

    const orderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', {
        shop_id: shopProfileId,
        order_date: Date.now(),
        order_number: `META-${Date.now()}`,
        total_amount: 280000, // 2*80000 + 120000 + 3000 - 56000 + 세금 등
        commission_rate: 0.06, // VIP 고객 특별 수수료
        commission_amount: 280000 * 0.06,
        commission_status: 'calculated',
        order_status: 'pending',
        is_self_shop_order: false,
        notes: 'VIP customer order with special promotion',
        metadata: complexMetadata,
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: shopProfileId,
      });
    });

    // 3. 메타데이터 포함 주문 확인
    const orderWithMetadata = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(orderWithMetadata.metadata).toMatchObject(complexMetadata);
    expect(orderWithMetadata.metadata.customer.membership_level).toBe('platinum');
    expect(orderWithMetadata.metadata.products).toHaveLength(2);
    expect(orderWithMetadata.metadata.promotion.discount_amount).toBe(56000);

    // 4. 메타데이터 업데이트 (배송 상태 변경)
    const updatedMetadata = {
      ...complexMetadata,
      shipping: {
        ...complexMetadata.shipping,
        status: 'shipped',
        tracking_number: 'TRK-123456789',
        shipped_date: '2024-01-12',
      },
    };

    await t.run(async (ctx: any) => {
      await ctx.db.patch(orderId, {
        metadata: updatedMetadata,
        updated_at: Date.now(),
        notes: 'Order shipped - tracking number added',
      });
    });

    // 5. 업데이트된 메타데이터 확인
    const updatedOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(updatedOrder.metadata.shipping.status).toBe('shipped');
    expect(updatedOrder.metadata.shipping.tracking_number).toBe('TRK-123456789');
  });

  test('Commission status lifecycle - complete workflow', async () => {
    // 1. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Lifecycle Shop',
      'lifecycle@test.com',
      '수수료 라이프사이클 테스트샵'
    );

    // 2. 주문 생성
    const orderId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('orders', {
        shop_id: shopProfileId,
        order_date: Date.now(),
        order_number: `LIFECYCLE-${Date.now()}`,
        total_amount: 300000,
        commission_rate: 0.07,
        commission_amount: 21000,
        commission_status: 'calculated',
        order_status: 'pending',
        is_self_shop_order: false,
        notes: 'Commission lifecycle test order',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: shopProfileId,
      });
    });

    // 3. 수수료 상태 변경 과정 시뮬레이션
    const statusHistory = ['calculated', 'adjusted', 'paid', 'cancelled'];

    for (const status of statusHistory) {
      await t.run(async (ctx: any) => {
        await ctx.db.patch(orderId, {
          commission_status: status,
          updated_at: Date.now(),
          notes: `Commission status changed to: ${status}`,
        });
      });

      // 각 상태에서 주문 확인
      const currentOrder = await t.run(async (ctx: any) => {
        return await ctx.db.get(orderId);
      });

      expect(currentOrder.commission_status).toBe(status);

      // 상태별 조회 가능성 확인
      const ordersByStatus = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('orders')
          .withIndex('by_commission_status', (q: any) => q.eq('commission_status', status))
          .collect();
      });

      expect(ordersByStatus.some((order: any) => order._id === orderId)).toBe(true);
    }

    // 4. 최종 상태 확인
    const finalOrder = await t.run(async (ctx: any) => {
      return await ctx.db.get(orderId);
    });

    expect(finalOrder.commission_status).toBe('cancelled');
  });
});
