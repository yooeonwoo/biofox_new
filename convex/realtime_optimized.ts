/**
 * 성능 최적화된 실시간 기능 Query Functions
 * 메모리 효율성과 응답 속도를 개선한 버전
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import {
  getCurrentUser,
  requireAdmin,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 최적화된 대시보드 통계 조회
 * 전체 데이터 로딩 대신 집계된 데이터만 조회
 */
export const getOptimizedDashboardStats = query({
  args: {},
  handler: async ctx => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 현재 월 시작 시간 계산
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTimestamp = currentMonthStart.getTime();

      // 지난 달 시작 시간 계산
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTimestamp = lastMonthStart.getTime();

      // 최근 7일 시작 시간
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last7DaysTimestamp = last7Days.getTime();

      // 🚀 최적화: 필요한 데이터만 병렬로 조회
      const [
        // KOL/OL 수 (승인된 사용자만)
        approvedKolProfiles,
        // 활성 매장 관계 수
        activeShopRelationships,
        // 이번 달 주문들 (인덱스 활용)
        currentMonthOrders,
        // 지난 달 주문들 (인덱스 활용)
        lastMonthOrders,
        // 최근 7일 주문들 (차트용)
        recentOrdersForChart,
      ] = await Promise.all([
        // 승인된 KOL/OL만 조회 (전체 profiles 대신)
        ctx.db
          .query('profiles')
          .withIndex('by_role_status', q => q.eq('role', 'kol').eq('status', 'approved'))
          .collect()
          .then(kols =>
            ctx.db
              .query('profiles')
              .withIndex('by_role_status', q => q.eq('role', 'ol').eq('status', 'approved'))
              .collect()
              .then(ols => kols.length + ols.length)
          ),

        // 활성 매장 관계 수만 조회
        ctx.db
          .query('shop_relationships')
          .withIndex('by_active', q => q.eq('is_active', true))
          .collect()
          .then(relationships => relationships.length),

        // 이번 달 주문 (인덱스 활용)
        ctx.db
          .query('orders')
          .withIndex('by_date', q => q.gte('order_date', currentMonthTimestamp))
          .collect(),

        // 지난 달 주문 (인덱스 활용)
        ctx.db
          .query('orders')
          .withIndex('by_date', q =>
            q.gte('order_date', lastMonthTimestamp).lt('order_date', currentMonthTimestamp)
          )
          .collect(),

        // 최근 7일 주문 (차트용, 인덱스 활용)
        ctx.db
          .query('orders')
          .withIndex('by_date', q => q.gte('order_date', last7DaysTimestamp))
          .collect(),
      ]);

      // 이번 달 통계 계산
      const monthlyOrders = currentMonthOrders.length;
      const monthlyRevenue = currentMonthOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      // 지난 달 주문 수 (성장률 계산용)
      const lastMonthOrdersCount = lastMonthOrders.length;

      // 성장률 계산
      const orderGrowthRate =
        lastMonthOrdersCount > 0
          ? ((monthlyOrders - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
          : 0;

      // 🚀 최적화: 메모리 효율적인 차트 데이터 생성
      const salesChart = generateSalesChart(recentOrdersForChart, now);

      return {
        kolsCount: approvedKolProfiles,
        activeShops: activeShopRelationships,
        monthlyOrders,
        monthlyRevenue,
        orderGrowthRate: Math.round(orderGrowthRate * 10) / 10,
        salesChart,
        lastUpdated: Date.now(),
        // 성능 메타데이터
        _performance: {
          dataPoints: {
            kols: approvedKolProfiles,
            shops: activeShopRelationships,
            currentMonthOrders: monthlyOrders,
            lastMonthOrders: lastMonthOrdersCount,
            chartOrders: recentOrdersForChart.length,
          },
          queryOptimized: true,
        },
      };
    } catch (error) {
      console.error('최적화된 대시보드 통계 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '대시보드 통계를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 메모리 효율적인 차트 데이터 생성 함수
 */
function generateSalesChart(orders: any[], now: Date) {
  // 일별 매출 집계 (Map 사용으로 성능 개선)
  const salesByDate = new Map<string, number>();

  // 🚀 최적화: forEach 대신 for loop 사용 (더 빠름)
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const dateStr = new Date(order.order_date).toISOString().split('T')[0];
    if (dateStr) {
      const currentAmount = salesByDate.get(dateStr) || 0;
      salesByDate.set(dateStr, currentAmount + (order.total_amount || 0));
    }
  }

  // 차트 데이터 생성 (메모리 효율적)
  const salesChart = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

    if (dateStr) {
      salesChart.push({
        date: formattedDate,
        sales: salesByDate.get(dateStr) || 0,
      });
    }
  }

  return salesChart;
}

/**
 * 페이지네이션을 지원하는 최적화된 활동 피드
 */
export const getOptimizedRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.min(args.limit || 15, 50); // 최대 50개로 제한

      // 🚀 최적화: 커서 기반 페이지네이션으로 메모리 효율성 개선
      let ordersQuery = ctx.db.query('orders').order('desc');
      let commissionsQuery = ctx.db.query('commission_calculations').order('desc');
      let usersQuery = ctx.db.query('profiles').order('desc');

      if (args.cursor) {
        // 커서가 있으면 해당 지점부터 조회
        ordersQuery = ordersQuery.filter(q =>
          q.lt(q.field('_creationTime'), parseInt(args.cursor!))
        );
        commissionsQuery = commissionsQuery.filter(q =>
          q.lt(q.field('_creationTime'), parseInt(args.cursor!))
        );
        usersQuery = usersQuery.filter(q => q.lt(q.field('_creationTime'), parseInt(args.cursor!)));
      }

      // 각각 제한된 수만 조회
      const [recentOrders, recentCommissions, recentUsers] = await Promise.all([
        ordersQuery.take(5),
        commissionsQuery.take(5),
        usersQuery.take(5),
      ]);

      // 🚀 최적화: 메모리 효율적인 활동 생성
      const activities = [];

      // 순서대로 활동 추가 (spread 연산자 대신 for loop)
      for (const order of recentOrders) {
        activities.push({
          type: 'order_created' as const,
          id: order._id,
          timestamp: order.created_at,
          title: '새로운 주문',
          description: `₩${order.total_amount?.toLocaleString()} 주문이 생성되었습니다`,
          shop_id: order.shop_id,
          metadata: {
            amount: order.total_amount,
            order_number: order.order_number,
          },
        });
      }

      for (const commission of recentCommissions) {
        activities.push({
          type: 'commission_updated' as const,
          id: commission._id,
          timestamp: commission.calculated_at,
          title: '커미션 업데이트',
          description: `₩${commission.total_commission?.toLocaleString()} 커미션이 ${commission.status === 'paid' ? '지급' : '계산'}되었습니다`,
          kol_id: commission.kol_id,
          metadata: {
            amount: commission.total_commission,
            status: commission.status,
            month: commission.calculation_month,
          },
        });
      }

      for (const user of recentUsers) {
        activities.push({
          type: 'user_registered' as const,
          id: user._id,
          timestamp: user.created_at,
          title: '새로운 사용자',
          description: `${user.name} (${user.role})님이 가입했습니다`,
          user_id: user._id,
          metadata: {
            name: user.name,
            role: user.role,
            status: user.status,
          },
        });
      }

      // 시간순 정렬 (native sort 사용)
      activities.sort((a, b) => b.timestamp - a.timestamp);

      // 제한된 수만 반환
      const limitedActivities = activities.slice(0, limit);

      // 다음 커서 계산
      const lastActivity = limitedActivities[limitedActivities.length - 1];
      const nextCursor =
        limitedActivities.length > 0 && lastActivity?.timestamp
          ? lastActivity.timestamp.toString()
          : null;

      return {
        activities: limitedActivities,
        nextCursor,
        hasMore: activities.length > limit,
        _performance: {
          totalActivities: activities.length,
          returned: limitedActivities.length,
          queryOptimized: true,
        },
      };
    } catch (error) {
      console.error('최적화된 최근 활동 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '최근 활동 데이터를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 캐시된 KOL 대시보드 통계 (자주 조회되는 데이터)
 */
export const getCachedKolDashboardStats = query({
  args: {
    kolId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'User not authenticated or profile not found');
      }

      // kolId가 제공되지 않으면 현재 사용자의 ID를 사용
      const targetKolId = args.kolId || currentUser._id;

      // 권한 확인: 관리자가 아니면서 다른 KOL의 정보를 보려고 할 때 에러 발생
      if (targetKolId !== currentUser._id && currentUser.role !== 'admin') {
        throw new ApiError(
          ERROR_CODES.FORBIDDEN,
          "You do not have permission to access this KOL's dashboard."
        );
      }

      // 🚀 최적화: 현재 월과 지난 달의 데이터만 정확히 조회
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTimestamp = currentMonthStart.getTime();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTimestamp = lastMonthStart.getTime();

      // 병렬로 최적화된 데이터 수집
      const [
        kolProfile,
        activeShopRelationships,
        currentMonthOrders,
        lastMonthOrders,
        currentMonthCommission,
      ] = await Promise.all([
        // KOL 프로필
        ctx.db.get(targetKolId),

        // KOL의 활성 매장 관계 (인덱스 활용)
        ctx.db
          .query('shop_relationships')
          .withIndex('by_parent_active', q => q.eq('parent_id', targetKolId).eq('is_active', true))
          .collect(),

        // 이번 달 주문 (날짜 인덱스와 매장 필터링 최적화)
        ctx.db
          .query('orders')
          .withIndex('by_date', q => q.gte('order_date', currentMonthTimestamp))
          .collect(),

        // 지난 달 주문
        ctx.db
          .query('orders')
          .withIndex('by_date', q =>
            q.gte('order_date', lastMonthTimestamp).lt('order_date', currentMonthTimestamp)
          )
          .collect(),

        // 이번 달 커미션 (인덱스 활용)
        ctx.db
          .query('commission_calculations')
          .withIndex('by_kol_month', q =>
            q.eq('kol_id', targetKolId).eq('calculation_month', currentMonthTimestamp)
          )
          .first(),
      ]);

      if (!kolProfile) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'KOL을 찾을 수 없습니다.');
      }

      // 🚀 최적화: 관련 매장 ID들을 Set으로 관리 (빠른 조회)
      const relatedShopIds = new Set([
        targetKolId,
        ...activeShopRelationships.map(r => r.shop_owner_id),
      ]);

      // 🚀 최적화: filter 대신 for loop 사용 (더 빠름)
      let currentMonthSales = 0;
      let currentMonthOrderCount = 0;
      for (const order of currentMonthOrders) {
        if (relatedShopIds.has(order.shop_id)) {
          currentMonthSales += order.total_amount || 0;
          currentMonthOrderCount++;
        }
      }

      let lastMonthSales = 0;
      for (const order of lastMonthOrders) {
        if (relatedShopIds.has(order.shop_id)) {
          lastMonthSales += order.total_amount || 0;
        }
      }

      // 성장률 계산
      const salesGrowth =
        lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

      // 커미션 정보
      const currentMonthCommissionAmount = currentMonthCommission?.total_commission || 0;

      // 전문점 현황
      const totalShops = activeShopRelationships.length + 1; // 본인 매장 포함
      const orderingShops = new Set(
        currentMonthOrders.filter(o => relatedShopIds.has(o.shop_id)).map(o => o.shop_id)
      ).size;

      return {
        kol: {
          id: kolProfile._id,
          name: kolProfile.name,
          shopName: kolProfile.shop_name,
        },
        sales: {
          currentMonth: currentMonthSales,
          lastMonth: lastMonthSales,
          growth: Math.round(salesGrowth * 10) / 10,
        },
        commission: {
          currentMonth: currentMonthCommissionAmount,
          status: currentMonthCommission?.status || 'calculated',
        },
        shops: {
          total: totalShops,
          ordering: orderingShops,
          notOrdering: totalShops - orderingShops,
        },
        lastUpdated: Date.now(),
        _performance: {
          relatedShops: relatedShopIds.size,
          currentMonthOrders: currentMonthOrderCount,
          queryOptimized: true,
        },
      };
    } catch (error) {
      console.error('캐시된 KOL 대시보드 통계 조회 오류:', error);
      throw error instanceof ApiError
        ? error
        : new ApiError(
            ERROR_CODES.DATABASE_ERROR,
            'KOL 대시보드 데이터를 불러오는데 실패했습니다.'
          );
    }
  },
});

/**
 * 메모리 효율적인 최근 주문 업데이트
 */
export const getOptimizedRecentOrderUpdates = query({
  args: {
    limit: v.optional(v.number()),
    kolId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.min(args.limit || 20, 50); // 최대 50개로 제한

      if (args.kolId) {
        // 🚀 최적화: KOL의 관련 매장들을 먼저 조회
        const shopRelationships = await ctx.db
          .query('shop_relationships')
          .withIndex('by_parent_active', q =>
            q.eq('parent_id', args.kolId as Id<'profiles'>).eq('is_active', true)
          )
          .collect();

        const relatedShopIds = [
          args.kolId as Id<'profiles'>,
          ...shopRelationships.map(r => r.shop_owner_id),
        ];

        // 🚀 최적화: 최근 주문만 조회하고 메모리에서 필터링
        const recentOrders = await ctx.db
          .query('orders')
          .order('desc')
          .take(limit * 2); // 여유분을 두고 조회

        return recentOrders.filter(order => relatedShopIds.includes(order.shop_id)).slice(0, limit);
      } else {
        // 전체 주문 조회 (관리자용) - 제한된 수만
        return await ctx.db.query('orders').order('desc').take(limit);
      }
    } catch (error) {
      console.error('최적화된 최근 주문 업데이트 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '최근 주문 데이터를 불러오는데 실패했습니다.');
    }
  },
});
