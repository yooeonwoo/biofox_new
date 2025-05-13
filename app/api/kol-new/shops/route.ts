import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

// 매출 데이터 타입 정의
interface MonthlySales {
  shop_id: number;
  total_sales: number;
  product_sales: number;
  device_sales: number;
  commission: number;
}

// KOL 전문점 목록 API 라우트
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

    console.log(`전문점 API 요청: Clerk ID=${userId}`);

    // 현재 월 계산 (YYYY-MM 형식)
    const currentDate = getCurrentDate();
    const currentMonth = currentDate.substring(0, 7);

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error(`사용자 정보 조회 오류(clerk_id=${userId}):`, userError);
      
      // 이메일로 사용자 검색 시도 (대비책)
      const { data: userByEmail, error: emailError } = await supabase
        .rpc('find_user_by_clerk_metadata', { clerk_user_id: userId });
        
      if (emailError || !userByEmail) {
        console.error('이메일로 사용자 검색 실패:', emailError);
        return NextResponse.json(
          { error: '사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
          { status: 404 }
        );
      }
      
      // 이메일로 찾은 경우 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ clerk_id: userId })
        .eq('id', userByEmail.id);
        
      if (updateError) {
        console.error('사용자 정보 업데이트 실패:', updateError);
      } else {
        console.log(`사용자 정보 업데이트 성공: ID=${userByEmail.id}, Clerk ID=${userId}`);
      }
      
      // 업데이트된 사용자 정보 사용
      userData = userByEmail;
    }

    if (!userData) {
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

    let { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id, name')
      .eq('user_id', userData.id)
      .single();

    if (kolError) {
      console.error(`KOL 정보 조회 오류(user_id=${userData.id}):`, kolError);
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
        { status: 404 }
      );
    }

    if (!kolData) {
      console.error(`KOL 정보 없음(user_id=${userData.id})`);
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
        { status: 404 }
      );
    }

    console.log(`KOL 조회 성공: ID=${kolData.id}, Name=${kolData.name}`);

    // KOL 소속 전문점 정보 조회
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, owner_name, shop_name, region, status, created_at, is_owner_kol')
      .eq('kol_id', kolData.id)
      .order('created_at', { ascending: false });

    if (shopsError) {
      console.error(`전문점 정보 조회 오류(kol_id=${kolData.id}):`, shopsError);
      return NextResponse.json(
        { error: '전문점 정보를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!shops || shops.length === 0) {
      console.log(`전문점 데이터 없음(kol_id=${kolData.id})`);
      return NextResponse.json([]);
    }

    // 전문점별 월간 매출 데이터 조회 (새로운 테이블 사용)
    const { data: salesData, error: salesError } = await supabase
      .from('shop_sales_metrics')
      .select('shop_id, total_sales, product_sales, device_sales, commission')
      .eq('year_month', currentMonth);

    if (salesError) {
      console.error(`매출 데이터 조회 오류(kol_id=${kolData.id}, month=${currentMonth}):`, salesError);
      return NextResponse.json(
        { error: '매출 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 매출 데이터를 맵으로 변환하여 조회 효율성 높이기
    const salesByShop: Record<number, any> = {};
    if (salesData && salesData.length > 0) {
      salesData.forEach((sale: any) => {
        salesByShop[sale.shop_id] = sale;
      });
    }

    // 전문점 데이터와 매출 데이터 조합
    const shopsWithSales = shops.map(shop => {
      // shops 테이블에 is_owner_kol 필드가 있으면 사용, 없으면 이름 비교로 판단
      const is_owner_kol = shop.is_owner_kol !== undefined && shop.is_owner_kol !== null 
        ? shop.is_owner_kol 
        : (shop.owner_name === kolData.name);
      
      return {
        id: shop.id,
        ownerName: shop.owner_name,
        shop_name: shop.shop_name || shop.owner_name, // shop_name이 없는 경우 owner_name을 사용
        region: shop.region || '',
        status: shop.status,
        createdAt: shop.created_at,
        is_owner_kol, // 직영점 여부 추가
        sales: {
          total: salesByShop[shop.id]?.total_sales || 0,
          product: salesByShop[shop.id]?.product_sales || 0,
          device: salesByShop[shop.id]?.device_sales || 0,
          commission: salesByShop[shop.id]?.commission || 0,
          hasOrdered: Boolean(salesByShop[shop.id] && salesByShop[shop.id].total_sales > 0)
        }
      };
    });

    // 매출 기준 내림차순 정렬
    const sortedShops = shopsWithSales.sort((a, b) => b.sales.total - a.sales.total);

    console.log(`전문점 데이터 조회 완료: KOL ID=${kolData.id}, 전문점 수=${sortedShops.length}`);
    return NextResponse.json(sortedShops);
  } catch (error) {
    console.error('KOL 전문점 목록 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 