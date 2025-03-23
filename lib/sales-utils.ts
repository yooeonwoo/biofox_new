/**
 * 매출수당계산 유틸리티 함수
 * 
 * 매출과 수당을 계산하고 관리하는 다양한 유틸리티 함수들을 제공합니다.
 */

import { getDB } from '@/db';
import { SQL, eq, and, desc, sql, gt, lte } from 'drizzle-orm';
import { 
  kols, 
  shops, 
  orders, 
  orderItems, 
  products, 
  commissions,
  monthlySales,
  productSalesRatios,
  kolHierarchy,
  kolMonthlySummary
} from '@/db/schema';

// 타입 정의 추가
interface SalesData {
  totalSales: number;
  yearMonth?: string;
}

interface ProductRatio {
  id: number;
  salesRatio: string;
  [key: string]: any;
}

/**
 * 현재 연월을 YYYY-MM 형식으로 반환합니다.
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 이전 연월을 YYYY-MM 형식으로 반환합니다.
 * @param yearMonth 기준 연월 (YYYY-MM 형식)
 */
export function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  
  if (month === 1) {
    return `${year - 1}-12`;
  } else {
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }
}

/**
 * 제품 매출액에 대한 수당을 계산합니다 (기기 제외 제품 매출의 30%)
 * @param productSales 제품 매출액
 */
export function calculateCommission(productSales: number): number {
  return Math.floor(productSales * 0.3); // 30% 수당, 소수점 이하 버림
}

/**
 * 주문에서 제품 매출과 기기 매출을 분리하여 계산합니다.
 * @param orderId 주문 ID
 */
export async function calculateSalesFromOrder(orderId: number): Promise<{
  productSales: number;
  deviceSales: number;
  totalSales: number;
}> {
  const db = await getDB(); // ---- 수정: 한 번만 호출 후 재사용
  const orderItemsWithProducts = await db
    .select({
      price: orderItems.price,
      quantity: orderItems.quantity,
      isDevice: products.isDevice
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
  
  let productSales = 0;
  let deviceSales = 0;
  
  for (const item of orderItemsWithProducts) {
    const itemTotal = (item.price || 0) * (item.quantity || 0);
    if (item.isDevice) {
      deviceSales += itemTotal;
    } else {
      productSales += itemTotal;
    }
  }
  
  const totalSales = productSales + deviceSales;
  return { productSales, deviceSales, totalSales };
}

/**
 * 주문 정보를 기반으로 매출 및 수당 데이터를 생성하거나 업데이트합니다.
 * @param orderId 주문 ID
 */
export async function processOrderSalesAndCommission(orderId: number): Promise<boolean> {
  try {
    // DB 객체 한 번만 가져오기
    const db = await getDB();

    // 주문 정보 조회
    const orderInfo = await db
      .select({
        id: orders.id,
        shopId: orders.shopId,
        orderDate: orders.orderDate,
        status: orders.status
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    if (orderInfo.length === 0) {
      throw new Error(`주문 ID ${orderId}에 해당하는 주문을 찾을 수 없습니다.`);
    }
    
    const order = orderInfo[0];
    
    // 취소된 주문인 경우 처리 중단
    if (order.status === 'cancelled') {
      return false;
    }
    
    // 매출액 계산
    const { productSales, deviceSales, totalSales } = await calculateSalesFromOrder(orderId);
    
    // 수당 계산
    const commission = calculateCommission(productSales);
    
    // 전문점 정보 조회
    const shopInfo = await db
      .select({
        id: shops.id,
        kolId: shops.kolId
      })
      .from(shops)
      .where(eq(shops.id, order.shopId))
      .limit(1);
    
    if (shopInfo.length === 0) {
      throw new Error(`전문점 ID ${order.shopId}에 해당하는 전문점을 찾을 수 없습니다.`);
    }
    
    const shop = shopInfo[0];
    
    // 연월 추출 (YYYY-MM 형식)
    const orderDate = new Date(order.orderDate);
    const yearMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 월별 매출 정보 조회 및 업데이트
    const existingMonthlySales = await db
      .select()
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.kolId, shop.kolId),
          eq(monthlySales.shopId, shop.id),
          eq(monthlySales.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (existingMonthlySales.length > 0) {
      // 기존 데이터 업데이트
      await db
        .update(monthlySales)
        .set({
          productSales: existingMonthlySales[0].productSales + productSales,
          deviceSales: existingMonthlySales[0].deviceSales + deviceSales,
          totalSales: existingMonthlySales[0].totalSales + totalSales,
          commission: existingMonthlySales[0].commission + commission,
          updatedAt: new Date()
        })
        .where(eq(monthlySales.id, existingMonthlySales[0].id));
    } else {
      // 새 데이터 생성
      await db
        .insert(monthlySales)
        .values({
          kolId: shop.kolId,
          shopId: shop.id,
          yearMonth,
          productSales,
          deviceSales,
          totalSales,
          commission,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    // 수당 정보 생성
    await db
      .insert(commissions)
      .values({
        kolId: shop.kolId,
        orderId,
        amount: commission,
        settled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
    // KOL 월별 요약 데이터 업데이트
    await updateKolMonthlySummary(shop.kolId, yearMonth);
    
    // 제품별 매출 비율 업데이트
    await updateProductSalesRatios(shop.kolId, shop.id, yearMonth, orderId);
    
    return true;
  } catch (error) {
    console.error('주문 매출 및 수당 처리 중 오류:', error);
    return false;
  }
}

/**
 * KOL의 월별 요약 데이터를 업데이트합니다.
 * @param kolId KOL ID
 * @param yearMonth 연월 (YYYY-MM 형식)
 */
export async function updateKolMonthlySummary(kolId: number, yearMonth: string): Promise<void> {
  try {
    const db = await getDB();

    // 당월 매출 및 수당 합계 계산
    const monthlySalesSum = await db
      .select({
        totalSales: sql<number>`SUM(${monthlySales.totalSales})`,
        totalCommission: sql<number>`SUM(${monthlySales.commission})`
      })
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.kolId, kolId),
          eq(monthlySales.yearMonth, yearMonth)
        )
      );
    
    const currentMonthSales = monthlySalesSum[0]?.totalSales || 0;
    const currentMonthCommission = monthlySalesSum[0]?.totalCommission || 0;
    
    // 전월 데이터 조회
    const previousMonth = getPreviousYearMonth(yearMonth);
    const previousMonthData = await db
      .select({
        monthlySales: kolMonthlySummary.monthlySales,
        monthlyCommission: kolMonthlySummary.monthlyCommission
      })
      .from(kolMonthlySummary)
      .where(
        and(
          eq(kolMonthlySummary.kolId, kolId),
          eq(kolMonthlySummary.yearMonth, previousMonth)
        )
      )
      .limit(1);
    
    const previousMonthSales = previousMonthData[0]?.monthlySales || 0;
    const previousMonthCommission = previousMonthData[0]?.monthlyCommission || 0;
    
    // 최근 3개월 평균 매출 계산 (당월 포함)
    const threeMonthAvg = await calculateThreeMonthAverage(kolId, yearMonth);
    
    // 누적 수당 계산
    const cumulativeCommissionResult = await db
      .select({
        total: sql<number>`SUM(${monthlySales.commission})`
      })
      .from(monthlySales)
      .where(eq(monthlySales.kolId, kolId));
    
    const cumulativeCommission = cumulativeCommissionResult[0]?.total || 0;
    
    // 활성 전문점 수 계산 (당월 주문이 있는 전문점)
    const activeShopsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${monthlySales.shopId})`
      })
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.kolId, kolId),
          eq(monthlySales.yearMonth, yearMonth)
        )
      );
    
    const activeShopsCount = activeShopsResult[0]?.count || 0;
    
    // 총 전문점 수 계산
    const totalShopsResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(shops)
      .where(eq(shops.kolId, kolId));
    
    const totalShopsCount = totalShopsResult[0]?.count || 0;
    
    // 기존 월별 요약 데이터 조회
    const existingSummary = await db
      .select()
      .from(kolMonthlySummary)
      .where(
        and(
          eq(kolMonthlySummary.kolId, kolId),
          eq(kolMonthlySummary.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (existingSummary.length > 0) {
      // 기존 데이터 업데이트
      await db
        .update(kolMonthlySummary)
        .set({
          monthlySales: currentMonthSales,
          monthlyCommission: currentMonthCommission,
          avgMonthlySales: threeMonthAvg.toString(),
          cumulativeCommission,
          previousMonthSales,
          previousMonthCommission,
          activeShopsCount,
          totalShopsCount,
          updatedAt: new Date()
        })
        .where(eq(kolMonthlySummary.id, existingSummary[0].id));
    } else {
      // 새 데이터 생성
      await db
        .insert(kolMonthlySummary)
        .values({
          kolId,
          yearMonth,
          monthlySales: currentMonthSales,
          monthlyCommission: currentMonthCommission,
          avgMonthlySales: threeMonthAvg.toString(),
          cumulativeCommission,
          previousMonthSales,
          previousMonthCommission,
          activeShopsCount,
          totalShopsCount,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  } catch (error) {
    console.error('KOL 월별 요약 데이터 업데이트 중 오류:', error);
    throw error;
  }
}

/**
 * 최근 3개월 평균 매출을 계산합니다.
 * @param kolId KOL ID
 * @param yearMonth 기준 연월 (YYYY-MM 형식)
 * @returns 3개월 평균 매출
 */
export async function calculateThreeMonthAverage(kolId: number, yearMonth: string): Promise<number> {
  try {
    const db = await getDB();

    // 최근 3개월 매출 조회
    const salesData = await db
      .select({
        yearMonth: monthlySales.yearMonth,
        totalSales: monthlySales.totalSales
      })
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.kolId, kolId),
          lte(monthlySales.yearMonth, yearMonth)
        )
      )
      .orderBy(desc(monthlySales.yearMonth))
      .limit(3)
      .groupBy(monthlySales.yearMonth);
    
    if (salesData.length === 0) {
      return 0;
    }
    
    // 평균 계산
    const total = salesData.reduce((sum: number, data: SalesData) => sum + data.totalSales, 0);
    return +(total / salesData.length).toFixed(2);
  } catch (error) {
    console.error('3개월 평균 매출 계산 중 오류:', error);
    throw error;
  }
}

/**
 * 전문점의 제품별 매출 비율을 업데이트합니다.
 * @param kolId KOL ID
 * @param shopId 전문점 ID
 * @param yearMonth 연월 (YYYY-MM 형식)
 * @param orderId 주문 ID
 */
export async function updateProductSalesRatios(
  kolId: number, 
  shopId: number, 
  yearMonth: string,
  orderId: number
): Promise<void> {
  try {
    const db = await getDB();

    // 주문의 제품별 매출 계산
    const orderProductSales = await db
      .select({
        productId: orderItems.productId,
        salesAmount: sql<number>`${orderItems.price} * ${orderItems.quantity}`
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(products.isDevice, false) // 기기 제외
        )
      );
    
    if (orderProductSales.length === 0) {
      return; // 제품 매출이 없는 경우
    }
    
    // 해당 월의 전체 제품 매출 조회
    const totalProductSales = await db
      .select({
        productSales: monthlySales.productSales
      })
      .from(monthlySales)
      .where(
        and(
          eq(monthlySales.kolId, kolId),
          eq(monthlySales.shopId, shopId),
          eq(monthlySales.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (
      totalProductSales.length === 0 || 
      !totalProductSales[0].productSales || 
      totalProductSales[0].productSales === 0
    ) {
      return; // 매출 데이터가 없거나 0인 경우
    }
    
    const monthlyProductSales = totalProductSales[0].productSales;
    
    // 주문의 각 제품별로 비율 업데이트
    for (const product of orderProductSales) {
      // 해당 제품의 기존 매출 비율 데이터 조회
      const existingRatio = await db
        .select()
        .from(productSalesRatios)
        .where(
          and(
            eq(productSalesRatios.kolId, kolId),
            eq(productSalesRatios.shopId, shopId),
            eq(productSalesRatios.yearMonth, yearMonth),
            eq(productSalesRatios.productId, product.productId)
          )
        )
        .limit(1);
      
      // 전체 매출 중 해당 제품의 비율 계산
      const currentSalesAmount = product.salesAmount || 0;
      const updatedSalesAmount = existingRatio.length > 0
        ? existingRatio[0].salesAmount + currentSalesAmount
        : currentSalesAmount;
      
      const salesRatio = (updatedSalesAmount / monthlyProductSales).toFixed(4);
      
      if (existingRatio.length > 0) {
        // 기존 데이터 업데이트
        await db
          .update(productSalesRatios)
          .set({
            salesAmount: updatedSalesAmount,
            salesRatio,
            updatedAt: new Date()
          })
          .where(eq(productSalesRatios.id, existingRatio[0].id));
      } else {
        // 새 데이터 생성
        await db
          .insert(productSalesRatios)
          .values({
            kolId,
            shopId,
            yearMonth,
            productId: product.productId,
            salesAmount: currentSalesAmount,
            salesRatio,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    }
    
    // 모든 제품의 비율 재계산 (합이 1이 되도록)
    await normalizeProductRatios(kolId, shopId, yearMonth);
  } catch (error) {
    console.error('제품별 매출 비율 업데이트 중 오류:', error);
    throw error;
  }
}

/**
 * 제품별 매출 비율의 합이 1이 되도록 정규화합니다.
 * @param kolId KOL ID
 * @param shopId 전문점 ID
 * @param yearMonth 연월 (YYYY-MM 형식)
 */
export async function normalizeProductRatios(
  kolId: number,
  shopId: number,
  yearMonth: string
): Promise<void> {
  try {
    const db = await getDB();

    // 해당 월의 모든 제품 비율 조회
    const productRatios = await db
      .select()
      .from(productSalesRatios)
      .where(
        and(
          eq(productSalesRatios.kolId, kolId),
          eq(productSalesRatios.shopId, shopId),
          eq(productSalesRatios.yearMonth, yearMonth)
        )
      );
    
    if (productRatios.length === 0) {
      return; // 데이터가 없는 경우
    }
    
    // 총 비율 합계 계산
    const totalRatio = productRatios.reduce(
      (sum: number, ratio: ProductRatio) => sum + Number(ratio.salesRatio),
      0
    );
    
    // 이미 합계가 1에 가까우면 정규화 불필요
    if (Math.abs(totalRatio - 1) < 0.001) {
      return;
    }
    
    // 각 제품의 비율 정규화
    for (const ratio of productRatios) {
      const normalizedRatio = (Number(ratio.salesRatio) / totalRatio).toFixed(4);
      
      await db
        .update(productSalesRatios)
        .set({
          salesRatio: normalizedRatio,
          updatedAt: new Date()
        })
        .where(eq(productSalesRatios.id, ratio.id));
    }
  } catch (error) {
    console.error('제품 비율 정규화 중 오류:', error);
    throw error;
  }
}

/**
 * 상위 KOL에게 하위 KOL 첫 달 매출의 10% 수당을 지급합니다.
 * @param childKolId 하위 KOL ID
 * @param yearMonth 연월 (YYYY-MM 형식)
 */
export async function processParentKolCommission(
  childKolId: number,
  yearMonth: string
): Promise<void> {
  try {
    const db = await getDB();

    // 하위 KOL의 상위 KOL 정보 조회
    const hierarchyInfo = await db
      .select({
        id: kolHierarchy.id,
        parentKolId: kolHierarchy.parentKolId,
        childStartMonth: kolHierarchy.childStartMonth
      })
      .from(kolHierarchy)
      .where(eq(kolHierarchy.childKolId, childKolId))
      .limit(1);
    
    if (hierarchyInfo.length === 0) {
      return; // 상위 KOL이 없는 경우
    }
    
    const hierarchy = hierarchyInfo[0];
    
    // 첫 달인지 확인
    if (hierarchy.childStartMonth !== yearMonth) {
      return; // 첫 달이 아닌 경우
    }
    
    // 하위 KOL의 해당 월 매출 조회
    const childMonthlySummary = await db
      .select({
        monthlySales: kolMonthlySummary.monthlySales
      })
      .from(kolMonthlySummary)
      .where(
        and(
          eq(kolMonthlySummary.kolId, childKolId),
          eq(kolMonthlySummary.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (
      childMonthlySummary.length === 0 || 
      childMonthlySummary[0].monthlySales === 0
    ) {
      return; // 매출이 없는 경우
    }
    
    // 상위 KOL에게 지급할 수당 계산 (하위 KOL 첫 달 매출의 10%)
    const parentCommission = Math.floor(childMonthlySummary[0].monthlySales * 0.1);
    if (parentCommission <= 0) {
      return; // 수당이 0 이하인 경우
    }
    
    // 상위 KOL의 월별 요약 데이터 업데이트
    const parentSummary = await db
      .select()
      .from(kolMonthlySummary)
      .where(
        and(
          eq(kolMonthlySummary.kolId, hierarchy.parentKolId),
          eq(kolMonthlySummary.yearMonth, yearMonth)
        )
      )
      .limit(1);
    
    if (parentSummary.length > 0) {
      // 기존 데이터 업데이트
      await db
        .update(kolMonthlySummary)
        .set({
          monthlyCommission: parentSummary[0].monthlyCommission + parentCommission,
          cumulativeCommission: parentSummary[0].cumulativeCommission + parentCommission,
          updatedAt: new Date()
        })
        .where(eq(kolMonthlySummary.id, parentSummary[0].id));
    } else {
      // 새 데이터 생성 (필요한 경우)
      await updateKolMonthlySummary(hierarchy.parentKolId, yearMonth);
      
      // 업데이트된 데이터에 수당 추가
      const updatedParentSummary = await db
        .select()
        .from(kolMonthlySummary)
        .where(
          and(
            eq(kolMonthlySummary.kolId, hierarchy.parentKolId),
            eq(kolMonthlySummary.yearMonth, yearMonth)
          )
        )
        .limit(1);
      
      if (updatedParentSummary.length > 0) {
        await db
          .update(kolMonthlySummary)
          .set({
            monthlyCommission: updatedParentSummary[0].monthlyCommission + parentCommission,
            cumulativeCommission: updatedParentSummary[0].cumulativeCommission + parentCommission,
            updatedAt: new Date()
          })
          .where(eq(kolMonthlySummary.id, updatedParentSummary[0].id));
      }
    }
  } catch (error) {
    console.error('상위 KOL 수당 처리 중 오류:', error);
    throw error;
  }
}

/**
 * 평균 계산
 * @param salesData 매출 데이터 배열
 * @returns 평균값
 */
function calculateAverage(salesData: Array<{ totalSales: number }>): number {
  if (salesData.length === 0) {
    return 0;
  }
  
  const total = salesData.reduce(
    (sum: number, data: { totalSales: number }) => sum + data.totalSales,
    0
  );
  return +(total / salesData.length).toFixed(2);
}
