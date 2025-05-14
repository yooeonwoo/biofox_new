import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate, getPreviousMonth } from '@/lib/date-utils';

// KOL 대시보드 API 라우트 
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    console.log(`대시보드 API 요청: Clerk ID=${userId}`);

    // 현재 월과 이전 월 계산 (YYYY-MM 형식)
    const currentDate = getCurrentDate();
    // 데이터 형식을 'YYYYMM'으로 변환 (하이픈 제거)
    const currentMonth = currentDate.substring(0, 7).replace('-', '');
    const previousMonth = getPreviousMonth(currentDate).replace('-', '');

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error(`사용자 정보 조회 오류(clerk_id=${userId}):`, userError);
      
      // 이메일로 사용자 검색 시도 (대비책)
      try {
        const { data: userByEmail, error: emailError } = await supabase
          .rpc('find_user_by_clerk_metadata', { clerk_user_id: userId });
        
        if (emailError) {
          console.error('보조 사용자 검색 실패:', emailError);
          
          // 최신 pending 사용자 직접 검색 전 에러 처리
          throw new Error('보조 검색 오류: ' + emailError.message);
        }
        
        if (!userByEmail || typeof userByEmail.id === 'undefined') {
          console.error('보조 사용자 검색 결과 없음');
          
          // 최후의 수단: 최신 pending 사용자 직접 검색
          const { data: pendingUsers, error: pendingError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .like('clerk_id', 'pending_%')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (pendingError || !pendingUsers || pendingUsers.length === 0) {
            console.error('Pending 사용자 검색 실패:', pendingError || '결과 없음');
            return NextResponse.json(
              { error: '시스템에 등록된 사용자를 찾을 수 없습니다. 관리자에게 문의하세요.', details: '모든 검색 방법 실패' },
              { status: 404 }
            );
          }
          
          userData = pendingUsers[0];
          console.log(`최신 Pending 사용자 발견: ID=${userData.id}, Email=${userData.email}`);
        } else {
          userData = userByEmail;
          if (userData) {
            console.log(`보조 검색으로 사용자 발견: ID=${userData.id}, Email=${userData.email}`);
          }
        }
        
        // 발견한 경우 사용자 정보 업데이트
        if (userData && typeof userData.id !== 'undefined') {
          const { error: updateError } = await supabase
            .from('users')
            .update({ clerk_id: userId })
            .eq('id', userData.id);
            
          if (updateError) {
            console.error(`사용자 정보 업데이트 실패(ID=${userData.id}):`, updateError);
          } else {
            console.log(`사용자 정보 업데이트 성공: ID=${userData.id}, Clerk ID=${userId}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json(
          { error: '사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.', details: errorMessage },
          { status: 404 }
        );
      }
    }

    if (!userData || typeof userData.id === 'undefined') {
      console.error(`사용자 정보 없음(clerk_id=${userId})`);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
        { status: 404 }
      );
    }

    // 사용자 역할 확인
    if (userData.role !== 'kol') {
      console.error(`비KOL 사용자 접근(userId=${userData.id}, role=${userData.role})`);
      return NextResponse.json(
        { error: 'KOL 역할이 아닙니다.' },
        { status: 403 }
      );
    }

    console.log(`사용자 조회 성공: ID=${userData.id}, Email=${userData.email}`);

    let { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id, name, shop_name')
      .eq('user_id', userData.id)
      .single();

    if (kolError) {
      console.error(`KOL 정보 조회 오류(user_id=${userData.id}):`, kolError);
      
      // KOL 정보가 없으면 자동 생성 시도
      const { data: newKolData, error: createKolError } = await supabase
        .from('kols')
        .insert({
          user_id: userData.id,
          name: userData.name || userData.email.split('@')[0],
          shop_name: `${userData.name || userData.email.split('@')[0]}의 매장`,
          status: 'active'
        })
        .select()
        .single();
        
      if (createKolError) {
        console.error(`KOL 정보 자동 생성 실패(user_id=${userData.id}):`, createKolError);
        return NextResponse.json(
          { error: 'KOL 정보를 찾을 수 없고 자동 생성에 실패했습니다. 관리자에게 문의하세요.', details: createKolError.message },
          { status: 404 }
        );
      }
      
      console.log(`KOL 정보 자동 생성 성공: ID=${newKolData.id}, Name=${newKolData.name}`);
      kolData = newKolData;
    }

    if (!kolData) {
      console.error(`KOL 정보 없음(user_id=${userData.id})`);
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
        { status: 404 }
      );
    }

    console.log(`KOL 조회 성공: ID=${kolData.id}, Name=${kolData.name}`);

    // KOL 월별 요약 정보 조회 (kol_dashboard_metrics 테이블만 사용)
    const { data: dashboardMetrics, error: dashboardError } = await supabase
      .from('kol_dashboard_metrics')
      .select('*')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth)
      .maybeSingle();

    if (dashboardError) {
      console.error(`대시보드 메트릭 조회 오류(kol_id=${kolData.id}, month=${currentMonth}):`, dashboardError);
      // 오류가 있어도 계속 진행 (기본값 사용)
    }

    // 현재 월 데이터가 없으면 새로 생성
    if (!dashboardMetrics) {
      console.log(`대시보드 메트릭 데이터 없음, 새로 생성 시도 (kol_id=${kolData.id}, month=${currentMonth})`);
      
      // 전문점 수 조회
      const { data: shopsCount, error: shopsError, count } = await supabase
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('kol_id', kolData.id);
        
      const totalShops = shopsError ? 0 : count || 0;
      
      // 새 메트릭 데이터 생성
      const newMetricsData = {
        kol_id: kolData.id,
        year_month: currentMonth,
        monthly_sales: 0,
        monthly_commission: 0,
        active_shops_count: 0,
        total_shops_count: totalShops,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data: newMetrics, error: insertError } = await supabase
        .from('kol_dashboard_metrics')
        .insert(newMetricsData)
        .select()
        .single();
        
      if (insertError) {
        console.error(`대시보드 메트릭 생성 실패(kol_id=${kolData.id}, month=${currentMonth}):`, insertError);
      } else {
        console.log(`대시보드 메트릭 생성 성공(kol_id=${kolData.id}, month=${currentMonth})`);
      }
    }

    // 이전 월 데이터 조회
    const { data: previousMonthData, error: previousMonthError } = await supabase
      .from('kol_dashboard_metrics')
      .select('monthly_sales, monthly_commission')
      .eq('kol_id', kolData.id)
      .eq('year_month', previousMonth)
      .maybeSingle();

    if (previousMonthError) {
      console.log(`이전 월 데이터 조회 오류(kol_id=${kolData.id}, month=${previousMonth}):`, previousMonthError);
      // 오류가 있어도 계속 진행 (기본값 사용)
    }

    // 이전 월 데이터가 없으면 새로 생성
    if (!previousMonthData) {
      console.log(`이전 월 데이터 없음, 새로 생성 시도 (kol_id=${kolData.id}, month=${previousMonth})`);
      
      // 새 메트릭 데이터 생성
      const newPrevMetricsData = {
        kol_id: kolData.id,
        year_month: previousMonth,
        monthly_sales: 0,
        monthly_commission: 0,
        active_shops_count: 0,
        total_shops_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { error: insertPrevError } = await supabase
        .from('kol_dashboard_metrics')
        .insert(newPrevMetricsData);
        
      if (insertPrevError) {
        console.error(`이전 월 메트릭 생성 실패(kol_id=${kolData.id}, month=${previousMonth}):`, insertPrevError);
      } else {
        console.log(`이전 월 메트릭 생성 성공(kol_id=${kolData.id}, month=${previousMonth})`);
      }
    }

    // 기본값 설정
    const monthlySales = dashboardMetrics?.monthly_sales || 0;
    const monthlyCommission = dashboardMetrics?.monthly_commission || 0;
    const previousMonthSales = previousMonthData?.monthly_sales || 0;
    const previousMonthCommission = previousMonthData?.monthly_commission || 0;
    const totalShops = dashboardMetrics?.total_shops_count || 0;
    const activeOrderingShops = dashboardMetrics?.active_shops_count || 0;
    const notOrderingShops = totalShops - activeOrderingShops;

    // 대시보드 데이터 구성
    const dashboardData = {
      kol: {
        id: kolData.id,
        name: kolData.name,
        shopName: kolData.shop_name
      },
      sales: {
        currentMonth: monthlySales,
        previousMonth: previousMonthSales,
        growth: monthlySales - previousMonthSales
      },
      allowance: {
        currentMonth: monthlyCommission,
        previousMonth: previousMonthCommission,
        growth: monthlyCommission - previousMonthCommission
      },
      shops: {
        total: totalShops,
        ordering: activeOrderingShops,
        notOrdering: notOrderingShops
      }
    };
    
    console.log(`대시보드 데이터 생성 완료: KOL ID=${kolData.id}`);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('KOL 대시보드 데이터 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 