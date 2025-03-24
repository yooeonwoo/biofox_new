/**
 * 전문점 순위 API
 * 
 * 전문점 순위 데이터 조회
 * 
 * GET /api/sales/shop-ranking
 * 쿼리 파라미터:
 * - kolId: KOL ID (필수)
 * - sortBy: 정렬 기준 (current: 당월매출, average: 월평균매출, cumulative: 누적매출, 기본값: current)
 * - yearMonth: 조회할 연월 (YYYY-MM 형식, 미지정 시 현재 월 기준)
 * - limit: 조회할 전문점 수 (기본값: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentYearMonth } from '@/lib/sales-utils';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// 타임아웃 설정을 30초로 늘림
export const maxDuration = 30; // 30초 타임아웃 설정

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("전문점 순위 API 호출됨");
    
    // 사용자 정보 및 역할 확인 - 직접 쿼리로 변경
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .limit(1);
    
    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 조회하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
    
    if (!userData || userData.length === 0) {
      console.error("사용자 조회 실패:", "사용자를 찾을 수 없음");
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    const user = userData[0];
    const role = user?.role || '';
    
    const searchParams = request.nextUrl.searchParams;
    const kolId = searchParams.get('kolId');
    const sortBy = searchParams.get('sortBy') || 'current';
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let effectiveKolId = kolId;
    
    if (role !== '본사관리자') {
      if (role === 'kol') {
        // 사용자의 KOL ID 조회
        const { data: kolData } = await supabase
          .from('kols')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        const userKolId = kolData?.id;
        
        if (kolId && parseInt(kolId) !== userKolId) {
          console.error(`권한 없는 KOL 데이터 접근 시도: 요청 KOL ID ${kolId}, 사용자 KOL ID ${userKolId}`);
          return NextResponse.json(
            { success: false, error: '접근 권한이 없습니다.' },
            { status: 403 }
          );
        }
        
        if (!kolId && userKolId) {
          effectiveKolId = userKolId.toString();
        }
      } else {
        return NextResponse.json(
          { success: false, error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }
    
    if (!effectiveKolId) {
      return NextResponse.json(
        { success: false, error: 'KOL ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`전문점 순위 조회 시작: KOL ID ${effectiveKolId}, 정렬 기준 ${sortBy}`);
    
    let results = [];
    
    if (sortBy === 'current') {
      // 당월 매출 기준 순위 조회 - Supabase 사용
      const { data, error } = await supabase.rpc('get_shop_ranking_current', {
        p_kol_id: parseInt(effectiveKolId),
        p_year_month: yearMonth,
        p_limit: limit
      });
      
      if (error) {
        console.error('당월 매출 기준 순위 조회 오류:', error);
        
        // 대체 쿼리 사용 (supabase 함수가 없을 경우)
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select(`
            id, 
            owner_name, 
            region, 
            monthly_sales!inner(total_sales, commission)
          `)
          .eq('kol_id', parseInt(effectiveKolId))
          .eq('monthly_sales.year_month', yearMonth)
          .order('monthly_sales.total_sales', { ascending: false })
          .limit(limit);
        
        if (shopError) {
          console.error('대체 쿼리 오류:', shopError);
          return NextResponse.json(
            { success: false, error: '전문점 순위를 조회하는 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
        
        results = (shopData || []).map(item => ({
          id: item.id,
          name: item.owner_name,
          region: item.region,
          totalSales: item.monthly_sales?.total_sales ?? 0,
          commission: item.monthly_sales?.commission ?? 0
        }));
      } else {
        results = (data || []).map(item => ({
          id: item.shop_id,
          name: item.shop_name,
          region: item.region,
          totalSales: item.total_sales,
          commission: item.commission
        }));
      }
    } else if (sortBy === 'average') {
      // 월평균 매출 기준 순위 조회 - Supabase 사용
      const { data, error } = await supabase.rpc('get_shop_ranking_average', {
        p_kol_id: parseInt(effectiveKolId),
        p_limit: limit
      });
      
      if (error) {
        console.error('월평균 매출 기준 순위 조회 오류:', error);
        
        // SQL 직접 실행 (대체 쿼리)
        const { data: avgData, error: avgError } = await supabase.rpc('execute_sql', {
          sql_query: `
            SELECT 
              s.id, 
              s.owner_name as name, 
              s.region, 
              AVG(ms.total_sales) as total_sales, 
              AVG(ms.commission) as commission
            FROM shops s
            JOIN monthly_sales ms ON s.id = ms.shop_id
            WHERE s.kol_id = ${parseInt(effectiveKolId)}
            GROUP BY s.id, s.owner_name, s.region
            ORDER BY total_sales DESC
            LIMIT ${limit}
          `
        });
        
        if (avgError) {
          console.error('SQL 직접 실행 오류:', avgError);
          return NextResponse.json(
            { success: false, error: '전문점 순위를 조회하는 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
        
        results = avgData || [];
      } else {
        results = (data || []).map(item => ({
          id: item.shop_id,
          name: item.shop_name,
          region: item.region,
          totalSales: item.avg_sales,
          commission: item.avg_commission
        }));
      }
    } else {
      // 누적 매출 기준 순위 조회 - Supabase 사용
      const { data, error } = await supabase.rpc('get_shop_ranking_cumulative', {
        p_kol_id: parseInt(effectiveKolId),
        p_limit: limit
      });
      
      if (error) {
        console.error('누적 매출 기준 순위 조회 오류:', error);
        
        // SQL 직접 실행 (대체 쿼리)
        const { data: sumData, error: sumError } = await supabase.rpc('execute_sql', {
          sql_query: `
            SELECT 
              s.id, 
              s.owner_name as name, 
              s.region, 
              SUM(ms.total_sales) as total_sales, 
              SUM(ms.commission) as commission
            FROM shops s
            JOIN monthly_sales ms ON s.id = ms.shop_id
            WHERE s.kol_id = ${parseInt(effectiveKolId)}
            GROUP BY s.id, s.owner_name, s.region
            ORDER BY total_sales DESC
            LIMIT ${limit}
          `
        });
        
        if (sumError) {
          console.error('SQL 직접 실행 오류:', sumError);
          return NextResponse.json(
            { success: false, error: '전문점 순위를 조회하는 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
        
        results = sumData || [];
      }
    }
    
    // 숫자 값이 null인 경우 0으로 처리
    const formattedResults = results.map(item => ({
      id: item.id,
      name: item.name,
      region: item.region,
      totalSales: item.totalSales ?? 0,
      commission: item.commission ?? 0
    }));
    
    console.log(`전문점 순위 조회 완료: ${formattedResults.length}개 항목`);
    
    return NextResponse.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('전문점 순위 조회 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문점 순위를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 