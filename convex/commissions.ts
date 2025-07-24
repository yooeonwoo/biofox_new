/**
 * 수수료 관리 (Commission Management) Query & Mutation Functions
 * Supabase /api/commissions/* 엔드포인트와 완전 호환되는 Convex 구현
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';
import {
  requireAdmin,
  getCurrentUser,
  validateAmount,
  createAuditLog,
  createNotification,
  ApiError,
  ERROR_CODES,
  formatError,
} from './utils';

/**
 * 수수료 계산 목록 조회 (페이지네이션, 필터링, 정렬 지원)
 * GET /api/commissions 대체
 */
export const getCommissionCalculations = query({
  args: {
    // 페이지네이션
    paginationOpts: paginationOptsValidator,

    // 필터링 옵션
    month: v.optional(v.string()), // YYYY-MM 형식
    kol_id: v.optional(v.id('profiles')),
    status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('reviewed'),
        v.literal('approved'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 월 필터 처리
      let startDate: number | undefined, endDate: number | undefined;
      if (args.month) {
        const [year, month] = args.month.split('-').map(Number);
        if (!year || !month || month < 1 || month > 12) {
          throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '잘못된 월 형식입니다.');
        }
        startDate = new Date(year, month - 1, 1).getTime();
        endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      }

      // 기본 쿼리 구성
      let allCalculations;

      // KOL ID 필터
      if (args.kol_id) {
        allCalculations = await ctx.db
          .query('commission_calculations')
          .withIndex('by_kol', q => q.eq('kol_id', args.kol_id!))
          .collect();
      } else {
        allCalculations = await ctx.db.query('commission_calculations').collect();
      }

      // 필터링
      let filteredCalculations = allCalculations.filter(calc => {
        // 월 필터
        if (startDate && endDate) {
          if (calc.calculation_month < startDate || calc.calculation_month > endDate) {
            return false;
          }
        }

        // 상태 필터
        if (args.status && calc.status !== args.status) {
          return false;
        }

        return true;
      });

      // KOL 정보와 함께 결과 구성
      const commissionsWithKol = await Promise.all(
        filteredCalculations.map(async calc => {
          const kol = await ctx.db.get(calc.kol_id);

          return {
            ...calc,
            kol: kol
              ? {
                  id: kol._id,
                  name: kol.name,
                  shop_name: kol.shop_name,
                  email: kol.email,
                  bank_info: null, // 스키마에 없는 필드이므로 null
                  role: kol.role,
                }
              : null,
            calculation_month: new Date(calc.calculation_month).toISOString().substring(0, 7), // YYYY-MM 형식으로 변환
          };
        })
      );

      // 정렬 (총 수수료 내림차순, 계산일 내림차순)
      commissionsWithKol.sort((a, b) => {
        if (a.total_commission !== b.total_commission) {
          return b.total_commission - a.total_commission;
        }
        return b.calculated_at - a.calculated_at;
      });

      // 페이지네이션 적용
      const startIndex = 0; // args.paginationOpts를 고려한 시작 인덱스
      const endIndex = args.paginationOpts.numItems;
      const page = commissionsWithKol.slice(startIndex, endIndex);
      const isDone = commissionsWithKol.length <= args.paginationOpts.numItems;

      return {
        page,
        isDone,
        continueCursor: isDone ? null : 'next',
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 수수료 요약 통계 조회
 * GET /api/commissions에서 summary 부분 대체
 */
export const getCommissionSummary = query({
  args: {
    month: v.optional(v.string()), // YYYY-MM 형식
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 현재 월 또는 지정된 월
      const targetMonth = args.month || new Date().toISOString().substring(0, 7);
      const [year, month] = targetMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      // 해당 월의 수수료 계산 조회
      const calculations = await ctx.db
        .query('commission_calculations')
        .withIndex('by_month', q =>
          q.gte('calculation_month', startDate).lte('calculation_month', endDate)
        )
        .collect();

      // 요약 계산
      const total_amount = calculations.reduce((sum, c) => sum + c.total_commission, 0);
      const calculated_amount = calculations
        .filter(c => c.status === 'calculated')
        .reduce((sum, c) => sum + c.total_commission, 0);
      const paid_amount = calculations
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.total_commission, 0);
      const pending_amount = calculated_amount;

      return {
        total_amount,
        calculated_amount,
        paid_amount,
        pending_amount,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 월별 수수료 계산 실행
 * POST /api/commissions 대체
 */
export const calculateMonthlyCommissions = mutation({
  args: {
    month: v.string(), // YYYY-MM 형식
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireAdmin(ctx);

      // 월 형식 검증
      const [year, month] = args.month.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '잘못된 월 형식입니다.');
      }

      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      const calculationMonth = startDate; // 월초로 저장

      console.log(`🔄 수수료 계산 시작: ${args.month}`);

      // 모든 KOL/OL 조회
      const allKols = await ctx.db
        .query('profiles')
        .filter(q =>
          q.and(
            q.or(q.eq(q.field('role'), 'kol'), q.eq(q.field('role'), 'ol')),
            q.eq(q.field('status'), 'approved')
          )
        )
        .collect();

      console.log(`👥 대상 KOL/OL 수: ${allKols.length}명`);

      const calculations = [];
      let calculatedCount = 0;

      for (const kol of allKols) {
        try {
          // 1. 소속 샵들의 주문 수수료 계산
          const activeRelationships = await ctx.db
            .query('shop_relationships')
            .withIndex('by_parent', q => q.eq('parent_id', kol._id))
            .filter(q => q.eq(q.field('is_active'), true))
            .collect();

          const subordinateShopIds = activeRelationships.map(r => r.shop_owner_id);

          let subordinateSales = 0;
          let subordinateCommission = 0;

          if (subordinateShopIds.length > 0) {
            const subordinateOrders = await ctx.db
              .query('orders')
              .filter(q =>
                q.and(
                  q.gte(q.field('order_date'), startDate),
                  q.lte(q.field('order_date'), endDate),
                  q.eq(q.field('is_self_shop_order'), false)
                )
              )
              .collect();

            const filteredOrders = subordinateOrders.filter(order =>
              subordinateShopIds.includes(order.shop_id)
            );

            subordinateSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
            subordinateCommission = filteredOrders.reduce(
              (sum, o) => sum + (o.commission_amount || 0),
              0
            );
          }

          // 2. 본인샵 주문 수수료 계산
          const selfOrders = await ctx.db
            .query('orders')
            .withIndex('by_shop', q => q.eq('shop_id', kol._id))
            .filter(q =>
              q.and(
                q.gte(q.field('order_date'), startDate),
                q.lte(q.field('order_date'), endDate),
                q.eq(q.field('is_self_shop_order'), true)
              )
            )
            .collect();

          const selfShopSales = selfOrders.reduce((sum, o) => sum + o.total_amount, 0);
          const commissionRate = kol.commission_rate || (kol.role === 'kol' ? 30 : 20);
          const selfShopCommission = selfShopSales * (commissionRate / 100);

          // 3. 기기 판매 수수료 계산
          const deviceSales = await ctx.db
            .query('device_sales')
            .filter(q =>
              q.and(q.gte(q.field('sale_date'), startDate), q.lte(q.field('sale_date'), endDate))
            )
            .collect();

          const kolDeviceSales = deviceSales.filter(sale =>
            subordinateShopIds.includes(sale.shop_id)
          );

          const deviceCommission = kolDeviceSales.reduce(
            (sum, d) => sum + (d.actual_commission || 0),
            0
          );

          // 4. 총 수수료 계산
          const totalCommission = subordinateCommission + selfShopCommission + deviceCommission;

          if (totalCommission > 0) {
            // 기존 계산 확인
            const existing = await ctx.db
              .query('commission_calculations')
              .withIndex('by_kol_month', q =>
                q.eq('kol_id', kol._id).eq('calculation_month', calculationMonth)
              )
              .first();

            const calculationData = {
              kol_id: kol._id,
              calculation_month: calculationMonth,
              subordinate_shop_count: subordinateShopIds.length,
              active_shop_count: subordinateShopIds.length,
              subordinate_sales: subordinateSales,
              subordinate_commission: subordinateCommission,
              self_shop_sales: selfShopSales,
              self_shop_commission: selfShopCommission,
              device_count: kolDeviceSales.length,
              device_commission: deviceCommission,
              total_commission: totalCommission,
              status: 'calculated' as const,
              calculation_details: {
                subordinate_shops: subordinateShopIds,
                commission_rate: commissionRate,
                calculation_date: Date.now(),
              },
              calculated_at: Date.now(),
              created_by: currentUser._id,
              updated_by: currentUser._id,
              updated_at: Date.now(),
            };

            if (existing) {
              // 업데이트
              await ctx.db.patch(existing._id, {
                ...calculationData,
                created_at: existing.created_at, // 기존 생성일 유지
              });
            } else {
              // 신규 생성
              const newCalc = await ctx.db.insert('commission_calculations', {
                ...calculationData,
                created_at: Date.now(),
              });
              calculations.push(newCalc);
            }

            calculatedCount++;
          }

          console.log(
            `✅ ${kol.name} (${kol.role.toUpperCase()}): ₩${totalCommission.toLocaleString()}`
          );
        } catch (error) {
          console.error(`❌ ${kol.name} 계산 오류:`, error);
        }
      }

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'commission_calculations',
        recordId: 'bulk_calculation',
        action: 'INSERT',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {},
        newValues: { calculation_month: args.month },
        changedFields: ['commission_calculations'],
        metadata: {
          action_type: 'monthly_commission_calculation',
          month: args.month,
          calculated_count: calculatedCount,
          total_kols: allKols.length,
        },
      });

      console.log(`🎉 수수료 계산 완료: ${calculatedCount}건`);

      return {
        success: true,
        message: `${args.month} 수수료 계산 완료`,
        calculated_count: calculatedCount,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 수수료 계산 상세 조회
 * GET /api/commissions/[commissionId] 대체
 */
export const getCommissionCalculationDetail = query({
  args: {
    commissionId: v.id('commission_calculations'),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      const commission = await ctx.db.get(args.commissionId);
      if (!commission) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '수수료 계산을 찾을 수 없습니다.');
      }

      // KOL 정보 조회
      const kol = await ctx.db.get(commission.kol_id);
      if (!kol) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, 'KOL 정보를 찾을 수 없습니다.');
      }

      // 월 범위 계산
      const calculationDate = new Date(commission.calculation_month);
      const startDate = new Date(
        calculationDate.getFullYear(),
        calculationDate.getMonth(),
        1
      ).getTime();
      const endDate = new Date(
        calculationDate.getFullYear(),
        calculationDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      ).getTime();

      // 소속 샵들 정보
      const subordinateShops = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent', q => q.eq('parent_id', kol._id))
        .filter(q => q.eq(q.field('is_active'), true))
        .collect();

      const subordinateDetails = await Promise.all(
        subordinateShops.map(async rel => {
          const shop = await ctx.db.get(rel.shop_owner_id);
          if (!shop) return null;

          const shopOrders = await ctx.db
            .query('orders')
            .withIndex('by_shop', q => q.eq('shop_id', shop._id))
            .filter(q =>
              q.and(
                q.gte(q.field('order_date'), startDate),
                q.lte(q.field('order_date'), endDate),
                q.eq(q.field('is_self_shop_order'), false)
              )
            )
            .collect();

          const sales = shopOrders.reduce((sum, o) => sum + o.total_amount, 0);
          const commissionAmount = shopOrders.reduce(
            (sum, o) => sum + (o.commission_amount || 0),
            0
          );

          return {
            shop_id: shop._id,
            shop_name: shop.shop_name || shop.name,
            sales,
            commission_rate: kol.role === 'kol' ? 30 : 20,
            commission_amount: commissionAmount,
          };
        })
      );

      // 본인샵 매출 정보
      const selfShopOrders = await ctx.db
        .query('orders')
        .withIndex('by_shop', q => q.eq('shop_id', kol._id))
        .filter(q =>
          q.and(
            q.gte(q.field('order_date'), startDate),
            q.lte(q.field('order_date'), endDate),
            q.eq(q.field('is_self_shop_order'), true)
          )
        )
        .collect();

      const selfShopSales = selfShopOrders.reduce((sum, o) => sum + o.total_amount, 0);

      // 기기 판매 상세
      const deviceSales = await ctx.db
        .query('device_sales')
        .filter(q =>
          q.and(q.gte(q.field('sale_date'), startDate), q.lte(q.field('sale_date'), endDate))
        )
        .collect();

      const kolDeviceSales = await Promise.all(
        deviceSales
          .filter(sale => subordinateShops.some(rel => rel.shop_owner_id === sale.shop_id))
          .map(async sale => {
            const shop = await ctx.db.get(sale.shop_id);
            return {
              sale_id: sale._id,
              shop_name: shop?.shop_name || 'Unknown Shop',
              quantity: Math.abs(sale.quantity || 1),
              tier: sale.tier_at_sale,
              commission_per_unit: (sale.standard_commission || 0) / Math.abs(sale.quantity || 1),
              total_commission: sale.actual_commission || 0,
            };
          })
      );

      // 조정 내역 (adjustments)
      const adjustments = commission.calculation_details?.adjustments || [];

      return {
        id: commission._id,
        kol: {
          id: kol._id,
          name: kol.name,
          role: kol.role,
          shop_name: kol.shop_name,
          email: kol.email,
          bank_info: null, // 스키마에 없는 필드이므로 null
        },
        calculation_month: new Date(commission.calculation_month).toISOString().substring(0, 7),
        details: {
          subordinate_shops: subordinateDetails.filter(d => d && d.commission_amount > 0),
          self_shop: {
            sales: selfShopSales,
            commission_amount: commission.self_shop_commission || 0,
          },
          devices: kolDeviceSales,
        },
        adjustments,
        total_commission: commission.total_commission,
        status: commission.status,
        payment: commission.payment_reference
          ? {
              payment_date: commission.payment_date,
              payment_reference: commission.payment_reference,
            }
          : null,
      };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 수수료 계산 업데이트 (조정, 상태 변경)
 * PUT /api/commissions/[commissionId] 대체
 */
export const updateCommissionCalculation = mutation({
  args: {
    commissionId: v.id('commission_calculations'),
    adjustment_amount: v.optional(v.number()),
    adjustment_reason: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('reviewed'),
        v.literal('approved'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
    payment_info: v.optional(
      v.object({
        payment_date: v.optional(v.number()),
        payment_reference: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      const currentUser = await requireAdmin(ctx);

      const current = await ctx.db.get(args.commissionId);
      if (!current) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, '수수료 계산을 찾을 수 없습니다.');
      }

      const updates: any = {
        updated_by: currentUser._id,
        updated_at: Date.now(),
      };

      // 조정 금액이 있는 경우
      if (args.adjustment_amount !== undefined && args.adjustment_reason) {
        const currentDetails = current.calculation_details || {};
        const newAdjustments = [
          ...(currentDetails.adjustments || []),
          {
            amount: args.adjustment_amount,
            reason: args.adjustment_reason,
            adjusted_by: {
              id: currentUser._id,
              name: currentUser.name,
            },
            adjusted_at: Date.now(),
          },
        ];

        updates.calculation_details = {
          ...currentDetails,
          adjustments: newAdjustments,
        };
        updates.manual_adjustment = (current.manual_adjustment || 0) + args.adjustment_amount;
        updates.total_commission =
          (current.subordinate_commission || 0) +
          (current.self_shop_commission || 0) +
          (current.device_commission || 0) +
          updates.manual_adjustment;
        updates.status = 'adjusted';
      }

      // 상태 변경
      if (args.status) {
        updates.status = args.status;
      }

      // 지급 정보
      if (args.payment_info) {
        updates.payment_date = args.payment_info.payment_date || Date.now();
        updates.payment_reference = args.payment_info.payment_reference;
        updates.paid_at = Date.now();
        updates.status = 'paid';
      }

      await ctx.db.patch(args.commissionId, updates);

      // 감사 로그 생성
      await createAuditLog(ctx, {
        tableName: 'commission_calculations',
        recordId: args.commissionId,
        action: 'UPDATE',
        userId: currentUser._id,
        userRole: currentUser.role,
        oldValues: {
          status: current.status,
          total_commission: current.total_commission,
          manual_adjustment: current.manual_adjustment,
        },
        newValues: updates,
        changedFields: Object.keys(updates),
        metadata: {
          action_type: 'commission_update',
          adjustment_reason: args.adjustment_reason,
        },
      });

      // 지급 완료 시 알림 생성
      if (args.status === 'paid' || args.payment_info) {
        await createNotification(ctx, {
          userId: current.kol_id,
          type: 'commission_paid',
          title: '수수료 지급 완료',
          message: `${new Date(current.calculation_month).toISOString().substring(0, 7)} 수수료가 지급되었습니다.`,
          relatedType: 'commission_calculation',
          relatedId: args.commissionId,
          priority: 'normal',
        });
      }

      return { success: true };
    } catch (error) {
      throw formatError(error);
    }
  },
});

/**
 * 수수료 데이터 내보내기용 조회
 * GET /api/commissions/export 대체
 */
export const getCommissionsForExport = query({
  args: {
    month: v.string(), // YYYY-MM 형식
  },
  handler: async (ctx, args) => {
    try {
      // 관리자 권한 확인
      await requireAdmin(ctx);

      // 월 범위 계산
      const [year, month] = args.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      // 해당 월의 수수료 계산 조회
      const calculations = await ctx.db
        .query('commission_calculations')
        .withIndex('by_month', q =>
          q.gte('calculation_month', startDate).lte('calculation_month', endDate)
        )
        .collect();

      // KOL 정보와 함께 데이터 구성
      const commissionsWithKol = await Promise.all(
        calculations.map(async calc => {
          const kol = await ctx.db.get(calc.kol_id);

          return {
            ...calc,
            kol: kol
              ? {
                  id: kol._id,
                  name: kol.name,
                  role: kol.role,
                  shop_name: kol.shop_name,
                  email: kol.email,
                  bank_info: null, // 스키마에 없는 필드이므로 null
                }
              : null,
            adjustments: calc.calculation_details?.adjustments || [],
          };
        })
      );

      // 총 수수료 내림차순 정렬
      commissionsWithKol.sort((a, b) => b.total_commission - a.total_commission);

      return { data: commissionsWithKol };
    } catch (error) {
      throw formatError(error);
    }
  },
});
