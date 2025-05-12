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

// GET - 제품 매출 데이터 조회
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
  const productId = url.searchParams.get('product_id');
  const yearMonth = url.searchParams.get('year_month');
  
  // 기본 쿼리
  let query = supabase.from('product_sales_metrics').select('*');
  
  // 필터 적용
  if (kolId) {
    query = query.eq('kol_id', kolId);
  }
  
  if (productId) {
    query = query.eq('product_id', productId);
  }
  
  if (yearMonth) {
    query = query.eq('year_month', yearMonth);
  }
  
  // 정렬
  query = query.order('kol_id').order('year_month', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 제품 정보 조회
  if (data && data.length > 0) {
    const productIds = [...new Set(data.map(item => item.product_id))];
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);
    
    // 제품 정보를 매출 데이터에 결합
    const enrichedData = data.map(item => {
      const product = products?.find(p => p.id === item.product_id);
      return {
        ...item,
        product_name: product?.name || `제품 #${item.product_id}`,
        product_price: product?.price || 0
      };
    });
    
    return NextResponse.json({ data: enrichedData });
  }
  
  return NextResponse.json({ data });
}

// POST - 신규 제품 매출 데이터 추가
export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  
  // 필수 필드 검증
  if (!body.kol_id || !body.product_id || !body.year_month) {
    return NextResponse.json(
      { error: 'KOL ID, 제품 ID, 년월은 필수 입력사항입니다.' },
      { status: 400 }
    );
  }
  
  // 중복 체크
  const { data: existingData } = await supabase
    .from('product_sales_metrics')
    .select('id')
    .eq('kol_id', body.kol_id)
    .eq('product_id', body.product_id)
    .eq('year_month', body.year_month)
    .maybeSingle();
  
  if (existingData) {
    return NextResponse.json(
      { error: '해당 KOL, 제품, 년월의 데이터가 이미 존재합니다.' },
      { status: 409 }
    );
  }
  
  // 제품 가격 조회
  const { data: productData } = await supabase
    .from('products')
    .select('price')
    .eq('id', body.product_id)
    .single();
  
  if (!productData) {
    return NextResponse.json(
      { error: '해당 제품을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  // 매출액 계산
  const quantity = body.quantity || 0;
  const salesAmount = quantity * productData.price;
  
  // 해당 KOL의 총 매출액 계산 (비율 계산용)
  const { data: kolProducts } = await supabase
    .from('product_sales_metrics')
    .select('sales_amount')
    .eq('kol_id', body.kol_id)
    .eq('year_month', body.year_month);
  
  const totalSales = (kolProducts?.reduce((sum, item) => sum + item.sales_amount, 0) || 0) + salesAmount;
  
  // 모든 제품의 비율 업데이트를 위한 데이터 준비
  const salesRatio = totalSales > 0 ? (salesAmount / totalSales) * 100 : 0;
  
  // 데이터 삽입
  const { data, error } = await supabase
    .from('product_sales_metrics')
    .insert([{
      kol_id: body.kol_id,
      product_id: body.product_id,
      year_month: body.year_month,
      quantity,
      sales_amount: salesAmount,
      sales_ratio: salesRatio
    }])
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 다른 제품들의 비율도 업데이트
  if (kolProducts && kolProducts.length > 0) {
    // 각 제품의 비율 업데이트
    const updatePromises = kolProducts.map(async product => {
      const { error } = await supabase
        .from('product_sales_metrics')
        .update({
          sales_ratio: (product.sales_amount / totalSales) * 100
        })
        .eq('kol_id', body.kol_id)
        .eq('year_month', body.year_month)
        .neq('product_id', body.product_id);
      
      return error;
    });
    
    await Promise.all(updatePromises);
  }
  
  return NextResponse.json({ data: data[0] }, { status: 201 });
}

// PUT - 제품 매출 데이터 업데이트
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
  
  // 현재 데이터 조회
  const { data: currentData } = await supabase
    .from('product_sales_metrics')
    .select('*')
    .eq('id', body.id)
    .single();
  
  if (!currentData) {
    return NextResponse.json(
      { error: '해당 ID의 데이터를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  // 제품 가격 조회
  const { data: productData } = await supabase
    .from('products')
    .select('price')
    .eq('id', currentData.product_id)
    .single();
  
  if (!productData) {
    return NextResponse.json(
      { error: '해당 제품을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  // 업데이트할 필드 준비
  const updateFields: any = {};
  
  // 수량이 변경된 경우 매출액도 업데이트
  if (body.quantity !== undefined && body.quantity !== currentData.quantity) {
    updateFields.quantity = body.quantity;
    updateFields.sales_amount = body.quantity * productData.price;
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
    .from('product_sales_metrics')
    .update(updateFields)
    .eq('id', body.id)
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 매출액이 변경된 경우 모든 관련 제품의 비율 재계산
  if (updateFields.sales_amount !== undefined) {
    // 해당 KOL의 모든 제품 매출 조회
    const { data: kolProducts } = await supabase
      .from('product_sales_metrics')
      .select('*')
      .eq('kol_id', currentData.kol_id)
      .eq('year_month', currentData.year_month);
    
    if (kolProducts && kolProducts.length > 0) {
      // 총 매출액 계산
      const totalSales = kolProducts.reduce((sum, item) => sum + item.sales_amount, 0);
      
      // 각 제품의 비율 업데이트
      if (totalSales > 0) {
        const updatePromises = kolProducts.map(async product => {
          const { error } = await supabase
            .from('product_sales_metrics')
            .update({
              sales_ratio: (product.sales_amount / totalSales) * 100
            })
            .eq('id', product.id);
          
          return error;
        });
        
        await Promise.all(updatePromises);
      }
    }
  }
  
  return NextResponse.json({ data: data && data[0] });
}

// DELETE - 제품 매출 데이터 삭제
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
  
  // 삭제할 데이터 정보 조회 (KOL ID와 년월 필요)
  const { data: targetData } = await supabase
    .from('product_sales_metrics')
    .select('kol_id, year_month')
    .eq('id', id)
    .single();
  
  if (!targetData) {
    return NextResponse.json(
      { error: '해당 ID의 데이터를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
  
  // 데이터 삭제
  const { error } = await supabase
    .from('product_sales_metrics')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 남은 제품들의 비율 재계산
  const { data: remainingProducts } = await supabase
    .from('product_sales_metrics')
    .select('*')
    .eq('kol_id', targetData.kol_id)
    .eq('year_month', targetData.year_month);
  
  if (remainingProducts && remainingProducts.length > 0) {
    // 총 매출액 계산
    const totalSales = remainingProducts.reduce((sum, item) => sum + item.sales_amount, 0);
    
    // 각 제품의 비율 업데이트
    if (totalSales > 0) {
      const updatePromises = remainingProducts.map(async product => {
        const { error } = await supabase
          .from('product_sales_metrics')
          .update({
            sales_ratio: (product.sales_amount / totalSales) * 100
          })
          .eq('id', product.id);
        
        return error;
      });
      
      await Promise.all(updatePromises);
    }
  }
  
  return NextResponse.json({ success: true });
} 