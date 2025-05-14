import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 제품 비율 데이터 생성 API (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { kol_id, year_month } = body;

    if (!kol_id || !year_month) {
      return NextResponse.json(
        { error: 'KOL ID와 year_month가 필요합니다.' },
        { status: 400 }
      );
    }

    // KOL 정보 확인
    const { data: kolData, error: kolError } = await supabase
      .from('kols')
      .select('id, name')
      .eq('id', kol_id)
      .single();

    if (kolError || !kolData) {
      return NextResponse.json(
        { error: '해당 KOL 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 product_sales_metrics 데이터 삭제 (shop_id가 NULL인 데이터)
    const { error: deleteError } = await supabase
      .from('product_sales_metrics')
      .delete()
      .eq('kol_id', kol_id)
      .eq('year_month', year_month)
      .is('shop_id', null);

    if (deleteError) {
      console.error('기존 데이터 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '기존 데이터 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // KOL의 월별 총 매출 확인
    const { data: kolMetrics, error: kolMetricsError } = await supabase
      .from('kol_dashboard_metrics')
      .select('monthly_sales')
      .eq('kol_id', kol_id)
      .eq('year_month', year_month)
      .single();

    if (kolMetricsError || !kolMetrics) {
      return NextResponse.json(
        { error: 'KOL의 매출 데이터가 없습니다. 먼저 매출 데이터를 생성해주세요.' },
        { status: 404 }
      );
    }

    const totalSales = kolMetrics.monthly_sales;
    if (totalSales <= 0) {
      return NextResponse.json(
        { error: 'KOL의 총 매출이 0입니다. 매출 데이터를 확인해주세요.' },
        { status: 400 }
      );
    }

    // 제품 목록 가져오기
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, is_device')
      .eq('status', 'active');

    if (productsError || !products || products.length === 0) {
      return NextResponse.json(
        { error: '제품 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 제품 유형별로 그룹화 (화장품과 장비)
    const productTypes = products.reduce(
      (acc, product) => {
        if (product.is_device) {
          acc.devices.push(product);
        } else {
          acc.products.push(product);
        }
        return acc;
      },
      { products: [], devices: [] } as { products: any[]; devices: any[] }
    );

    // 임의로 데이터 생성 (실제로는 더 복잡한 로직이 필요할 수 있음)
    // 화장품 70%, 장비 30% 비율로 가정
    const productSalesAmount = totalSales * 0.7;
    const deviceSalesAmount = totalSales * 0.3;

    const productMetricsData = [];

    // 화장품 비율 계산
    if (productTypes.products.length > 0) {
      const productCount = productTypes.products.length;
      productTypes.products.forEach((product, index) => {
        // 차등 비율 적용 (첫 번째 제품: 50%, 나머지 제품들이 균등하게 나눔)
        const ratio = index === 0 ? 0.5 : 0.5 / (productCount - 1 || 1);
        const salesAmount = Math.round(productSalesAmount * ratio);
        const salesRatio = Number((ratio * 0.7).toFixed(4));
        
        productMetricsData.push({
          kol_id,
          product_id: product.id,
          year_month,
          shop_id: null,
          quantity: Math.round(salesAmount / 50000), // 대략적인 수량 계산
          sales_amount: salesAmount,
          sales_ratio: salesRatio,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // 장비 비율 계산
    if (productTypes.devices.length > 0) {
      const deviceCount = productTypes.devices.length;
      productTypes.devices.forEach((device, index) => {
        const ratio = 1 / deviceCount;
        const salesAmount = Math.round(deviceSalesAmount * ratio);
        const salesRatio = Number((ratio * 0.3).toFixed(4));
        
        productMetricsData.push({
          kol_id,
          product_id: device.id,
          year_month,
          shop_id: null,
          quantity: Math.round(salesAmount / 500000), // 장비는 고가이므로 다른 계산식
          sales_amount: salesAmount,
          sales_ratio: salesRatio,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // 데이터 삽입
    const { data: insertedData, error: insertError } = await supabase
      .from('product_sales_metrics')
      .insert(productMetricsData)
      .select();

    if (insertError) {
      console.error('데이터 삽입 오류:', insertError);
      return NextResponse.json(
        { error: '제품별 비율 데이터 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${productMetricsData.length}개의 제품 비율 데이터가 생성되었습니다.`,
      data: insertedData
    });
  } catch (error) {
    console.error('제품 비율 데이터 생성 오류:', error);
    return NextResponse.json(
      { error: '제품 비율 데이터 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 