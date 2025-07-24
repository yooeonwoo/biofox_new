/**
 * Convex Shops 쿼리 함수들
 * 매장 상세 정보, 할당 데이터, 디바이스 통계 조회
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * 매장 상세 정보를 관계형 데이터와 함께 조회
 */
export const getShopDetailWithRelations = query({
  args: { shopId: v.id('profiles') },
  handler: async (ctx, { shopId }) => {
    // 1. 매장 기본 정보 조회
    const shop = await ctx.db.get(shopId);
    if (!shop || shop.role !== 'shop_owner') {
      return null;
    }

    // 2. 매장-KOL 관계 정보 조회
    const relationship = await ctx.db
      .query('shop_relationships')
      .withIndex('by_shop_active', q => q.eq('shop_owner_id', shopId).eq('is_active', true))
      .first();

    let kolName: string | undefined;
    let kolId: Id<'profiles'> | undefined;
    let contractDate: string | undefined;

    if (relationship?.parent_id) {
      // 상위 KOL 정보 조회
      const kol = await ctx.db.get(relationship.parent_id);
      if (kol) {
        kolName = kol.name;
        kolId = kol._id;
        contractDate = new Date(relationship.started_at).toISOString().split('T')[0];
      }
    }

    // 3. 디바이스 판매 통계 계산
    const deviceSales = await ctx.db
      .query('device_sales')
      .withIndex('by_shop', q => q.eq('shop_id', shopId))
      .collect();

    const deviceCount = deviceSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalSales = deviceSales.reduce((sum, sale) => sum + sale.actual_commission, 0);
    const lastAllocation =
      deviceSales.length > 0 ? Math.max(...deviceSales.map(sale => sale.sale_date)) : undefined;

    // 4. 결과 조합
    return {
      ...shop,
      kolName,
      kolId,
      deviceCount,
      contractDate,
      lastAllocation,
      totalSales,
      totalCommission: totalSales, // 동일값
      activeRelationships: relationship ? 1 : 0,
    };
  },
});

/**
 * 매장의 할당(디바이스 판매) 데이터를 페이지네이션으로 조회
 */
export const getShopAllocations = query({
  args: {
    shopId: v.id('profiles'),
  },
  handler: async (ctx, { shopId }) => {
    // 디바이스 판매 데이터를 최신순으로 조회 (기본 20개)
    const results = await ctx.db
      .query('device_sales')
      .withIndex('by_shop_date', q => q.eq('shop_id', shopId))
      .order('desc')
      .take(20);

    return results;
  },
});

/**
 * 매장의 디바이스 판매 통계 조회
 */
export const getShopDeviceStats = query({
  args: { shopId: v.id('profiles') },
  handler: async (ctx, { shopId }) => {
    // 모든 디바이스 판매 데이터 조회
    const deviceSales = await ctx.db
      .query('device_sales')
      .withIndex('by_shop', q => q.eq('shop_id', shopId))
      .collect();

    if (deviceSales.length === 0) {
      return {
        totalDevices: 0,
        activeDevices: 0,
        totalSales: 0,
        totalCommission: 0,
        tier1_4Count: 0,
        tier5PlusCount: 0,
        lastSaleDate: null,
      };
    }

    // 통계 계산
    const totalDevices = deviceSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalSales = deviceSales.reduce((sum, sale) => sum + sale.actual_commission, 0);
    const tier1_4Count = deviceSales
      .filter(sale => sale.tier_at_sale === 'tier_1_4')
      .reduce((sum, sale) => sum + sale.quantity, 0);
    const tier5PlusCount = deviceSales
      .filter(sale => sale.tier_at_sale === 'tier_5_plus')
      .reduce((sum, sale) => sum + sale.quantity, 0);
    const lastSaleDate = Math.max(...deviceSales.map(sale => sale.sale_date));

    return {
      totalDevices,
      activeDevices: totalDevices, // 현재는 동일값으로 처리
      totalSales,
      totalCommission: totalSales,
      tier1_4Count,
      tier5PlusCount,
      lastSaleDate: new Date(lastSaleDate).toISOString(),
    };
  },
});

/**
 * 매장 목록 조회 (KOL 필터링 포함)
 * adminNewShops-convex.ts에서도 사용되는 함수
 */
export const getShopsWithFilters = query({
  args: {
    kolId: v.optional(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { kolId, search, status }) => {
    let profilesQuery = ctx.db.query('profiles');

    // shop_owner 역할만 필터링
    const shopProfiles = await profilesQuery
      .withIndex('by_role', q => q.eq('role', 'shop_owner'))
      .collect();

    let results = shopProfiles;

    // KOL 필터링
    if (kolId) {
      const kolConvexId = kolId as Id<'profiles'>;

      // 해당 KOL의 하위 매장들 조회
      const relationships = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kolConvexId).eq('is_active', true))
        .collect();

      const shopIds = relationships.map(rel => rel.shop_owner_id);
      results = results.filter(shop => shopIds.includes(shop._id));
    }

    // 상태 필터링
    if (status) {
      results = results.filter(shop => shop.status === status);
    }

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        shop =>
          shop.shop_name.toLowerCase().includes(searchLower) ||
          shop.name.toLowerCase().includes(searchLower) ||
          (shop.region && shop.region.toLowerCase().includes(searchLower))
      );
    }

    // 관계형 데이터 추가
    const enrichedResults = await Promise.all(
      results.map(async shop => {
        // KOL 관계 정보 조회
        const relationship = await ctx.db
          .query('shop_relationships')
          .withIndex('by_shop_active', q => q.eq('shop_owner_id', shop._id).eq('is_active', true))
          .first();

        let kolName: string | undefined;
        if (relationship?.parent_id) {
          const kol = await ctx.db.get(relationship.parent_id);
          if (kol) {
            kolName = kol.name;
          }
        }

        // 디바이스 수량 계산
        const deviceSales = await ctx.db
          .query('device_sales')
          .withIndex('by_shop', q => q.eq('shop_id', shop._id))
          .collect();

        const deviceCount = deviceSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const latestAllocation =
          deviceSales.length > 0 ? Math.max(...deviceSales.map(sale => sale.sale_date)) : undefined;

        return {
          ...shop,
          kolName,
          deviceCount,
          latestAllocation: latestAllocation ? new Date(latestAllocation).toISOString() : undefined,
        };
      })
    );

    return enrichedResults;
  },
});

/**
 * 매장 생성
 */
export const createShop = mutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
    name: v.string(), // 대표자명
    shopName: v.string(),
    region: v.optional(v.string()),
    kolId: v.optional(v.id('profiles')), // 상위 KOL ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 매장 프로필 생성
    const shopId = await ctx.db.insert('profiles', {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: 'shop_owner',
      status: 'pending',
      shop_name: args.shopName,
      region: args.region,
      total_subordinates: 0,
      active_subordinates: 0,
      metadata: {},
      created_at: now,
      updated_at: now,
    });

    // KOL 관계 생성 (상위 KOL이 있는 경우)
    if (args.kolId) {
      await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopId,
        parent_id: args.kolId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        created_at: now,
        updated_at: now,
      });
    }

    return shopId;
  },
});

/**
 * 매장 정보 업데이트
 */
export const updateShop = mutation({
  args: {
    shopId: v.id('profiles'),
    updates: v.object({
      name: v.optional(v.string()),
      shop_name: v.optional(v.string()),
      region: v.optional(v.string()),
      naver_place_link: v.optional(v.string()),
      status: v.optional(
        v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))
      ),
    }),
  },
  handler: async (ctx, { shopId, updates }) => {
    const now = Date.now();

    await ctx.db.patch(shopId, {
      ...updates,
      updated_at: now,
    });

    return shopId;
  },
});
