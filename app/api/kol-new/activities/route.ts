import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 전문점 정보 타입 정의
interface ShopInfo {
  id: number;
  owner_name: string;
  shop_name?: string;
}

// 영업 활동 타입 정의
interface SalesActivity {
  id: number;
  shop_id: number | null;
  activity_date: string;
  content: string;
  created_at: string;
}

// 영업 일지 생성 요청 타입 정의
interface CreateActivityRequest {
  shop_id: number | null;
  activity_date: string;
  content: string;
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
      console.error('사용자 정보 조회 오류:', userError);
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
      console.error('KOL 정보 조회 오류:', kolError);
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
      .order('activity_date', { ascending: false });

    if (activitiesError) {
      console.error('영업 일지 조회 에러:', activitiesError);
      return NextResponse.json(
        { error: '영업 일지 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 활동 데이터가 없는 경우 빈 배열 반환
    if (!activities || activities.length === 0) {
      return NextResponse.json([]);
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
        .select('id, owner_name, shop_name')
        .in('id', uniqueShopIds);

      if (shopsError) {
        console.error('전문점 조회 에러:', shopsError);
        // 전문점 조회 중 오류가 발생해도 활동 데이터는 반환
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
        shop_name: shopInfo ? (shopInfo.shop_name || shopInfo.owner_name) : null
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

// 영업 일지 생성 API 라우트
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body: CreateActivityRequest = await request.json();
    
    // 필수 필드 검증
    if (!body.activity_date || !body.content) {
      return NextResponse.json(
        { error: '날짜와 내용은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (body.content.trim().length < 5) {
      return NextResponse.json(
        { error: '내용은 최소 5자 이상 입력해야 합니다.' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.activity_date)) {
      return NextResponse.json(
        { error: '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.' },
        { status: 400 }
      );
    }

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('사용자 정보 조회 오류:', userError);
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
      console.error('KOL 정보 조회 오류:', kolError);
      return NextResponse.json(
        { error: 'KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 전문점 ID가 유효한지 확인 (선택 사항인 경우 스킵)
    if (body.shop_id !== null) {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('id', body.shop_id)
        .eq('kol_id', kolData.id)  // 본인의 전문점만 선택 가능
        .single();

      if (shopError || !shopData) {
        console.error('전문점 정보 조회 오류:', shopError);
        return NextResponse.json(
          { error: '유효하지 않은 전문점입니다. 본인이 관리하는 전문점만 선택할 수 있습니다.' },
          { status: 400 }
        );
      }
    }

    // 영업 일지 생성
    const { data: newActivity, error: createError } = await supabase
      .from('sales_activities')
      .insert({
        kol_id: kolData.id,
        shop_id: body.shop_id,
        activity_date: body.activity_date,
        content: body.content
      })
      .select()
      .single();

    if (createError) {
      console.error('영업 일지 생성 에러:', createError);
      return NextResponse.json(
        { error: '영업 일지 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 전문점 정보 조회 (생성된 활동이 전문점과 연결된 경우)
    let shopName = null;
    if (newActivity.shop_id) {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_name, shop_name')
        .eq('id', newActivity.shop_id)
        .single();

      if (!shopError && shopData) {
        shopName = shopData.shop_name || shopData.owner_name;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '영업 일지가 성공적으로 등록되었습니다.',
      data: {
        ...newActivity,
        shop_name: shopName
      }
    });
  } catch (error) {
    console.error('영업 일지 생성 에러:', error);
    return NextResponse.json(
      { error: '영업 일지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 