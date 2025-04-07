import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDate } from '@/lib/date-utils';

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

    // 현재 월 계산 (YYYY-MM 형식)
    const currentDate = getCurrentDate();
    const currentMonth = currentDate.substring(0, 7);

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // KOL 소속 전문점 정보 조회
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, owner_name, region, status, created_at')
      .eq('kol_id', kolData.id)
      .order('created_at', { ascending: false });

    if (shopsError) {
      return NextResponse.json(
        { error: '전문점 정보를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 전문점별 월간 매출 데이터 조회
    const { data: salesData, error: salesError } = await supabase
      .from('monthly_sales')
      .select('shop_id, total_sales, product_sales, device_sales')
      .eq('kol_id', kolData.id)
      .eq('year_month', currentMonth);

    if (salesError) {
      return NextResponse.json(
        { error: '매출 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 매출 데이터를 맵으로 변환하여 조회 효율성 높이기
    const salesByShop = salesData.reduce((acc, curr) => {
      acc[curr.shop_id] = curr;
      return acc;
    }, {});

    // 전문점 데이터와 매출 데이터 조합
    const shopsWithSales = shops.map(shop => ({
      id: shop.id,
      ownerName: shop.owner_name,
      region: shop.region || '',
      status: shop.status,
      createdAt: shop.created_at,
      sales: {
        total: salesByShop[shop.id]?.total_sales || 0,
        product: salesByShop[shop.id]?.product_sales || 0,
        device: salesByShop[shop.id]?.device_sales || 0,
        hasOrdered: Boolean(salesByShop[shop.id] && salesByShop[shop.id].total_sales > 0)
      }
    }));

    // 매출 기준 내림차순 정렬
    const sortedShops = shopsWithSales.sort((a, b) => b.sales.total - a.sales.total);

    return NextResponse.json(sortedShops);
  } catch (error) {
    console.error('KOL 전문점 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 