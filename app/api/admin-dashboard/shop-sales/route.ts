import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 관리자 권한 검증 함수
async function verifyAdmin() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return false;
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', session.user.id)
    .single();
  
  return user && user.role === 'admin';
}

// GET - 전문점 매출 데이터 조회
export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const url = new URL(request.url);
  
  // 쿼리 파라미터
  const shopId = url.searchParams.get('shop_id');
  const kolId = url.searchParams.get('kol_id');
  const yearMonth = url.searchParams.get('year_month');
  
  // 기본 쿼리
  let query = supabase.from('shop_sales_metrics').select('*');
  
  // 필터 적용
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  
  // KOL ID로 전문점 필터링
  if (kolId && !shopId) {
    // 먼저 해당 KOL의 전문점 목록 조회
    const { data: shopData } = await supabase
      .from('shops')
      .select('id')
      .eq('kol_id', kolId);
    
    if (shopData && shopData.length > 0) {
      const shopIds = shopData.map(shop => shop.id);
      query = query.in('shop_id', shopIds);
    } else {
      return NextResponse.json({ data: [] });
    }
  }
  
  if (yearMonth) {
    query = query.eq('year_month', yearMonth);
  }
  
  // 정렬
  query = query.order('shop_id').order('year_month', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// POST - 신규 전문점 매출 데이터 추가
export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  
  // 필수 필드 검증
  if (!body.shop_id || !body.year_month) {
    return NextResponse.json(
      { error: '전문점 ID와 년월은 필수 입력사항입니다.' },
      { status: 400 }
    );
  }
  
  // 중복 체크
  const { data: existingData } = await supabase
    .from('shop_sales_metrics')
    .select('id')
    .eq('shop_id', body.shop_id)
    .eq('year_month', body.year_month)
    .maybeSingle();
  
  if (existingData) {
    return NextResponse.json(
      { error: '해당 전문점과 년월의 데이터가 이미 존재합니다.' },
      { status: 409 }
    );
  }
  
  // 총 매출 계산 (제품 + 기기)
  const totalSales = (body.product_sales || 0) + (body.device_sales || 0);
  
  // 데이터 삽입
  const { data, error } = await supabase
    .from('shop_sales_metrics')
    .insert([{
      shop_id: body.shop_id,
      year_month: body.year_month,
      total_sales: totalSales,
      product_sales: body.product_sales || 0,
      device_sales: body.device_sales || 0,
      commission: body.commission || 0
    }])
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: data[0] }, { status: 201 });
}

// PUT - 전문점 매출 데이터 업데이트
export async function PUT(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  
  // ID 필수 확인
  if (!body.id) {
    return NextResponse.json(
      { error: '업데이트할 데이터의 ID가 필요합니다.' },
      { status: 400 }
    );
  }
  
  // 업데이트할 필드 준비
  const updateFields: any = {};
  if (body.product_sales !== undefined) updateFields.product_sales = body.product_sales;
  if (body.device_sales !== undefined) updateFields.device_sales = body.device_sales;
  if (body.commission !== undefined) updateFields.commission = body.commission;
  
  // 총 매출 계산
  if (body.product_sales !== undefined || body.device_sales !== undefined) {
    // 기존 데이터 조회
    const { data: existingData } = await supabase
      .from('shop_sales_metrics')
      .select('product_sales, device_sales')
      .eq('id', body.id)
      .single();
    
    if (!existingData) {
      return NextResponse.json(
        { error: '해당 ID의 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const productSales = body.product_sales !== undefined ? body.product_sales : existingData.product_sales;
    const deviceSales = body.device_sales !== undefined ? body.device_sales : existingData.device_sales;
    
    updateFields.total_sales = productSales + deviceSales;
  }
  
  // 업데이트할 데이터가 없으면 오류
  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: '업데이트할 데이터가 없습니다.' },
      { status: 400 }
    );
  }
  
  // 데이터 업데이트
  const { data, error } = await supabase
    .from('shop_sales_metrics')
    .update(updateFields)
    .eq('id', body.id)
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: '해당 ID의 데이터를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ data: data[0] });
}

// DELETE - 전문점 매출 데이터 삭제
export async function DELETE(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: '삭제할 데이터의 ID가 필요합니다.' },
      { status: 400 }
    );
  }
  
  // 데이터 삭제
  const { error } = await supabase
    .from('shop_sales_metrics')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
} 