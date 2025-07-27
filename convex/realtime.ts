/**
 * 실시간 기능 (Real-time Features) Query Functions
 * KOL 관리 시스템의 실시간 업데이트를 위한 Convex 쿼리 함수들
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
 * 실시간 대시보드 통계 조회
 * 관리자 대시보드의 핵심 지표를 실시간으로 제공
 */
export const getDashboardStats = query({
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

      // 병렬로 모든 통계 데이터 수집
      const [allProfiles, allOrders, currentMonthOrders, lastMonthOrders, activeShopRelationships] =
        await Promise.all([
          // 전체 프로필 조회
          ctx.db.query('profiles').collect(),
          // 전체 주문 조회
          ctx.db.query('orders').collect(),
          // 이번 달 주문 조회
          ctx.db
            .query('orders')
            .withIndex('by_date', q => q.gte('order_date', currentMonthTimestamp))
            .collect(),
          // 지난 달 주문 조회
          ctx.db
            .query('orders')
            .withIndex('by_date', q =>
              q.gte('order_date', lastMonthTimestamp).lt('order_date', currentMonthTimestamp)
            )
            .collect(),
          // 활성 매장 관계 조회
          ctx.db
            .query('shop_relationships')
            .withIndex('by_active', q => q.eq('is_active', true))
            .collect(),
        ]);

      // KOL/OL 수 계산
      const kolsCount = allProfiles.filter(
        p => ['kol', 'ol'].includes(p.role) && p.status === 'approved'
      ).length;

      // 활성 매장 수
      const activeShops = activeShopRelationships.length;

      // 이번 달 주문 수와 매출
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

      // 최근 7일 매출 차트 데이터
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentOrders = allOrders.filter(order => order.order_date >= last7Days.getTime());

      // 일별 매출 집계
      const salesByDate: Record<string, number> = {};
      recentOrders.forEach(order => {
        const dateStr = new Date(order.order_date).toISOString().split('T')[0];
        if (dateStr) {
          salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (order.total_amount || 0);
        }
      });

      // 차트 데이터 생성
      const salesChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

        if (dateStr) {
          salesChart.push({
            date: formattedDate,
            sales: salesByDate[dateStr] || 0,
          });
        }
      }

      return {
        kolsCount,
        activeShops,
        monthlyOrders,
        monthlyRevenue,
        orderGrowthRate: Math.round(orderGrowthRate * 10) / 10, // 소수점 한자리
        salesChart,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '대시보드 통계를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 실시간 KOL 대시보드 통계 조회
 * 특정 KOL의 개인 대시보드 지표를 실시간으로 제공
 */
export const getKolDashboardStats = query({
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
        throw new ApiError(ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.');
      }

      // 현재 월 시작 시간 계산
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTimestamp = currentMonthStart.getTime();

      // 지난 달 시작 시간 계산
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTimestamp = lastMonthStart.getTime();

      // 병렬로 데이터 수집
      const [
        kolProfile,
        currentMonthOrders,
        lastMonthOrders,
        activeShopRelationships,
        currentMonthCommission,
      ] = await Promise.all([
        // KOL 프로필
        ctx.db.get(targetKolId),
        // 이번 달 주문 (본인 매장 + 하위 매장)
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
        // KOL의 활성 매장 관계
        ctx.db
          .query('shop_relationships')
          .withIndex('by_parent_active', q => q.eq('parent_id', targetKolId).eq('is_active', true))
          .collect(),
        // 이번 달 커미션 계산
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

      // 관련 매장 ID들 수집 (본인 + 하위 매장)
      const relatedShopIds = [targetKolId, ...activeShopRelationships.map(r => r.shop_owner_id)];

      // 해당 매장들의 주문 필터링
      const kolCurrentMonthOrders = currentMonthOrders.filter(order =>
        relatedShopIds.includes(order.shop_id)
      );
      const kolLastMonthOrders = lastMonthOrders.filter(order =>
        relatedShopIds.includes(order.shop_id)
      );

      // 매출 계산
      const currentMonthSales = kolCurrentMonthOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const lastMonthSales = kolLastMonthOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      // 성장률 계산
      const salesGrowth =
        lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

      // 커미션 정보
      const currentMonthCommissionAmount = currentMonthCommission?.total_commission || 0;

      // 전문점 현황
      const totalShops = activeShopRelationships.length + 1; // 본인 매장 포함
      const orderingShops = new Set(kolCurrentMonthOrders.map(o => o.shop_id)).size;

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
      };
    } catch (error) {
      console.error('KOL 대시보드 통계 조회 오류:', error);
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
 * 실시간 주문 상태 변경 스트림
 * 새로운 주문 생성 및 상태 변경을 실시간으로 모니터링
 */
export const getRecentOrderUpdates = query({
  args: {
    limit: v.optional(v.number()),
    kolId: v.optional(v.id('profiles')), // 특정 KOL의 주문만 조회
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 20;

      // created_at 기준으로 최신 주문 조회 (직접 필터링)
      const allOrders = await ctx.db.query('orders').collect();
      const sortedOrders = allOrders.sort((a, b) => b.created_at - a.created_at);

      // KOL 필터링
      if (args.kolId) {
        // KOL의 관련 매장들 조회
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

        // 관련 매장의 주문만 필터링
        return sortedOrders.filter(order => relatedShopIds.includes(order.shop_id)).slice(0, limit);
      } else {
        // 전체 주문 조회 (관리자용)
        return sortedOrders.slice(0, limit);
      }
    } catch (error) {
      console.error('최근 주문 업데이트 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '최근 주문 데이터를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 실시간 커미션 상태 변경 스트림
 * 커미션 계산 및 지급 상태 변경을 실시간으로 모니터링
 */
export const getRecentCommissionUpdates = query({
  args: {
    limit: v.optional(v.number()),
    kolId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 10;

      if (args.kolId) {
        // 특정 KOL의 커미션만 조회
        const commissions = await ctx.db
          .query('commission_calculations')
          .withIndex('by_kol', q => q.eq('kol_id', args.kolId as Id<'profiles'>))
          .collect();

        return commissions.sort((a, b) => b.calculated_at - a.calculated_at).slice(0, limit);
      } else {
        // 전체 커미션 조회 (관리자용)
        const commissions = await ctx.db.query('commission_calculations').collect();

        return commissions.sort((a, b) => b.calculated_at - a.calculated_at).slice(0, limit);
      }
    } catch (error) {
      console.error('최근 커미션 업데이트 조회 오류:', error);
      throw new ApiError(
        ERROR_CODES.DATABASE_ERROR,
        '최근 커미션 데이터를 불러오는데 실패했습니다.'
      );
    }
  },
});

/**
 * 실시간 활동 피드
 * 시스템의 최근 활동들을 실시간으로 제공
 */
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 15;

      // 여러 테이블에서 최근 활동 수집
      const [allOrders, allCommissions, allUsers] = await Promise.all([
        // 모든 주문 조회
        ctx.db.query('orders').collect(),

        // 모든 커미션 계산 조회
        ctx.db.query('commission_calculations').collect(),

        // 모든 사용자 조회
        ctx.db.query('profiles').collect(),
      ]);

      // 최근 5개씩 선택 (created_at 기준 정렬)
      const recentOrders = allOrders.sort((a, b) => b.created_at - a.created_at).slice(0, 5);
      const recentCommissions = allCommissions
        .sort((a, b) => b.calculated_at - a.calculated_at)
        .slice(0, 5);
      const recentUsers = allUsers.sort((a, b) => b.created_at - a.created_at).slice(0, 5);

      // 활동 객체들을 통합하고 시간순으로 정렬
      const activities = [
        ...recentOrders.map(order => ({
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
        })),

        ...recentCommissions.map(commission => ({
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
        })),

        ...recentUsers.map(user => ({
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
        })),
      ];

      // 시간순으로 정렬하고 제한된 수만 반환
      return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      console.error('최근 활동 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '최근 활동 데이터를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 실시간 알림 개수 조회
 * 사용자의 읽지 않은 알림 개수를 실시간으로 제공
 */
export const getUnreadNotificationCount = query({
  args: {},
  handler: async ctx => {
    try {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        return 0; // 알림 없음
      }

      const unreadCount = await ctx.db
        .query('notifications')
        .withIndex('by_user_read', q => q.eq('user_id', currentUser._id).eq('is_read', false))
        .collect()
        .then(notifications => notifications.length);

      return {
        count: unreadCount,
        lastChecked: Date.now(),
      };
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error);
      throw new ApiError(ERROR_CODES.DATABASE_ERROR, '알림 개수를 불러오는데 실패했습니다.');
    }
  },
});

/**
 * 주문 상태 변경 시 실시간 알림 생성
 * 주문 상태가 변경될 때 관련 사용자들에게 알림을 보냄
 */
export const notifyOrderStatusChange = mutation({
  args: {
    orderId: v.id('orders'),
    oldStatus: v.optional(v.string()),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // 주문 정보 조회
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '주문을 찾을 수 없습니다.');
      }

      // 주문한 매장 정보 조회
      const shop = await ctx.db.get(order.shop_id);
      if (!shop) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '매장 정보를 찾을 수 없습니다.');
      }

      // 매장 소유자에게 알림
      await createNotification(ctx, {
        userId: shop._id,
        type: 'order_created',
        title: '주문 상태 변경',
        message: `주문 #${order.order_number || order._id}의 상태가 "${args.newStatus}"로 변경되었습니다.`,
        relatedType: 'order',
        relatedId: order._id,
        priority: 'normal',
      });

      // 매장의 상위 KOL에게도 알림 (있는 경우)
      const shopRelationship = await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q => q.eq('shop_owner_id', shop._id).eq('is_active', true))
        .first();

      if (shopRelationship && shopRelationship.parent_id !== undefined) {
        await createNotification(ctx, {
          userId: shopRelationship.parent_id,
          type: 'order_created',
          title: '하위 매장 주문 상태 변경',
          message: `${shop.shop_name}의 주문 #${order.order_number || order._id} 상태가 "${args.newStatus}"로 변경되었습니다.`,
          relatedType: 'order',
          relatedId: order._id,
          priority: 'normal',
        });
      }

      return { success: true };
    } catch (error) {
      console.error('주문 상태 변경 알림 생성 오류:', error);
      throw error instanceof ApiError
        ? error
        : new ApiError(
            ERROR_CODES.DATABASE_ERROR,
            '주문 상태 변경 알림을 생성하는데 실패했습니다.'
          );
    }
  },
});
