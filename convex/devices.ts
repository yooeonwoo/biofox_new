/**
 * 디바이스 판매 관리 (Device Sales Management)
 * 티어별 수수료 계산을 포함한 디바이스 판매 시스템
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { requireAdmin } from './auth';

/**
 * 디바이스 판매 목록 조회 (필터링, 페이지네이션 지원)
 */
export const getDeviceSales = query({
  args: {
    shop_id: v.optional(v.id('profiles')),
    kol_id: v.optional(v.id('profiles')),
    date_from: v.optional(v.string()),
    date_to: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit || 20;
    let sales;

    if (args.shop_id) {
      sales = await ctx.db
        .query('device_sales')
        .withIndex('by_shop', q => q.eq('shop_id', args.shop_id!))
        .order('desc')
        .take(limit);
    } else {
      sales = await ctx.db.query('device_sales').order('desc').take(limit);
    }

    // 날짜 필터링 (클라이언트 사이드)
    let filteredSales = sales;
    if (args.date_from) {
      const fromTimestamp = new Date(args.date_from).getTime();
      filteredSales = filteredSales.filter(sale => sale.sale_date >= fromTimestamp);
    }
    if (args.date_to) {
      const toTimestamp = new Date(args.date_to).getTime();
      filteredSales = filteredSales.filter(sale => sale.sale_date <= toTimestamp);
    }

    return filteredSales;
  },
});

/**
 * 디바이스 판매 추가
 */
export const addDeviceSale = mutation({
  args: {
    shop_id: v.id('profiles'),
    device_name: v.optional(v.string()),
    quantity: v.number(),
    tier_at_sale: v.union(v.literal('tier_1_4'), v.literal('tier_5_plus')),
    standard_commission: v.number(),
    actual_commission: v.number(),
    notes: v.optional(v.string()),
    serial_numbers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    const saleId = await ctx.db.insert('device_sales', {
      shop_id: args.shop_id,
      sale_date: Date.now(),
      device_name: args.device_name,
      quantity: args.quantity,
      tier_at_sale: args.tier_at_sale,
      standard_commission: args.standard_commission,
      actual_commission: args.actual_commission,
      commission_status: 'calculated',
      notes: args.notes,
      serial_numbers: args.serial_numbers,
      created_at: Date.now(),
      updated_at: Date.now(),
      created_by: userId,
    });

    // KOL 누적 데이터 업데이트
    await updateKolDeviceAccumulator(ctx, args.shop_id, args.quantity);

    return saleId;
  },
});

/**
 * KOL 디바이스 누적 데이터 업데이트
 */
async function updateKolDeviceAccumulator(ctx: any, shopId: Id<'profiles'>, quantity: number) {
  // 매장의 상위 KOL 찾기
  const relationship = await ctx.db
    .query('shop_relationships')
    .withIndex('by_shop_owner', (q: any) => q.eq('shop_owner_id', shopId))
    .filter((q: any) => q.eq(q.field('is_active'), true))
    .first();

  if (!relationship?.parent_id) return;

  const kolId = relationship.parent_id;

  // 기존 누적 데이터 조회
  const accumulator = await ctx.db
    .query('kol_device_accumulator')
    .withIndex('by_kol', (q: any) => q.eq('kol_id', kolId))
    .first();

  if (accumulator) {
    // 기존 데이터 업데이트
    const newTotalSold = accumulator.total_devices_sold + quantity;
    const newNetSold = newTotalSold - accumulator.total_devices_returned;
    const newTier = newNetSold >= 5 ? 'tier_5_plus' : 'tier_1_4';

    await ctx.db.patch(accumulator._id, {
      total_devices_sold: newTotalSold,
      net_devices_sold: newNetSold,
      current_tier: newTier,
      last_updated: Date.now(),
    });
  } else {
    // 새 누적 데이터 생성
    const tier = quantity >= 5 ? 'tier_5_plus' : 'tier_1_4';

    await ctx.db.insert('kol_device_accumulator', {
      kol_id: kolId,
      total_devices_sold: quantity,
      total_devices_returned: 0,
      net_devices_sold: quantity,
      current_tier: tier,
      tier_1_4_count: tier === 'tier_1_4' ? quantity : 0,
      tier_5_plus_count: tier === 'tier_5_plus' ? quantity : 0,
      tier_changed_at: Date.now(),
      last_updated: Date.now(),
      created_at: Date.now(),
    });
  }
}

/**
 * 상위 판매자 조회
 */
export const getTopPerformers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit || 10;
    const accumulators = await ctx.db.query('kol_device_accumulator').order('desc').take(limit);

    const performersWithDetails = await Promise.all(
      accumulators.map(async accumulator => {
        const kol = await ctx.db.get(accumulator.kol_id);
        const netDevices = accumulator.net_devices_sold;

        return {
          id: accumulator._id,
          name: kol?.name || 'Unknown',
          role: kol?.role || 'unknown',
          netDevices,
          current_tier: accumulator.current_tier,
        };
      })
    );

    return performersWithDetails;
  },
});

/**
 * KOL별 디바이스 통계 조회
 */
export const getKolDeviceStats = query({
  args: {
    kol_id: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const accumulator = await ctx.db
      .query('kol_device_accumulator')
      .withIndex('by_kol', (q: any) => q.eq('kol_id', args.kol_id))
      .first();

    if (!accumulator) {
      return {
        totalSold: 0,
        totalReturned: 0,
        netSold: 0,
        currentTier: 'tier_1_4' as const,
      };
    }

    return {
      totalSold: accumulator.total_devices_sold,
      totalReturned: accumulator.total_devices_returned,
      netSold: accumulator.net_devices_sold,
      currentTier: accumulator.current_tier,
    };
  },
});

/**
 * 모든 KOL 디바이스 통계 조회
 */
export const getAllKolDeviceStats = query({
  args: {},
  handler: async ctx => {
    await requireAdmin(ctx);

    const accumulators = await ctx.db.query('kol_device_accumulator').collect();

    const statsWithDetails = await Promise.all(
      accumulators.map(async acc => {
        const kol = await ctx.db.get(acc.kol_id);
        const netDevices = acc.net_devices_sold;

        if (kol) {
          return {
            id: acc.kol_id,
            name: kol.name,
            role: kol.role,
            netDevices,
            totalSold: acc.total_devices_sold,
            totalReturned: acc.total_devices_returned,
            currentTier: acc.current_tier,
          };
        }
        return null;
      })
    );

    return statsWithDetails.filter(Boolean);
  },
});

/**
 * 디바이스 반품 처리
 */
export const returnDevice = mutation({
  args: {
    kol_id: v.id('profiles'),
    quantity: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const accumulator = await ctx.db
      .query('kol_device_accumulator')
      .withIndex('by_kol', (q: any) => q.eq('kol_id', args.kol_id))
      .first();

    if (!accumulator) {
      throw new Error('KOL accumulator not found');
    }

    const newTotalReturned = accumulator.total_devices_returned + args.quantity;
    const newNetSold = accumulator.total_devices_sold - newTotalReturned;
    const newTier = newNetSold >= 5 ? 'tier_5_plus' : 'tier_1_4';

    await ctx.db.patch(accumulator._id, {
      total_devices_returned: newTotalReturned,
      net_devices_sold: Math.max(0, newNetSold),
      current_tier: newTier,
      last_updated: Date.now(),
    });

    return { success: true };
  },
});
