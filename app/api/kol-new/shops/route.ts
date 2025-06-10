import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentDate } from '@/lib/date-utils';
import { getAuthenticatedKol } from '@/lib/auth-cache';

// 매출 데이터 타입 정의
interface MonthlySales {
  shop_id: number;
  total_sales: number;
  product_sales: number;
  device_sales: number;
  commission: number;
}

// 타입 정의 추가
interface ShopInfo {
  id: number;
  owner_name: string;
  shop_name: string;
  region: string | null;
  status: string;
  created_at: string;
  owner_kol_id: number | null;
  is_self_shop: boolean;
  is_owner_kol: boolean;
}

interface ShopData {
  id: number;
  owner_name: string;
  shop_name: string;
  region: string | null;
  status: string;
  created_at: string;
  relationship_type: 'owner' | 'manager';
  owner_kol_id: number | null;
  is_self_shop: boolean;
  is_owner_kol: boolean;
}

// 중복된 전문점 이름 처리를 위한 함수
function processDuplicateShopNames(shops: any[]): any[] {
  // 이름별 전문점 인덱스 맵 생성
  const shopNameMap: Record<string, number[]> = {};
  
  // 각 상점의 이름을 키로 인덱스 맵핑
  shops.forEach((shop, index) => {
    const shopName = shop.shop_name.trim();
    if (!shopNameMap[shopName]) {
      shopNameMap[shopName] = [];
    }
    shopNameMap[shopName].push(index);
  });
  
  // 중복된 이름이 있는 경우 구분자 추가
  Object.entries(shopNameMap).forEach(([name, indices]) => {
    if (indices.length > 1) {
      // 중복된 이름이 있는 경우, 인덱스 순서대로 번호 추가
      indices.forEach((index, i) => {
        if (i > 0) { // 첫 번째 항목은 그대로 두고 두 번째부터 번호 추가
          shops[index].shop_name = `${shops[index].shop_name} (${i + 1})`;
        }
      });
    }
  });
  
  return shops;
}

// KOL 전문점 목록 API 라우트
export async function GET() {
  try {
    console.log('전문점 API 요청 시작');

    // 🚀 캐시된 인증 확인
    const { user: userData, kol: kolData } = await getAuthenticatedKol();

    // 현재 월 계산
    const currentDate = getCurrentDate();
    const currentMonth = currentDate.substring(0, 7);

    console.log(`조회할 월 정보: ${currentMonth}, KOL ID: ${kolData.id}`);
    console.log(`전문점 조회 시작: KOL ID=${kolData.id}`);
    
    // KOL이 관리하는 전문점 정보 조회 (shops 테이블 직접 사용)
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select(`
        id, 
        owner_name, 
        shop_name, 
        region, 
        status, 
        created_at,
        owner_kol_id,
        is_self_shop,
        is_owner_kol
      `)
      .eq('kol_id', kolData.id);

    if (shopsError) {
      console.error(`전문점 조회 오류(kol_id=${kolData.id}):`, shopsError);
      return NextResponse.json(
        { error: `전문점 정보를 조회하는 중 오류가 발생했습니다: ${shopsError.message}` },
        { status: 500 }
      );
    }

    console.log(`전문점 조회 성공: KOL ID=${kolData.id}, 전문점 수=${shops?.length || 0}`);

    if (!shops || shops.length === 0) {
      console.log(`전문점 데이터 없음(kol_id=${kolData.id})`);
      return NextResponse.json({ shops: [], meta: { totalShopsCount: 0, activeShopsCount: 0 } });
    }

    // shop_sales_metrics 테이블에서 전문점별 월간 매출 데이터 조회
    const { data: salesData, error: salesError } = await supabase
      .from('shop_sales_metrics')
      .select('shop_id, total_sales, product_sales, device_sales, commission')
      .eq('year_month', currentMonth);

    if (salesError) {
      console.error(`매출 데이터 조회 오류(year_month=${currentMonth}):`, salesError);
      return NextResponse.json(
        { error: '매출 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log(`조회된 매출 데이터 수: ${salesData?.length || 0}`);
    
    // 각 샵별 매출 데이터 로깅 (특히 믈리에스킨, 마음에점을찍다 확인)
    console.log("샵별 매출 데이터:");
    if (salesData && salesData.length > 0) {
      console.log(salesData.map((sale: any) => ({
        shop_id: sale.shop_id,
        total_sales: sale.total_sales,
        hasOrdered: Boolean(sale.total_sales > 0)
      })));
    }
    
    // 매출 데이터를 맵으로 변환하여 조회 효율성 높이기
    const salesByShop: Record<number, any> = {};
    if (salesData && salesData.length > 0) {
      salesData.forEach((sale: any) => {
        salesByShop[sale.shop_id] = sale;
      });
    }

    // 전문점 데이터와 매출 데이터 조합
    let shopsWithSales = shops.map(shop => {
      // 데이터베이스에서 가져온 is_self_shop, is_owner_kol 값 사용
      const is_owner_kol = shop.is_owner_kol;
      const is_self_shop = shop.is_self_shop;
      
      // shop_name 필드가 존재하고 값이 있는지 확인
      const shop_name = shop.shop_name && shop.shop_name.trim() !== '' 
        ? shop.shop_name 
        : shop.owner_name;
      
      // 매출 데이터 가져오기 (없으면 기본값 사용)
      const shopSalesData = salesByShop[shop.id] || {
        total_sales: 0,
        product_sales: 0,
        device_sales: 0,
        commission: 0
      };
      
      return {
        id: shop.id,
        ownerName: shop.owner_name,
        shop_name,
        region: shop.region || '',
        status: shop.status,
        createdAt: shop.created_at,
        relationship_type: is_self_shop ? 'owner' : 'manager', // is_self_shop 기반으로 관계 설정
        is_owner_kol,
        is_self_shop,
        owner_kol_id: shop.owner_kol_id,
        sales: {
          total: shopSalesData.total_sales || 0,
          product: shopSalesData.product_sales || 0,
          device: shopSalesData.device_sales || 0,
          commission: shopSalesData.commission || 0,
          hasOrdered: Boolean(shopSalesData.total_sales > 0)
        }
      };
    });

    // 중복된 전문점 이름 처리
    shopsWithSales = processDuplicateShopNames(shopsWithSales);
    
    // 디버깅 로그 추가 - 모든 전문점 데이터 상세 출력 (특히 믈리에스킨과 마음에점을찍다 관련)
    console.log("상세 전문점 데이터 디버깅:", shopsWithSales.map(shop => ({
      id: shop.id,
      name: shop.shop_name,
      owner: shop.ownerName,
      is_self: shop.is_self_shop,
      status: shop.status,
      has_ordered: shop.sales.hasOrdered,
      owner_kol_id: shop.owner_kol_id,
      relationship: shop.relationship_type,
      sales_total: shop.sales.total
    })));
    
    // 전문점 필터링: 본인 샵 제외하고 표시 (비즈니스 로직에 따라)
    const filteredShops = shopsWithSales.filter(shop => !shop.is_self_shop);
    
    // 매출 기준 내림차순 정렬
    const sortedShops = filteredShops.sort((a, b) => b.sales.total - a.sales.total);

    // 전문점 통계 정보 계산
    // 전체 전문점 수: 본인 샵 제외한 관리 전문점 수
    const totalShopsCount = shopsWithSales.filter(shop => !shop.is_self_shop).length;
    
    // 각 전문점의 활성 여부 디버깅
    console.log("각 전문점 활성 상태 점검 (매출 유무로만 판단):");
    shopsWithSales.forEach(shop => {
      console.log(`샵: ${shop.shop_name}, 본인샵: ${shop.is_self_shop}, 상태: ${shop.status}, 매출있음: ${shop.sales.hasOrdered}, 매출액: ${shop.sales.total}`);
    });
    
    // 활성 전문점 수 계산 - 본인 샵 제외하고 매출이 있는 전문점만
    const activeShopsCount = shopsWithSales.filter(shop => 
      !shop.is_self_shop && shop.sales.hasOrdered
    ).length;

    console.log(`전문점 데이터 조회 완료: KOL ID=${kolData.id}, 전문점 수=${totalShopsCount}, 활성 전문점 수=${activeShopsCount}`);
    
    // 활성 전문점 상세 정보 로깅
    console.log(`활성 전문점 상세:`, shopsWithSales
      .filter(shop => shop.sales.hasOrdered)
      .map(shop => ({ 
        id: shop.id, 
        name: shop.shop_name, 
        owner: shop.ownerName,
        sales: shop.sales.total,
        relationship: shop.relationship_type,
        is_self: shop.is_self_shop
      }))
    );

    // 메타 정보 포함 응답
    console.log("API 응답으로 보내는 메타 정보:", {
      totalShopsCount,
      activeShopsCount
    });
    
    return NextResponse.json({
      shops: sortedShops,
      meta: {
        totalShopsCount,
        activeShopsCount
      }
    });
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