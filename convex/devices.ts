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
 * GET /api/devices 대체
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
    // 관리자 권한 필요
    await requireAdmin(ctx);

    const limit = args.limit || 20;
    let salesQuery = ctx.db.query('device_sales');

    // 매장 필터
    if (args.shop_id) {
      salesQuery = salesQuery.withIndex('by_shop', q => q.eq('shop_id', args.shop_id));
    }

    // KOL 필터의 경우 관련 매장들을 먼저 찾아야 함
    let kolShopIds: Id<'profiles'>[] = [];
    if (args.kol_id) {
      const relationships = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent', q => q.eq('parent_id', args.kol_id))
        .filter(q => q.eq(q.field('is_active'), true))
        .collect();

      kolShopIds = relationships.map(r => r.shop_owner_id);
    }

    let sales = await salesQuery.order('desc').take(limit);

    // KOL 필터 적용
    if (args.kol_id && kolShopIds.length > 0) {
      sales = sales.filter(sale => kolShopIds.includes(sale.shop_id));
    }

    // 날짜 필터 적용
    if (args.date_from) {
      sales = sales.filter(sale => sale.sale_date >= args.date_from!);
    }
    if (args.date_to) {
      sales = sales.filter(sale => sale.sale_date <= args.date_to!);
    }

    // 각 판매에 대해 매장 및 KOL 정보 추가
    const salesWithDetails = await Promise.all(
      sales.map(async sale => {
        // 매장 정보 조회
        const shop = await ctx.db.get(sale.shop_id);

        // KOL 정보 조회 (소속 관계를 통해)
        const relationship = await ctx.db
          .query('shop_relationships')
          .withIndex('by_shop_owner', q => q.eq('shop_owner_id', sale.shop_id))
          .filter(q => q.eq(q.field('is_active'), true))
          .first();

        let kol = null;
        if (relationship && relationship.parent_id) {
          kol = await ctx.db.get(relationship.parent_id);
        }

        // 생성자 정보
        let createdBy = null;
        if (sale.created_by) {
          createdBy = await ctx.db.get(sale.created_by);
        }

        return {
          ...sale,
          shop: shop
            ? {
                _id: shop._id,
                name: shop.name,
                shop_name: shop.shop_name,
                email: shop.email,
                region: shop.region,
              }
            : null,
          kol: kol
            ? {
                _id: kol._id,
                name: kol.name,
                role: kol.role,
              }
            : null,
          created_by_user: createdBy
            ? {
                name: createdBy.name,
              }
            : null,
        };
      })
    );

    return salesWithDetails;
  },
});

/**
 * 디바이스 판매 기록 생성 (수수료 계산 포함)
 * POST /api/devices 대체
 */
export const createDeviceSale = mutation({
  args: {
    shop_id: v.id('profiles'),
    sale_date: v.string(),
    quantity: v.number(),
    device_name: v.optional(v.string()),
    serial_numbers: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    const { profile } = await requireAdmin(ctx);

    // 해당 매장의 KOL 관계 찾기
    const relationship = await ctx.db
      .query('shop_relationships')
      .withIndex('by_shop_owner', q => q.eq('shop_owner_id', args.shop_id))
      .filter(q => q.eq(q.field('is_active'), true))
      .first();

    if (!relationship || !relationship.parent_id) {
      throw new Error('Shop has no active KOL/OL relationship');
    }

    const kolId = relationship.parent_id;

    // KOL의 현재 누적 대수 조회
    const accumulator = await ctx.db
      .query('device_accumulator')
      .withIndex('by_kol', q => q.eq('kol_id', kolId))
      .first();

    let currentNetDevices = 0;
    if (accumulator) {
      const totalSold = accumulator.total_devices_sold || 0;
      const totalReturned = accumulator.total_devices_returned || 0;
      currentNetDevices = totalSold - totalReturned;
    }

    // 새 판매 후 누적 대수
    const newNetDevices = currentNetDevices + args.quantity;

    // 티어 결정 (판매/반품에 따라 다른 로직)
    let currentTier: 'tier_1_4' | 'tier_5_plus';
    if (args.quantity > 0) {
      // 판매인 경우 현재 티어 기준
      currentTier = currentNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4';
    } else {
      // 반품인 경우 반품 후 티어 기준
      currentTier = newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4';
    }

    // 수수료 계산
    const commissionPerUnit = currentTier === 'tier_5_plus' ? 2500000 : 1500000;
    const standardCommission = Math.abs(args.quantity) * commissionPerUnit;
    const actualCommission = args.quantity * commissionPerUnit; // 반품시 음수

    const now = Date.now();

    // 디바이스 판매 기록 생성
    const deviceSaleId = await ctx.db.insert('device_sales', {
      shop_id: args.shop_id,
      sale_date: args.sale_date,
      quantity: args.quantity,
      device_name: args.device_name || '마이크로젯',
      tier_at_sale: currentTier,
      standard_commission: standardCommission,
      actual_commission: actualCommission,
      serial_numbers: args.serial_numbers,
      notes: args.notes,
      created_by: profile._id,
      created_at: now,
      updated_at: now,
    });

    // KOL 누적 대수 업데이트
    if (accumulator) {
      // 기존 레코드 업데이트
      const newTotalSold =
        (accumulator.total_devices_sold || 0) + (args.quantity > 0 ? args.quantity : 0);
      const newTotalReturned =
        (accumulator.total_devices_returned || 0) +
        (args.quantity < 0 ? Math.abs(args.quantity) : 0);
      const newTier = newTotalSold - newTotalReturned >= 5 ? 'tier_5_plus' : 'tier_1_4';
      const tierChanged = accumulator.current_tier !== newTier;

      await ctx.db.patch(accumulator._id, {
        total_devices_sold: newTotalSold,
        total_devices_returned: newTotalReturned,
        current_tier: newTier,
        tier_changed_at: tierChanged ? now : accumulator.tier_changed_at,
        last_updated: now,
      });
    } else {
      // 첫 판매인 경우 새 레코드 생성
      const totalSold = args.quantity > 0 ? args.quantity : 0;
      const totalReturned = args.quantity < 0 ? Math.abs(args.quantity) : 0;
      const tier = totalSold - totalReturned >= 5 ? 'tier_5_plus' : 'tier_1_4';

      await ctx.db.insert('device_accumulator', {
        kol_id: kolId,
        total_devices_sold: totalSold,
        total_devices_returned: totalReturned,
        current_tier: tier,
        tier_1_4_count: currentTier === 'tier_1_4' ? Math.abs(args.quantity) : 0,
        tier_5_plus_count: currentTier === 'tier_5_plus' ? Math.abs(args.quantity) : 0,
        tier_changed_at: now,
        last_updated: now,
        created_at: now,
      });
    }

    // 생성된 판매 기록 반환
    const newSale = await ctx.db.get(deviceSaleId);
    return newSale;
  },
});

/**
 * 디바이스 판매 기록 상세 조회
 * GET /api/devices/[deviceId] 대체
 */
export const getDeviceSale = query({
  args: {
    device_id: v.id('device_sales'),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    const sale = await ctx.db.get(args.device_id);
    if (!sale) {
      throw new Error('Device sale not found');
    }

    // 매장 정보 조회
    const shop = await ctx.db.get(sale.shop_id);

    // KOL 정보 조회
    const relationship = await ctx.db
      .query('shop_relationships')
      .withIndex('by_shop_owner', q => q.eq('shop_owner_id', sale.shop_id))
      .filter(q => q.eq(q.field('is_active'), true))
      .first();

    let kol = null;
    if (relationship && relationship.parent_id) {
      kol = await ctx.db.get(relationship.parent_id);
    }

    // 생성자 정보
    let createdBy = null;
    if (sale.created_by) {
      createdBy = await ctx.db.get(sale.created_by);
    }

    return {
      ...sale,
      shop: shop
        ? {
            _id: shop._id,
            name: shop.name,
            shop_name: shop.shop_name,
            email: shop.email,
            region: shop.region,
          }
        : null,
      kol: kol
        ? {
            _id: kol._id,
            name: kol.name,
            role: kol.role,
          }
        : null,
      created_by_user: createdBy
        ? {
            name: createdBy.name,
          }
        : null,
    };
  },
});

/**
 * 디바이스 판매 통계 조회
 * GET /api/devices/statistics 대체
 */
export const getDeviceStatistics = query({
  args: {
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    let sales = await ctx.db.query('device_sales').collect();

    // 날짜 필터 적용
    if (args.start_date) {
      sales = sales.filter(sale => sale.sale_date >= args.start_date!);
    }
    if (args.end_date) {
      sales = sales.filter(sale => sale.sale_date <= args.end_date!);
    }

    // 전체 요약 계산
    const totalSold = sales.reduce((sum, s) => sum + (s.quantity > 0 ? s.quantity : 0), 0);
    const totalReturned = sales.reduce(
      (sum, s) => sum + (s.quantity < 0 ? Math.abs(s.quantity) : 0),
      0
    );
    const totalCommission = sales.reduce((sum, s) => sum + (s.actual_commission || 0), 0);

    // 샵별 그룹화
    const shopGroups = new Map<
      Id<'profiles'>,
      { sold: number; returned: number; commission: number }
    >();

    for (const sale of sales) {
      if (!shopGroups.has(sale.shop_id)) {
        shopGroups.set(sale.shop_id, { sold: 0, returned: 0, commission: 0 });
      }
      const group = shopGroups.get(sale.shop_id)!;

      if (sale.quantity > 0) {
        group.sold += sale.quantity;
      } else {
        group.returned += Math.abs(sale.quantity);
      }
      group.commission += sale.actual_commission || 0;
    }

    // KOL 최고 성과자 조회
    const topPerformers = await ctx.db.query('device_accumulator').order('desc').take(10);

    const topPerformersWithDetails = await Promise.all(
      topPerformers.map(async accumulator => {
        const kol = await ctx.db.get(accumulator.kol_id);
        const netDevices =
          (accumulator.total_devices_sold || 0) - (accumulator.total_devices_returned || 0);

        return {
          id: kol?._id,
          name: kol?.name,
          role: kol?.role,
          devices_sold: netDevices,
          current_tier: accumulator.current_tier,
          commission_earned: 0, // 추후 계산 필요
        };
      })
    );

    return {
      summary: {
        total_sold: totalSold,
        total_returned: totalReturned,
        net_devices: totalSold - totalReturned,
        total_commission: totalCommission,
        average_per_shop: shopGroups.size > 0 ? (totalSold - totalReturned) / shopGroups.size : 0,
      },
      top_performers: topPerformersWithDetails,
    };
  },
});

/**
 * 티어 변경 시뮬레이션
 * POST /api/devices/simulate-tier-change 대체
 */
export const simulateTierChange = query({
  args: {
    kol_id: v.id('profiles'),
    additional_devices: v.number(),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    // 현재 KOL 누적 정보 조회
    const accumulator = await ctx.db
      .query('device_accumulator')
      .withIndex('by_kol', q => q.eq('kol_id', args.kol_id))
      .first();

    const currentTotalSold = accumulator?.total_devices_sold || 0;
    const currentTotalReturned = accumulator?.total_devices_returned || 0;
    const currentNetDevices = currentTotalSold - currentTotalReturned;
    const currentTier = accumulator?.current_tier || 'tier_1_4';
    const currentCommissionPerDevice = currentTier === 'tier_5_plus' ? 2500000 : 1500000;

    // 시뮬레이션
    const newNetDevices = currentNetDevices + args.additional_devices;
    const newTier = newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4';
    const newCommissionPerDevice = newTier === 'tier_5_plus' ? 2500000 : 1500000;
    const tierChanged = currentTier !== newTier;

    // 수수료 차이 계산
    const commissionDifference =
      (newCommissionPerDevice - currentCommissionPerDevice) * Math.abs(args.additional_devices);

    return {
      current_state: {
        total_devices: currentNetDevices,
        current_tier: currentTier,
        commission_per_device: currentCommissionPerDevice,
      },
      new_state: {
        total_devices: newNetDevices,
        new_tier: newTier,
        commission_per_device: newCommissionPerDevice,
        tier_changed: tierChanged,
      },
      commission_difference: commissionDifference,
    };
  },
});

/**
 * KOL별 디바이스 누적 현황 조회
 */
export const getKolDeviceAccumulator = query({
  args: {
    kol_id: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    // 관리자 권한 필요
    await requireAdmin(ctx);

    let accumulators;
    if (args.kol_id) {
      const accumulator = await ctx.db
        .query('device_accumulator')
        .withIndex('by_kol', q => q.eq('kol_id', args.kol_id))
        .first();
      accumulators = accumulator ? [accumulator] : [];
    } else {
      accumulators = await ctx.db.query('device_accumulator').collect();
    }

    // KOL 정보와 함께 반환
    const accumulatorsWithKol = await Promise.all(
      accumulators.map(async acc => {
        const kol = await ctx.db.get(acc.kol_id);
        const netDevices = (acc.total_devices_sold || 0) - (acc.total_devices_returned || 0);

        return {
          ...acc,
          net_devices_sold: netDevices,
          kol: kol
            ? {
                _id: kol._id,
                name: kol.name,
                role: kol.role,
              }
            : null,
        };
      })
    );

    return accumulatorsWithKol;
  },
});
