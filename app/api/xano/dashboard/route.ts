import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse } from '@/lib/xano-db';

/**
 * GET /api/xano/dashboard - 대시보드 데이터 조회
 * 쿼리 파라미터:
 * - kol_id: KOL ID 필터 (선택사항)
 * - start_date: 시작일 필터 (선택사항)
 * - end_date: 종료일 필터 (선택사항)
 * - period: 기간 필터 (today, week, month, quarter, year)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kolId = searchParams.get('kol_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const period = searchParams.get('period');

    // 기간 설정
    let dateFilter = '';
    let dateParams: any[] = [];

    if (period) {
      switch (period) {
        case 'today':
          dateFilter = `AND DATE(created_at) = CURRENT_DATE`;
          break;
        case 'week':
          dateFilter = `AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
          break;
        case 'month':
          dateFilter = `AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
          break;
        case 'quarter':
          dateFilter = `AND created_at >= DATE_TRUNC('quarter', CURRENT_DATE)`;
          break;
        case 'year':
          dateFilter = `AND created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
          break;
      }
    } else if (startDate && endDate) {
      dateFilter = `AND DATE(created_at) BETWEEN $1 AND $2`;
      dateParams = [startDate, endDate];
    } else if (startDate) {
      dateFilter = `AND DATE(created_at) >= $1`;
      dateParams = [startDate];
    } else if (endDate) {
      dateFilter = `AND DATE(created_at) <= $1`;
      dateParams = [endDate];
    }

    // KOL 필터
    let kolFilter = '';
    let kolParams: any[] = [];
    if (kolId) {
      kolFilter = `AND kol_id = $${dateParams.length + 1}`;
      kolParams = [parseInt(kolId)];
    }

    const allParams = [...dateParams, ...kolParams];

    // 1. 주문 통계
    const orderStatsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN commission_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN commission_status = 'approved' THEN 1 END) as approved_orders,
        COUNT(CASE WHEN commission_status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN is_self_shop_order = true THEN 1 END) as self_shop_orders,
        SUM(total_amount) as total_amount,
        SUM(commission_amount) as total_commission,
        AVG(total_amount) as avg_order_amount,
        AVG(commission_rate) as avg_commission_rate
      FROM orders
      WHERE 1=1 ${dateFilter} ${kolFilter.replace('kol_id', 'created_by')}
    `;

    const orderStatsResult = await xanoDb.query(orderStatsQuery, allParams);

    // 2. 기기 판매 통계
    const deviceStatsQuery = `
      SELECT 
        COUNT(*) as total_device_sales,
        SUM(array_length(serial_numbers, 1)) as total_devices_sold,
        COUNT(CASE WHEN tier = 'tier_1_4' THEN 1 END) as tier_1_4_sales,
        COUNT(CASE WHEN tier = 'tier_5_plus' THEN 1 END) as tier_5_plus_sales,
        SUM(standard_commission) as total_standard_commission,
        SUM(actual_commission) as total_actual_commission,
        AVG(standard_commission) as avg_standard_commission,
        AVG(actual_commission) as avg_actual_commission
      FROM device_sales
      WHERE 1=1 ${dateFilter} ${kolFilter}
    `;

    const deviceStatsResult = await xanoDb.query(deviceStatsQuery, allParams);

    // 3. CRM 통계
    const crmStatsQuery = `
      SELECT 
        COUNT(*) as total_crm_cards,
        COUNT(CASE WHEN stage_1_status = 'completed' THEN 1 END) as stage_1_completed,
        COUNT(CASE WHEN stage_5_status = 'completed' THEN 1 END) as stage_5_completed,
        COUNT(CASE WHEN stage_10_status = 'completed' THEN 1 END) as stage_10_completed,
        COUNT(CASE WHEN installation_training_completed = true THEN 1 END) as training_completed,
        AVG(CASE 
          WHEN stage_10_status = 'completed' THEN 100
          WHEN stage_9_status = 'completed' THEN 90
          WHEN stage_8_status = 'completed' THEN 80
          WHEN stage_7_status = 'completed' THEN 70
          WHEN stage_6_status = 'completed' THEN 60
          WHEN stage_5_status = 'completed' THEN 50
          WHEN stage_4_status = 'completed' THEN 40
          WHEN stage_3_status = 'completed' THEN 30
          WHEN stage_2_status = 'completed' THEN 20
          WHEN stage_1_status = 'completed' THEN 10
          ELSE 0
        END) as avg_crm_progress
      FROM crm_cards
      WHERE 1=1 ${dateFilter} ${kolFilter}
    `;

    const crmStatsResult = await xanoDb.query(crmStatsQuery, allParams);

    // 4. 임상 케이스 통계
    const clinicalStatsQuery = `
      SELECT 
        COUNT(*) as total_clinical_cases,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cases,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_cases,
        COUNT(CASE WHEN consent_status = 'approved' THEN 1 END) as approved_consent,
        COUNT(CASE WHEN subject_type = 'customer' THEN 1 END) as customer_cases,
        COUNT(CASE WHEN subject_type = 'personal' THEN 1 END) as personal_cases,
        COUNT(CASE WHEN subject_type = 'model' THEN 1 END) as model_cases,
        AVG(estimated_duration_weeks) as avg_duration_weeks
      FROM clinical_cases
      WHERE 1=1 ${dateFilter} ${kolFilter}
    `;

    const clinicalStatsResult = await xanoDb.query(clinicalStatsQuery, allParams);

    // 5. 임상 세션 통계
    const sessionStatsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN session_type = 'consultation' THEN 1 END) as consultation_sessions,
        COUNT(CASE WHEN session_type = 'treatment' THEN 1 END) as treatment_sessions,
        COUNT(CASE WHEN session_type = 'followup' THEN 1 END) as followup_sessions,
        COUNT(CASE WHEN session_type = 'final' THEN 1 END) as final_sessions,
        AVG(duration_minutes) as avg_session_duration,
        AVG(pain_level) as avg_pain_level,
        AVG(satisfaction_score) as avg_satisfaction_score,
        SUM(array_length(before_photos, 1)) as total_before_photos,
        SUM(array_length(after_photos, 1)) as total_after_photos
      FROM clinical_sessions cs
      JOIN clinical_cases cc ON cs.case_id = cc.id
      WHERE 1=1 ${dateFilter.replace('created_at', 'cs.created_at')} ${kolFilter.replace('kol_id', 'cc.kol_id')}
    `;

    const sessionStatsResult = await xanoDb.query(sessionStatsQuery, allParams);

    // 6. 성장 카드 통계
    const growthStatsQuery = `
      SELECT 
        COUNT(*) as total_growth_cards,
        COUNT(CASE WHEN hq_training_status = 'completed' THEN 1 END) as hq_training_completed,
        COUNT(CASE WHEN hq_training_status = 'in_progress' THEN 1 END) as hq_training_in_progress,
        COUNT(CASE WHEN hq_training_status = 'not_started' THEN 1 END) as hq_training_not_started,
        AVG(self_assessment_score) as avg_self_assessment,
        AVG(current_month_achievement) as avg_month_achievement,
        AVG(current_quarter_achievement) as avg_quarter_achievement,
        AVG(current_year_achievement) as avg_year_achievement,
        SUM(monthly_goal) as total_monthly_goals,
        SUM(quarterly_goal) as total_quarterly_goals,
        SUM(yearly_goal) as total_yearly_goals
      FROM self_growth_cards
      WHERE 1=1 ${dateFilter}
    `;

    const growthStatsResult = await xanoDb.query(growthStatsQuery, dateParams);

    // 7. 최근 활동 (Recent Activities)
    const recentActivitiesQuery = `
      SELECT 
        'order' as activity_type,
        o.id as activity_id,
        o.total_amount as activity_value,
        o.commission_status as activity_status,
        o.created_at as activity_date,
        'shop_' || o.shop_id as activity_subject
      FROM orders o
      WHERE 1=1 ${dateFilter} ${kolFilter.replace('kol_id', 'created_by')}
      
      UNION ALL
      
      SELECT 
        'device_sale' as activity_type,
        ds.id as activity_id,
        ds.actual_commission as activity_value,
        ds.tier as activity_status,
        ds.created_at as activity_date,
        'kol_' || ds.kol_id as activity_subject
      FROM device_sales ds
      WHERE 1=1 ${dateFilter} ${kolFilter}
      
      UNION ALL
      
      SELECT 
        'clinical_case' as activity_type,
        cc.id as activity_id,
        cc.estimated_duration_weeks as activity_value,
        cc.status as activity_status,
        cc.created_at as activity_date,
        cc.subject_name as activity_subject
      FROM clinical_cases cc
      WHERE 1=1 ${dateFilter} ${kolFilter}
      
      ORDER BY activity_date DESC
      LIMIT 20
    `;

    const recentActivitiesResult = await xanoDb.query(recentActivitiesQuery, [...allParams, ...allParams, ...allParams]);

    // 8. 월별 트렌드 (지난 12개월)
    const monthlyTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', month_date) as month,
        COALESCE(order_count, 0) as orders,
        COALESCE(device_count, 0) as devices,
        COALESCE(clinical_count, 0) as clinical_cases,
        COALESCE(total_commission, 0) as commission
      FROM (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) as month_date
      ) months
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(CASE WHEN 'order' = 'order' THEN 1 END) as order_count,
          COUNT(CASE WHEN 'device' = 'device' THEN 1 END) as device_count,
          COUNT(CASE WHEN 'clinical' = 'clinical' THEN 1 END) as clinical_count,
          SUM(CASE WHEN 'commission' = 'commission' THEN commission_amount ELSE 0 END) as total_commission
        FROM orders
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        ${kolFilter.replace('kol_id', 'created_by')}
        GROUP BY DATE_TRUNC('month', created_at)
      ) order_stats ON months.month_date = order_stats.month
      ORDER BY month
    `;

    const monthlyTrendsResult = await xanoDb.query(monthlyTrendsQuery, kolParams);

    // 결과 조합
    const dashboardData = {
      summary: {
        orders: orderStatsResult.rows[0],
        devices: deviceStatsResult.rows[0],
        crm: crmStatsResult.rows[0],
        clinical: clinicalStatsResult.rows[0],
        sessions: sessionStatsResult.rows[0],
        growth: growthStatsResult.rows[0]
      },
      recent_activities: recentActivitiesResult.rows,
      monthly_trends: monthlyTrendsResult.rows,
      kpis: {
        total_revenue: parseFloat(orderStatsResult.rows[0].total_amount || 0),
        total_commission: parseFloat(orderStatsResult.rows[0].total_commission || 0),
        total_devices_sold: parseInt(deviceStatsResult.rows[0].total_devices_sold || 0),
        avg_crm_progress: parseFloat(crmStatsResult.rows[0].avg_crm_progress || 0),
        clinical_completion_rate: clinicalStatsResult.rows[0].completed_cases > 0 
          ? (clinicalStatsResult.rows[0].completed_cases / clinicalStatsResult.rows[0].total_clinical_cases * 100).toFixed(1)
          : '0.0',
        avg_satisfaction_score: parseFloat(sessionStatsResult.rows[0].avg_satisfaction_score || 0)
      }
    };

    return NextResponse.json(
      ApiResponse.success(dashboardData, '대시보드 데이터 조회 성공')
    );

  } catch (error) {
    console.error('대시보드 데이터 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('대시보드 데이터 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * GET /api/xano/dashboard/kpis - 주요 KPI 지표만 조회
 */
export async function GET_KPIS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kolId = searchParams.get('kol_id');
    const period = searchParams.get('period') || 'month';

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = `AND DATE(created_at) = CURRENT_DATE`;
        break;
      case 'week':
        dateFilter = `AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
        break;
      case 'month':
        dateFilter = `AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      case 'quarter':
        dateFilter = `AND created_at >= DATE_TRUNC('quarter', CURRENT_DATE)`;
        break;
      case 'year':
        dateFilter = `AND created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
        break;
    }

    const kolFilter = kolId ? `AND kol_id = ${parseInt(kolId)}` : '';

    // 핵심 KPI 쿼리
    const kpiQuery = `
      SELECT 
        -- 매출 관련
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE 1=1 ${dateFilter} ${kolFilter.replace('kol_id', 'created_by')}) as total_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM orders WHERE 1=1 ${dateFilter} ${kolFilter.replace('kol_id', 'created_by')}) as total_commission,
        (SELECT COALESCE(COUNT(*), 0) FROM orders WHERE 1=1 ${dateFilter} ${kolFilter.replace('kol_id', 'created_by')}) as total_orders,
        
        -- 기기 판매 관련
        (SELECT COALESCE(SUM(array_length(serial_numbers, 1)), 0) FROM device_sales WHERE 1=1 ${dateFilter} ${kolFilter}) as devices_sold,
        (SELECT COALESCE(SUM(actual_commission), 0) FROM device_sales WHERE 1=1 ${dateFilter} ${kolFilter}) as device_commission,
        (SELECT COALESCE(COUNT(*), 0) FROM device_sales WHERE tier = 'tier_5_plus' ${dateFilter} ${kolFilter}) as premium_tier_sales,
        
        -- CRM 관련
        (SELECT COALESCE(COUNT(*), 0) FROM crm_cards WHERE 1=1 ${dateFilter} ${kolFilter}) as active_crm_cards,
        (SELECT COALESCE(COUNT(*), 0) FROM crm_cards WHERE stage_10_status = 'completed' ${dateFilter} ${kolFilter}) as completed_crm_cards,
        (SELECT COALESCE(COUNT(*), 0) FROM crm_cards WHERE installation_training_completed = true ${dateFilter} ${kolFilter}) as training_completed,
        
        -- 임상 관련
        (SELECT COALESCE(COUNT(*), 0) FROM clinical_cases WHERE 1=1 ${dateFilter} ${kolFilter}) as clinical_cases,
        (SELECT COALESCE(COUNT(*), 0) FROM clinical_cases WHERE status = 'completed' ${dateFilter} ${kolFilter}) as completed_clinical_cases,
        (SELECT COALESCE(AVG(satisfaction_score), 0) FROM clinical_sessions cs JOIN clinical_cases cc ON cs.case_id = cc.id WHERE 1=1 ${dateFilter.replace('created_at', 'cs.created_at')} ${kolFilter.replace('kol_id', 'cc.kol_id')}) as avg_satisfaction
    `;

    const kpiResult = await xanoDb.query(kpiQuery);
    const kpis = kpiResult.rows[0];

    // 계산된 KPI
    const calculatedKpis = {
      ...kpis,
      avg_order_value: kpis.total_orders > 0 ? (kpis.total_revenue / kpis.total_orders).toFixed(2) : '0.00',
      commission_rate: kpis.total_revenue > 0 ? ((kpis.total_commission / kpis.total_revenue) * 100).toFixed(1) : '0.0',
      crm_completion_rate: kpis.active_crm_cards > 0 ? ((kpis.completed_crm_cards / kpis.active_crm_cards) * 100).toFixed(1) : '0.0',
      clinical_completion_rate: kpis.clinical_cases > 0 ? ((kpis.completed_clinical_cases / kpis.clinical_cases) * 100).toFixed(1) : '0.0',
      training_completion_rate: kpis.active_crm_cards > 0 ? ((kpis.training_completed / kpis.active_crm_cards) * 100).toFixed(1) : '0.0'
    };

    return NextResponse.json(
      ApiResponse.success(calculatedKpis, 'KPI 데이터 조회 성공')
    );

  } catch (error) {
    console.error('KPI 데이터 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('KPI 데이터 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 