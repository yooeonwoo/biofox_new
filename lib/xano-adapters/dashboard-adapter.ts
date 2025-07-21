/**
 * Xano Dashboard Adapter
 * 
 * 기존 Supabase 데이터 구조를 유지하면서 
 * Xano 데이터베이스에서 데이터를 가져와 변환하는 어댑터
 */

import { xanoDb } from '@/lib/xano-db';

interface DashboardKolData {
  id: number;
  name: string;
  shopName: string;
}

interface DashboardSalesData {
  currentMonth: number;
  previousMonth: number;
  growth: number;
}

interface DashboardShopsData {
  total: number;
  ordering: number;
  notOrdering: number;
}

interface ShopData {
  id: number;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_self_shop: boolean;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
  };
}

export class DashboardAdapter {
  /**
   * KOL 정보 조회
   */
  static async getKolInfo(userId: string) {
    const query = `
      SELECT id, name, shop_name, role, commission_rate
      FROM profiles
      WHERE id = $1 AND role IN ('kol', 'ol')
      LIMIT 1
    `;
    
    return await xanoDb.query(query, [userId]);
  }

  /**
   * KOL 대시보드 데이터 조회
   * Supabase 구조와 동일한 형태로 반환
   */
  static async getDashboardData(userId: string, currentMonth: string, previousMonth: string) {
    try {
      // 1. KOL 정보 조회 (Xano의 profiles 테이블 사용)
      const kolResult = await this.getKolInfo(userId);
      
      if (!kolResult.rows[0]) {
        throw new Error('KOL 정보를 찾을 수 없습니다.');
      }
      
      const kolData = kolResult.rows[0];
      const kolId = kolData.id;

      // 2. 현재 월 매출 및 수수료 데이터 조회
      const currentMonthQuery = `
        SELECT 
          COALESCE(SUM(o.total_amount), 0) as monthly_sales,
          COALESCE(SUM(o.commission_amount), 0) as monthly_commission,
          COUNT(DISTINCT o.shop_id) as active_shops_count
        FROM orders o
        WHERE EXISTS (
          SELECT 1 FROM shop_relationships sr
          WHERE sr.shop_owner_id = o.shop_id 
          AND sr.parent_id = $1
          AND sr.is_active = true
        )
        AND o.order_date >= $2::date
        AND o.order_date < ($2::date + interval '1 month')
        AND o.commission_status != 'cancelled'
      `;

      const currentMonthResult = await xanoDb.query(currentMonthQuery, [
        kolId, 
        `${currentMonth}-01`
      ]);

      // 3. 이전 월 매출 및 수수료 데이터 조회
      const previousMonthQuery = `
        SELECT 
          COALESCE(SUM(o.total_amount), 0) as monthly_sales,
          COALESCE(SUM(o.commission_amount), 0) as monthly_commission
        FROM orders o
        WHERE EXISTS (
          SELECT 1 FROM shop_relationships sr
          WHERE sr.shop_owner_id = o.shop_id 
          AND sr.parent_id = $1
          AND sr.is_active = true
        )
        AND o.order_date >= $2::date
        AND o.order_date < ($2::date + interval '1 month')
        AND o.commission_status != 'cancelled'
      `;

      const previousMonthResult = await xanoDb.query(previousMonthQuery, [
        kolId,
        `${previousMonth}-01`
      ]);

      // 4. 전체 소속 전문점 수 조회
      const totalShopsQuery = `
        SELECT COUNT(*) as total_shops
        FROM shop_relationships
        WHERE parent_id = $1 AND is_active = true
      `;

      const totalShopsResult = await xanoDb.query(totalShopsQuery, [kolId]);

      // 5. 소속 전문점 목록 및 매출 조회
      const shopsQuery = `
        SELECT 
          p.id,
          p.name as owner_name,
          p.shop_name,
          p.region,
          p.status,
          p.created_at,
          CASE WHEN p.id = $1 THEN true ELSE false END as is_self_shop,
          COALESCE(current_sales.total_amount, 0) as current_month_total,
          COALESCE(current_sales.product_amount, 0) as current_month_product,
          COALESCE(current_sales.device_amount, 0) as current_month_device
        FROM profiles p
        INNER JOIN shop_relationships sr ON sr.shop_owner_id = p.id
        LEFT JOIN LATERAL (
          SELECT 
            SUM(o.total_amount) as total_amount,
            SUM(CASE WHEN oi.product_name NOT LIKE '%기기%' THEN oi.subtotal ELSE 0 END) as product_amount,
            SUM(CASE WHEN oi.product_name LIKE '%기기%' THEN oi.subtotal ELSE 0 END) as device_amount
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          WHERE o.shop_id = p.id
          AND o.order_date >= $2::date
          AND o.order_date < ($2::date + interval '1 month')
          AND o.commission_status != 'cancelled'
        ) current_sales ON true
        WHERE sr.parent_id = $1 AND sr.is_active = true
        ORDER BY current_month_total DESC
      `;

      const shopsResult = await xanoDb.query(shopsQuery, [kolId, `${currentMonth}-01`]);

      // 데이터 변환
      const currentMonthData = currentMonthResult.rows[0];
      const previousMonthData = previousMonthResult.rows[0];
      const totalShops = parseInt(totalShopsResult.rows[0].total_shops);
      const activeShops = parseInt(currentMonthData.active_shops_count);

      // Supabase 형식에 맞게 변환
      const dashboardData = {
        dashboard: {
          kol: {
            id: kolData.id,
            name: kolData.name,
            shopName: kolData.shop_name
          },
          sales: {
            currentMonth: parseFloat(currentMonthData.monthly_sales),
            previousMonth: parseFloat(previousMonthData.monthly_sales),
            growth: parseFloat(currentMonthData.monthly_sales) - parseFloat(previousMonthData.monthly_sales)
          },
          allowance: {
            currentMonth: parseFloat(currentMonthData.monthly_commission),
            previousMonth: parseFloat(previousMonthData.monthly_commission),
            growth: parseFloat(currentMonthData.monthly_commission) - parseFloat(previousMonthData.monthly_commission)
          },
          shops: {
            total: totalShops,
            ordering: activeShops,
            notOrdering: totalShops - activeShops
          }
        },
        shops: {
          shops: shopsResult.rows.map(shop => ({
            id: shop.id,
            ownerName: shop.owner_name,
            shop_name: shop.shop_name,
            region: shop.region,
            status: shop.status,
            createdAt: shop.created_at,
            is_self_shop: shop.is_self_shop,
            sales: {
              total: parseFloat(shop.current_month_total),
              product: parseFloat(shop.current_month_product),
              device: parseFloat(shop.current_month_device),
              hasOrdered: parseFloat(shop.current_month_total) > 0
            }
          })),
          meta: {
            totalShopsCount: totalShops,
            activeShopsCount: activeShops
          }
        }
      };

      return dashboardData;

    } catch (error) {
      console.error('Dashboard Adapter Error:', error);
      throw error;
    }
  }

  /**
   * 월별 수당 차트 데이터 조회
   */
  static async getMonthlyAllowanceData(kolId: number, months: number = 6) {
    try {
      const query = `
        SELECT 
          TO_CHAR(o.order_date, 'YYYY-MM') as month,
          SUM(o.commission_amount) as commission
        FROM orders o
        WHERE EXISTS (
          SELECT 1 FROM shop_relationships sr
          WHERE sr.shop_owner_id = o.shop_id 
          AND sr.parent_id = $1
          AND sr.is_active = true
        )
        AND o.order_date >= CURRENT_DATE - INTERVAL '${months} months'
        AND o.commission_status != 'cancelled'
        GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')
        ORDER BY month ASC
      `;

      const result = await xanoDb.query(query, [kolId]);

      return result.rows.map(row => ({
        month: row.month,
        commission: parseFloat(row.commission)
      }));

    } catch (error) {
      console.error('Monthly Allowance Data Error:', error);
      throw error;
    }
  }

  /**
   * 활동 내역 조회 (임시 - 실제 구현 필요)
   */
  static async getActivities(kolId: number, limit: number = 10) {
    // TODO: 실제 활동 테이블 구현 후 쿼리 작성
    return [];
  }
}
