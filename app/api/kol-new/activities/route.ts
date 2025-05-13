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

    console.log(`영업 일지 API 요청: Clerk ID=${userId}`);

    // KOL ID 조회 - 로그인한 사용자의 KOL ID 가져오기
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
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
      .select('id')
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

    console.log(`KOL 조회 성공: ID=${kolData.id}`);

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
      console.error(`영업 일지 조회 오류(kol_id=${kolData.id}):`, activitiesError);
      return NextResponse.json(
        { error: '영업 일지 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 활동 데이터가 없는 경우 빈 배열 반환
    if (!activities || activities.length === 0) {
      console.log(`영업 일지 없음(kol_id=${kolData.id})`);
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
        console.error(`연관 전문점 조회 오류(kol_id=${kolData.id}):`, shopsError);
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

    console.log(`영업 일지 조회 완료: KOL ID=${kolData.id}, 활동 수=${activitiesWithShopInfo.length}`);
    return NextResponse.json(activitiesWithShopInfo);
  } catch (error) {
    console.error('KOL 영업 일지 조회 에러:', error);
    const errorMessage = error instanceof Error 
      ? `데이터 조회 중 오류가 발생했습니다: ${error.message}` 
      : '데이터 조회 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
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

    console.log(`영업 일지 생성 요청: Clerk ID=${userId}`);

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
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
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
      .select('id')
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

    // 전문점 ID가 유효한지 확인 (선택 사항인 경우 스킵)
    if (body.shop_id !== null) {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('id', body.shop_id)
        .eq('kol_id', kolData.id)  // 본인의 전문점만 선택 가능
        .single();

      if (shopError || !shopData) {
        console.error(`전문점 검증 오류(shop_id=${body.shop_id}, kol_id=${kolData.id}):`, shopError);
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
      console.error(`영업 일지 생성 오류(kol_id=${kolData.id}):`, createError);
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

    console.log(`영업 일지 생성 완료: ID=${newActivity.id}, KOL ID=${kolData.id}`);
    return NextResponse.json({ 
      success: true,
      message: '영업 일지가 성공적으로 등록되었습니다.',
      data: {
        ...newActivity,
        shop_name: shopName
      }
    }, { status: 201 });
  } catch (error) {
    console.error('영업 일지 생성 에러:', error);
    const errorMessage = error instanceof Error 
      ? `영업 일지 생성 중 오류가 발생했습니다: ${error.message}` 
      : '영업 일지 생성 중 알 수 없는 오류가 발생했습니다.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 