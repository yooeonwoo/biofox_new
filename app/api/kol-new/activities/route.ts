import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 전문점 정보 타입 정의
interface ShopInfo {
  id: number;
  owner_name: string;
}

// 영업 활동 타입 정의
interface SalesActivity {
  id: number;
  shop_id: number | null;
  activity_date: string;
  content: string;
  created_at: string;
}

// KOL 영업 일지 API 라우트
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

    // 영업 일지 데이터 조회 (최근 활동부터 정렬)
    const { data: activities, error: activitiesError } = await supabase
      .from('sales_activities')
      .select(`
        id,
        shop_id,
        activity_date,
        content,
        created_at
      `)
      .eq('kol_id', kolData.id)
      .order('activity_date', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error('영업 일지 조회 에러:', activitiesError);
      return NextResponse.json(
        { error: '영업 일지 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const salesActivities = activities as SalesActivity[];

    // 영업 일지에 있는 모든 전문점 ID 수집
    const shopIds = salesActivities
      .filter(activity => activity.shop_id !== null)
      .map(activity => activity.shop_id as number);

    // 중복 제거
    const uniqueShopIds = [...new Set(shopIds)];

    // 전문점 정보가 있으면 전문점 데이터 조회
    const shopsData: Record<number, ShopInfo> = {};
    
    if (uniqueShopIds.length > 0) {
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, owner_name')
        .in('id', uniqueShopIds);

      if (shopsError) {
        console.error('전문점 조회 에러:', shopsError);
      } else if (shops) {
        // 전문점 데이터를 ID로 쉽게 조회할 수 있도록 객체로 변환
        shops.forEach((shop: ShopInfo) => {
          shopsData[shop.id] = shop;
        });
      }
    }

    // 영업 일지와 전문점 데이터 결합
    const activitiesWithShopInfo = salesActivities.map(activity => {
      const shopInfo = activity.shop_id !== null ? shopsData[activity.shop_id] : null;
      
      return {
        ...activity,
        shop_name: shopInfo ? shopInfo.owner_name : null
      };
    });

    return NextResponse.json(activitiesWithShopInfo);
  } catch (error) {
    console.error('KOL 영업 일지 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 