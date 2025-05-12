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

// GET - KOL 지표 조회
export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const url = new URL(request.url);
  
  // 쿼리 파라미터
  const kolId = url.searchParams.get('kol_id');
  const yearMonth = url.searchParams.get('year_month');
  
  // 기본 쿼리
  let query = supabase.from('kol_dashboard_metrics').select('*');
  
  // 필터 적용
  if (kolId) {
    query = query.eq('kol_id', kolId);
  }
  
  if (yearMonth) {
    query = query.eq('year_month', yearMonth);
  }
  
  // 정렬
  query = query.order('year_month', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// POST - 새로운 KOL 지표 추가
export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  
  // 필수 필드 검증
  if (!body.kol_id || !body.year_month) {
    return NextResponse.json(
      { error: 'KOL ID와 년월은 필수 입력사항입니다.' },
      { status: 400 }
    );
  }
  
  // 중복 체크
  const { data: existingData } = await supabase
    .from('kol_dashboard_metrics')
    .select('id')
    .eq('kol_id', body.kol_id)
    .eq('year_month', body.year_month)
    .maybeSingle();
  
  if (existingData) {
    return NextResponse.json(
      { error: '해당 KOL과 년월의 데이터가 이미 존재합니다.' },
      { status: 409 }
    );
  }
  
  // 데이터 삽입
  const { data, error } = await supabase
    .from('kol_dashboard_metrics')
    .insert([{
      kol_id: body.kol_id,
      year_month: body.year_month,
      monthly_sales: body.monthly_sales || 0,
      monthly_commission: body.monthly_commission || 0,
      active_shops_count: body.active_shops_count || 0,
      total_shops_count: body.total_shops_count || 0
    }])
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: data[0] }, { status: 201 });
}

// PUT - KOL 지표 업데이트
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
      { error: '업데이트할 지표의 ID가 필요합니다.' },
      { status: 400 }
    );
  }
  
  // 업데이트할 필드 준비
  const updateFields: any = {};
  if (body.monthly_sales !== undefined) updateFields.monthly_sales = body.monthly_sales;
  if (body.monthly_commission !== undefined) updateFields.monthly_commission = body.monthly_commission;
  if (body.active_shops_count !== undefined) updateFields.active_shops_count = body.active_shops_count;
  if (body.total_shops_count !== undefined) updateFields.total_shops_count = body.total_shops_count;
  
  // 업데이트할 데이터가 없으면 오류
  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: '업데이트할 데이터가 없습니다.' },
      { status: 400 }
    );
  }
  
  // 데이터 업데이트
  const { data, error } = await supabase
    .from('kol_dashboard_metrics')
    .update(updateFields)
    .eq('id', body.id)
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: '해당 ID의 지표를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ data: data[0] });
}

// DELETE - KOL 지표 삭제
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
      { error: '삭제할 지표의 ID가 필요합니다.' },
      { status: 400 }
    );
  }
  
  // 데이터 삭제
  const { error } = await supabase
    .from('kol_dashboard_metrics')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
} 