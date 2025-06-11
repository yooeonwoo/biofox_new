"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Store, PlusCircle, Search, Edit, Trash, 
  ChevronDown, ChevronRight, AlertCircle 
} from 'lucide-react';

// 컴포넌트 임포트
import EntitySidebar from '@/app/components/admin/EntitySidebar';
import EntityTable from '@/app/components/admin/EntityTable';
import { KolModal, ShopModal, DeleteModal } from '@/app/components/admin/EntityModals';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
  email?: string;
  user_id?: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number | null;
  region: string;
  status: string;
  email?: string;
  relationship_type?: string | null;
  owner_kol_id?: number | null;
  is_self_shop?: boolean;
};

// KOL-Shop 관계 타입
type KolShopRelation = {
  kol_id: number;
  shop_id: number;
  relationship_type: string;
};

// Supabase 응답 타입 수정
interface KolWithUserData {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
  user_id: string;
}

// ShopWithUserData 인터페이스 수정 (users 필드 제거)
interface ShopWithUserData {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number;
  region: string;
  status: string;
}

// KOL 모달 인터페이스 업데이트
interface KolModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKol: KOL | null;
  kolForm: {
    name: string;
    shop_name: string;
    region: string;
    email: string;
  };
  setKolForm: (form: { name: string; shop_name: string; region: string; email: string }) => void;
  onSubmit: () => void;
}

// 전문점 모달 인터페이스 업데이트
interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShop: Shop | null;
  shopForm: {
    shop_name: string;
    owner_name: string;
    kol_id: string;
    region: string;
    email: string;
  };
  setShopForm: (form: { shop_name: string; owner_name: string; kol_id: string; region: string; email: string }) => void;
  onSubmit: () => void;
  kols: KOL[];
}

// KOL 및 전문점 관리 페이지
export default function EntitiesPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [supabase, setSupabase] = useState<any>(null);
  
  // Supabase 초기화
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    setSupabaseUrl(supabaseUrl);
    setSupabaseKey(supabaseKey);
    
    if (supabaseUrl && supabaseKey) {
      console.log('Supabase 클라이언트 초기화: URL과 Key가 설정되었습니다.');
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabase(client);
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Supabase 클라이언트 초기화 중 오류:', 
          error.message || '알 수 없는 오류');
        alert('데이터베이스 연결에 실패했습니다. 관리자에게 문의하세요.');
      }
    } else {
      console.error('Supabase 클라이언트 초기화 실패: URL 또는 Key가 설정되지 않았습니다.');
      if (!supabaseUrl) console.error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
      if (!supabaseKey) console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
      alert('데이터베이스 설정이 잘못되었습니다. 관리자에게 문의하세요.');
    }
  }, []);

  const [kols, setKols] = useState<KOL[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsByKol, setShopsByKol] = useState<{[key: number]: Shop[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 확장 상태
  const [expandedKolId, setExpandedKolId] = useState<number | null>(null);
  
  // 모달 상태
  const [isKolModalOpen, setIsKolModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'kol' | 'shop' | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  
  const [selectedKol, setSelectedKol] = useState<KOL | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  
  // 선택된 엔티티 상태 (테이블 표시용)
  const [selectedEntityType, setSelectedEntityType] = useState<'kol' | 'shop' | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  
  // 폼 상태
  const [kolForm, setKolForm] = useState({
    name: '',
    shop_name: '',
    region: '',
    email: ''
  });
  
  const [shopForm, setShopForm] = useState({
    shop_name: '',
    owner_name: '',
    kol_id: '',
    region: '',
    email: ''
  });

  // 관련 전문점 수 상태
  const [relatedShopsCount, setRelatedShopsCount] = useState(0);

  // KOL 목록 조회
  const fetchKols = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        setIsLoading(false);
        return;
      }
      
      const { data: kolsData, error } = await supabase
        .from('kols')
        .select(`
          id, 
          name, 
          shop_name, 
          region, 
          status,
          user_id,
          users(email)
        `)
        .order('name');
      
      if (error) {
        console.error('KOL 조회 중 오류 발생:', error.message, error.details, error.hint);
        setIsLoading(false);
        return;
      }
      
      if (!kolsData || kolsData.length === 0) {
        console.log('KOL 데이터가 없습니다.');
        setKols([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`총 ${kolsData.length}개의 KOL을 조회했습니다.`);
      
      // 타입 안전하게 처리
      const kolsWithEmail: KOL[] = kolsData.map((kol: any) => {
        return {
          id: kol.id,
          name: kol.name,
          shop_name: kol.shop_name,
          region: kol.region,
          status: kol.status,
          user_id: kol.user_id,
          email: kol.users?.email || ''
        };
      });
      
      setKols(kolsWithEmail);
    } catch (error: any) {
      console.error('KOL 데이터 처리 중 오류 발생:', 
        error.message || '알 수 없는 오류', 
        error.details || '', 
        error.code || '');
    }
    setIsLoading(false);
  };

  // 모든 전문점 목록 조회
  const fetchAllShops = async () => {
    try {
      console.log('모든 전문점을 조회합니다.');
      
      if (!supabase) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return;
      }

      // 1. 모든 전문점 조회
      const { data: shopsData, error } = await supabase
        .from('shops')
        .select(`
          id, 
          shop_name, 
          owner_name, 
          region, 
          status,
          email,
          owner_kol_id,
          kol_id,
          is_self_shop
        `)
        .order('shop_name');
      
      if (error) {
        console.error('전문점 조회 중 오류 발생:', error.message, error.details, error.hint);
        return;
      }
      
      if (!shopsData || shopsData.length === 0) {
        console.log('전문점 데이터가 없습니다.');
        setShops([]);
        setShopsByKol({});
        return;
      }
      
      console.log(`총 ${shopsData.length}개의 전문점을 조회했습니다.`);

      // 타입 안전하게 처리 - kol_id를 사용하여 KOL 관계 설정
      const shopsWithEmail: Shop[] = shopsData.map((shop: any) => {
        return {
          id: shop.id,
          shop_name: shop.shop_name,
          owner_name: shop.owner_name,
          kol_id: shop.kol_id, // kol_id를 사용 (관리 관계)
          region: shop.region,
          status: shop.status,
          email: shop.email || '',
          relationship_type: shop.owner_kol_id ? 'owner' : 'managed',
          owner_kol_id: shop.owner_kol_id,
          is_self_shop: shop.is_self_shop
        };
      });
      
      setShops(shopsWithEmail);
      
      // KOL별 전문점 그룹화 - 디버깅 로그 추가
      const shopGroups: {[key: number]: Shop[]} = {};
      const unassignedShops: Shop[] = []; // KOL이 없는 전문점을 저장할 배열
      
      console.log(`총 ${shopsWithEmail.length}개의 전문점을 처리합니다.`);
      
      shopsWithEmail.forEach(shop => {
        // kol_id가 유효하고 본인 샵이 아닌 경우만 그룹에 추가
        if (shop.kol_id && !isNaN(Number(shop.kol_id)) && Number(shop.kol_id) > 0) {
          const kolId = Number(shop.kol_id);
          
          // 본인 샵이 아닌 경우만 표시
          if (!shop.is_self_shop) {
            if (!shopGroups[kolId]) {
              shopGroups[kolId] = [];
            }
            shopGroups[kolId].push(shop);
            console.log(`KOL ID ${kolId}에 전문점 ${shop.shop_name} 추가됨 (is_self_shop: ${shop.is_self_shop})`);
          } else {
            console.log(`KOL ID ${kolId}의 본인 샵 ${shop.shop_name} 제외됨`);
          }
        } else {
          // KOL이 없거나 유효하지 않은 경우 unassignedShops에 추가
          unassignedShops.push(shop);
          console.log(`KOL 미지정 전문점 발견: ${shop.shop_name}, KOL ID: ${shop.kol_id}`);
        }
      });
      
      // 미지정 전문점이 있으면 특별 키(0)에 저장
      if (unassignedShops.length > 0) {
        shopGroups[0] = unassignedShops;
        console.log(`KOL 미지정 전문점 그룹에 ${unassignedShops.length}개 추가됨`);
      }
      
      // 각 KOL ID별 전문점 수 로깅
      Object.keys(shopGroups).forEach(kolId => {
        console.log(`KOL ID ${kolId}에 ${shopGroups[Number(kolId)].length}개의 전문점이 있습니다.`);
      });
      
      setShopsByKol(shopGroups);
    } catch (error: any) {
      console.error('전문점 데이터 처리 중 오류 발생:', 
        error.message || '알 수 없는 오류', 
        error.details || '', 
        error.code || '');
    }
  };

  // KOL에 소속된 전문점 목록 조회
  const fetchShopsByKol = async (kolId: number) => {
    try {
      console.log(`KOL ID ${kolId}의 전문점을 조회합니다.`);
      
      if (!supabase) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return [];
      }
      
      if (!kolId || isNaN(kolId)) {
        console.error(`유효하지 않은 KOL ID: ${kolId}`);
        return [];
      }
      
      // kol_id를 사용하여 해당 KOL의 전문점 조회 (본인 샵 제외)
      const { data: shopsData, error } = await supabase
        .from('shops')
        .select(`
          id, 
          shop_name, 
          owner_name, 
          region, 
          status,
          email,
          owner_kol_id,
          kol_id,
          is_self_shop
        `)
        .eq('kol_id', kolId)
        .eq('is_self_shop', false);
      
      if (error) {
        console.error(`KOL ID ${kolId}의 전문점 조회 중 오류 발생:`, error.message, error.details, error.hint);
        return [];
      }
      
      if (!shopsData || shopsData.length === 0) {
        console.log(`KOL ID ${kolId}에 대한 전문점 데이터가 없습니다.`);
        return [];
      }
      
      console.log(`KOL ID ${kolId}에 ${shopsData.length}개의 전문점이 있습니다.`);
      
      // 타입 안전하게 처리
      const shopsWithEmail: Shop[] = shopsData.map((shop: any) => {
        return {
          id: shop.id,
          shop_name: shop.shop_name,
          owner_name: shop.owner_name,
          kol_id: kolId, // 현재 KOL ID 설정
          region: shop.region,
          status: shop.status,
          email: shop.email || '',
          relationship_type: shop.owner_kol_id ? 'owner' : 'managed',
          owner_kol_id: shop.owner_kol_id,
          is_self_shop: shop.is_self_shop
        };
      });
      
      const updatedShopsByKol = { ...shopsByKol };
      updatedShopsByKol[kolId] = shopsWithEmail;
      setShopsByKol(updatedShopsByKol);
      
      return shopsWithEmail;
    } catch (error: any) {
      console.error(`KOL ID ${kolId}의 전문점 조회 중 오류 발생:`, 
        error.message || '알 수 없는 오류', 
        error.details || '', 
        error.code || '');
      return [];
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isInitialized && supabase) {
      console.log('Supabase 클라이언트가 초기화되었습니다. 데이터 로드를 시작합니다.');
      
      // 데이터 로드 시작
      const loadData = async () => {
        try {
          setIsLoading(true);
          await fetchKols();
          await fetchAllShops();
        } catch (error: any) {
          console.error('데이터 로드 중 오류 발생:', error.message || '알 수 없는 오류');
          alert('데이터를 불러오는 데 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [isInitialized, supabase]);

  // KOL 확장 토글
  const toggleKol = async (kolId: number) => {
    try {
      if (!supabase) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return;
      }
      
      console.log(`KOL ID ${kolId} 토글 시도 중...`);
      
      // 유효한 KOL인지 검증
      const { data: kolData, error: kolError } = await supabase
        .from('kols')
        .select('id')
        .eq('id', kolId)
        .single();
        
      if (kolError && kolError.code !== 'PGRST116') { // PGRST116: No rows returned (이건 정상적인 경우일 수 있음)
        console.error(`KOL ID ${kolId} 확인 중 오류:`, kolError.message, kolError.details);
        alert(`KOL 정보를 확인하는 중 오류가 발생했습니다: ${kolError.message}`);
        return;
      }
      
      if (!kolData && kolError?.code === 'PGRST116') {
        console.error(`KOL ID ${kolId}가 데이터베이스에 존재하지 않습니다.`);
        alert(`KOL ID ${kolId}는 존재하지 않는 KOL입니다.`);
        return;
      }
      
      if (expandedKolId === kolId) {
        console.log(`KOL ID ${kolId} 접기`);
        setExpandedKolId(null);
      } else {
        console.log(`KOL ID ${kolId} 펼치기`);
        setExpandedKolId(kolId);
        
        // 전문점 목록이 없거나 비어있으면 새로 가져옴
        if (!shopsByKol[kolId] || shopsByKol[kolId].length === 0) {
          console.log(`KOL ${kolId} 소속 전문점 목록을 가져옵니다.`);
          const shops = await fetchShopsByKol(kolId);
          console.log(`KOL ${kolId} 소속 전문점 ${shops.length}개 로드 완료`);
        } else {
          console.log(`KOL ${kolId} 소속 전문점 목록이 이미 로드되어 있습니다. (${shopsByKol[kolId].length}개)`);
        }
      }
    } catch (error: any) {
      console.error(`KOL ${kolId} 토글 중 오류 발생:`, 
        error.message || '알 수 없는 오류', 
        error.details || '', 
        error.code || '');
      alert(`KOL 정보를 처리하는 중 오류가 발생했습니다.`);
    }
  };
  
  // 엔티티 선택 핸들러
  const handleSelectKol = (kol: KOL) => {
    setSelectedEntityType('kol');
    setSelectedEntityId(kol.id);
  };
  
  const handleSelectShop = (shop: Shop) => {
    setSelectedEntityType('shop');
    setSelectedEntityId(shop.id);
  };

  // KOL 추가 함수
  const addKol = async (data: { name: string; shop_name: string; region?: string; email: string }) => {
    // 이메일로 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') { // 사용자가 없는 경우
        throw new Error(`입력한 이메일(${data.email})로 등록된 사용자가 없습니다. 먼저 사용자 등록이 필요합니다.`);
      } else {
        throw new Error(`사용자 조회 중 오류가 발생했습니다: ${userError.message}`);
      }
    }

    if (!userData) {
      throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
    }

    const { error } = await supabase
      .from('kols')
      .insert([
        {
          name: data.name,
          shop_name: data.shop_name,
          region: data.region || null,
          user_id: userData.id,
          status: 'active',
        },
      ])
      .select();

    if (error) {
      throw new Error(`오류가 발생했습니다: ${error.message}`);
    }

    await fetchKols();
  };

  // KOL 수정 함수
  const updateKol = async (data: { name: string; shop_name: string; region?: string; email: string }) => {
    if (!selectedKol) {
      throw new Error('선택된 KOL이 없습니다.');
    }

    const { error } = await supabase
      .from('kols')
      .update({
        name: data.name,
        shop_name: data.shop_name,
        region: data.region || null,
      })
      .eq('id', selectedKol.id);

    if (error) {
      throw new Error(`오류가 발생했습니다: ${error.message}`);
    }

    setSelectedKol(null);
    await fetchKols();
  };

  // KOL 삭제 함수
  const deleteKol = async () => {
    if (!deleteItemId) return;

    // 해당 KOL에 속한 전문점이 있는지 확인
    const { data: relatedShops } = await supabase
      .from('shops')
      .select('id')
      .eq('kol_id', deleteItemId);

    const hasRelatedShops = relatedShops && relatedShops.length > 0;
    
    try {
      // 1. sales_activities 테이블에서 해당 kol_id와 관련된 데이터 삭제
      const { error: kolActivitiesDeleteError } = await supabase
        .from('sales_activities')
        .delete()
        .eq('kol_id', deleteItemId);
      
      if (kolActivitiesDeleteError) {
        throw new Error(`KOL 활동 데이터 삭제 중 오류 발생: ${kolActivitiesDeleteError.message}`);
      }

      // 소속된 전문점이 있으면 함께 삭제
      if (hasRelatedShops) {
        try {
          // 먼저 각 shop에 대한 orders를 조회
          for (const shop of relatedShops) {
            const { data: relatedOrders } = await supabase
              .from('orders')
              .select('id')
              .eq('shop_id', shop.id);
            
            if (relatedOrders && relatedOrders.length > 0) {
              // -1. 각 order의 commissions를 먼저 삭제
              for (const order of relatedOrders) {
                const { error: commissionsDeleteError } = await supabase
                  .from('commissions')
                  .delete()
                  .eq('order_id', order.id);
                
                if (commissionsDeleteError) {
                  throw new Error(`수수료 데이터 삭제 중 오류 발생: ${commissionsDeleteError.message}`);
                }
              }
            }
          }

          // 0. 이제 orders 테이블에서 관련된 shop_id를 가진 레코드들을 삭제
          for (const shop of relatedShops) {
            const { error: ordersDeleteError } = await supabase
              .from('orders')
              .delete()
              .eq('shop_id', shop.id);
            
            if (ordersDeleteError) {
              throw new Error(`주문 데이터 삭제 중 오류 발생: ${ordersDeleteError.message}`);
            }
          }

          // 1. 먼저 monthly_sales 테이블에서 관련된 shop_id를 가진 레코드들을 삭제
          for (const shop of relatedShops) {
            const { error: monthlySalesDeleteError } = await supabase
              .from('monthly_sales')
              .delete()
              .eq('shop_id', shop.id);
            
            if (monthlySalesDeleteError) {
              throw new Error(`월별 매출 데이터 삭제 중 오류 발생: ${monthlySalesDeleteError.message}`);
            }
          }

          // 2. 그 다음 shop_sales_metrics 테이블에서 관련된 shop_id를 가진 레코드들을 삭제
          for (const shop of relatedShops) {
            const { error: shopSalesMetricsDeleteError } = await supabase
              .from('shop_sales_metrics')
              .delete()
              .eq('shop_id', shop.id);
            
            if (shopSalesMetricsDeleteError) {
              throw new Error(`전문점 매출 지표 삭제 중 오류 발생: ${shopSalesMetricsDeleteError.message}`);
            }
          }

          // 2.1 shop_sales_summary 테이블에서 관련된 shop_id 삭제
          for (const shop of relatedShops) {
            const { error: shopSalesSummaryDeleteError } = await supabase
              .from('shop_sales_summary')
              .delete()
              .eq('shop_id', shop.id);
            
            if (shopSalesSummaryDeleteError) {
              throw new Error(`전문점 매출 요약 삭제 중 오류 발생: ${shopSalesSummaryDeleteError.message}`);
            }
          }

          // 2.2 shop_product_sales 테이블에서 관련된 shop_id 삭제
          for (const shop of relatedShops) {
            const { error: shopProductSalesDeleteError } = await supabase
              .from('shop_product_sales')
              .delete()
              .eq('shop_id', shop.id);
            
            if (shopProductSalesDeleteError) {
              throw new Error(`전문점 제품 매출 삭제 중 오류 발생: ${shopProductSalesDeleteError.message}`);
            }
          }

          // 소속된 모든 전문점 삭제
          const { error: shopsDeleteError } = await supabase
            .from('shops')
            .delete()
            .eq('kol_id', deleteItemId);

          if (shopsDeleteError) {
            throw new Error(`소속된 전문점 삭제 중 오류 발생: ${shopsDeleteError.message}`);
          }
        } catch (error) {
          alert(`삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          setIsDeleteModalOpen(false);
          setDeleteItemId(null);
          setDeleteType(null);
          return;
        }
      }
      
      // 3. KOL 관련 매출 지표 삭제
      // 3.1 product_sales_metrics 테이블에서 관련 데이터 삭제
      const { error: productSalesMetricsDeleteError } = await supabase
        .from('product_sales_metrics')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (productSalesMetricsDeleteError) {
        throw new Error(`제품 매출 메트릭 삭제 중 오류 발생: ${productSalesMetricsDeleteError.message}`);
      }

      // 3.2 kol_product_summary 테이블에서 관련 데이터 삭제
      const { error: kolProductSummaryDeleteError } = await supabase
        .from('kol_product_summary')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (kolProductSummaryDeleteError) {
        throw new Error(`KOL 제품 요약 삭제 중 오류 발생: ${kolProductSummaryDeleteError.message}`);
      }

      // 3.3 kol_total_monthly_sales 테이블에서 관련 데이터 삭제
      const { error: kolTotalMonthlySalesDeleteError } = await supabase
        .from('kol_total_monthly_sales')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (kolTotalMonthlySalesDeleteError) {
        throw new Error(`KOL 월간 매출 합계 삭제 중 오류 발생: ${kolTotalMonthlySalesDeleteError.message}`);
      }

      // 3.4 kol_monthly_summary 테이블에서 관련 데이터 삭제
      const { error: kolMonthlySummaryDeleteError } = await supabase
        .from('kol_monthly_summary')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (kolMonthlySummaryDeleteError) {
        throw new Error(`KOL 월간 요약 삭제 중 오류 발생: ${kolMonthlySummaryDeleteError.message}`);
      }

      // 3.5 monthly_sales 테이블에서 관련 데이터 삭제
      const { error: monthlySalesKolDeleteError } = await supabase
        .from('monthly_sales')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (monthlySalesKolDeleteError) {
        throw new Error(`월별 매출 데이터 삭제 중 오류 발생: ${monthlySalesKolDeleteError.message}`);
      }

      // 3.6 commissions 테이블에서 관련 데이터 삭제
      const { error: commissionsKolDeleteError } = await supabase
        .from('commissions')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (commissionsKolDeleteError) {
        throw new Error(`수수료 데이터 삭제 중 오류 발생: ${commissionsKolDeleteError.message}`);
      }


      // kol_dashboard_metrics 테이블에서 관련 데이터 삭제
      const { error: kolMetricsDeleteError } = await supabase
        .from('kol_dashboard_metrics')
        .delete()
        .eq('kol_id', deleteItemId);
        
      if (kolMetricsDeleteError) {
        throw new Error(`KOL 지표 데이터 삭제 중 오류 발생: ${kolMetricsDeleteError.message}`);
      }
    } catch (error) {
      alert(`KOL 지표 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsDeleteModalOpen(false);
      setDeleteItemId(null);
      setDeleteType(null);
      return;
    }

    const { error } = await supabase
      .from('kols')
      .delete()
      .eq('id', deleteItemId);

    if (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } else {
      setIsDeleteModalOpen(false);
      setDeleteItemId(null);
      setDeleteType(null);
      
      // 데이터 다시 로드
      fetchKols();
      // KOL이 삭제되면 해당 KOL의 전문점 정보도 상태에서 제거
      const updatedShopsByKol = { ...shopsByKol };
      delete updatedShopsByKol[deleteItemId];
      setShopsByKol(updatedShopsByKol);
      
      // 현재 선택된 항목이 삭제된 KOL인 경우 선택 해제
      if (selectedEntityType === 'kol' && selectedEntityId === deleteItemId) {
        setSelectedEntityType(null);
        setSelectedEntityId(null);
      }
    }
  };

  // 샵 추가 함수
  const addShop = async (data: { shop_name: string; owner_name: string; kol_id: string; region?: string; email?: string }) => {
    const shopData = {
      shop_name: data.shop_name,
      owner_name: data.owner_name,
      region: data.region || null,
      status: 'active',
      email: data.email || null
    };

    // 1. 먼저 shops 테이블에 기본 정보 추가
    const { data: newShop, error: shopError } = await supabase
      .from('shops')
      .insert([shopData])
      .select();

    if (shopError) {
      throw new Error(`전문점 추가 중 오류 발생: ${shopError.message}`);
    }

    if (!newShop || newShop.length === 0) {
      throw new Error('전문점 추가 후 반환된 데이터가 없습니다.');
    }

    // 2. KOL ID가 제공된 경우, owner_kol_id 설정
    if (data.kol_id && data.kol_id !== '0') {
      const kolId = parseInt(data.kol_id);
      
      // KOL 정보 조회
      const { data: kolData, error: kolError } = await supabase
        .from('kols')
        .select('name, shop_name')
        .eq('id', kolId)
        .single();
        
      if (kolError) {
        console.error('KOL 정보 조회 중 오류 발생:', kolError.message);
      }
      
      // KOL 이름과 샵 운영자 이름이 같으면 자신의 샵으로 간주하여 owner_kol_id 설정
      const isOwnShop = kolData && kolData.name === data.owner_name;
      
      if (isOwnShop) {
        const { error: updateError } = await supabase
          .from('shops')
          .update({ owner_kol_id: kolId })
          .eq('id', newShop[0].id);
          
        if (updateError) {
          throw new Error(`KOL 소유 관계 설정 중 오류 발생: ${updateError.message}`);
        }
      }
    }
    
    // 전문점 목록 새로고침
    await fetchAllShops();
    
    // 현재 확장된 KOL의 ID가 있다면, 그 KOL의 전문점 목록도 업데이트
    if (expandedKolId && data.kol_id === expandedKolId.toString()) {
      await fetchShopsByKol(expandedKolId);
    }
  };

  // 샵 수정 함수
  const updateShop = async (data: { shop_name: string; owner_name: string; kol_id: string; region?: string; email?: string }) => {
    if (!selectedShop) {
      throw new Error('선택된 전문점이 없습니다.');
    }

    // 1. 기본 샵 정보 업데이트
    const { error: shopUpdateError } = await supabase
      .from('shops')
      .update({
        shop_name: data.shop_name,
        owner_name: data.owner_name,
        region: data.region || null,
        email: data.email || null
      })
      .eq('id', selectedShop.id);

    if (shopUpdateError) {
      throw new Error(`전문점 정보 업데이트 중 오류 발생: ${shopUpdateError.message}`);
    }

    // 2. 관계 정보 업데이트
    // 2.1 기존 KOL ID와 새로운 KOL ID 비교
    const newKolId = data.kol_id ? parseInt(data.kol_id) : null;
    const oldKolId = selectedShop.kol_id || null;

    // KOL 관계가 변경된 경우 owner_kol_id 업데이트
    if (newKolId !== oldKolId) {
      let newOwnerKolId = null;
      
      // 새 KOL ID가 있으면 소유 관계 확인
      if (newKolId) {
        // KOL 정보 조회
        const { data: kolData, error: kolError } = await supabase
          .from('kols')
          .select('name, shop_name')
          .eq('id', newKolId)
          .single();
          
        if (kolError) {
          console.error('KOL 정보 조회 중 오류 발생:', kolError.message);
        }
        
        // KOL 이름과 샵 운영자 이름이 같으면 자신의 샵으로 간주
        const isOwnShop = kolData && kolData.name === data.owner_name;
        
        if (isOwnShop) {
          newOwnerKolId = newKolId;
        }
      }
      
      // owner_kol_id 업데이트
      const { error: updateOwnerError } = await supabase
        .from('shops')
        .update({ owner_kol_id: newOwnerKolId })
        .eq('id', selectedShop.id);
        
      if (updateOwnerError) {
        throw new Error(`KOL 소유 관계 업데이트 중 오류 발생: ${updateOwnerError.message}`);
      }
    }

    setSelectedShop(null);
    
    // 전문점 목록 새로고침
    await fetchAllShops();
    
    // 현재 확장된 KOL의 ID가 있다면, 그 KOL의 전문점 목록도 업데이트
    if (expandedKolId) {
      await fetchShopsByKol(expandedKolId);
    }
  };

  // 전문점 삭제 함수
  const deleteShop = async () => {
    if (!deleteItemId) return;

    try {
      // 관련 데이터 삭제 (kol_shops 테이블은 더 이상 사용하지 않음)

      // -1. 먼저 전문점의 주문을 조회하고 각 주문에 대한 수수료 데이터를 삭제
      const { data: relatedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('shop_id', deleteItemId);
        
      if (relatedOrders && relatedOrders.length > 0) {
        for (const order of relatedOrders) {
          const { error: commissionsDeleteError } = await supabase
            .from('commissions')
            .delete()
            .eq('order_id', order.id);
            
          if (commissionsDeleteError) {
            throw new Error(`수수료 데이터 삭제 중 오류 발생: ${commissionsDeleteError.message}`);
          }
        }
      }

      // 0. sales_activities 테이블에서 해당 shop_id를 가진 레코드들을 삭제
      const { error: salesActivitiesDeleteError } = await supabase
        .from('sales_activities')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (salesActivitiesDeleteError) {
        throw new Error(`판매 활동 데이터 삭제 중 오류 발생: ${salesActivitiesDeleteError.message}`);
      }

      // 1. 그 다음 orders 테이블에서 해당 shop_id를 가진 레코드들을 삭제
      const { error: ordersDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (ordersDeleteError) {
        throw new Error(`주문 데이터 삭제 중 오류 발생: ${ordersDeleteError.message}`);
      }

      // 2. 다음으로 monthly_sales 테이블에서 해당 shop_id를 가진 레코드들을 삭제
      const { error: monthlySalesDeleteError } = await supabase
        .from('monthly_sales')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (monthlySalesDeleteError) {
        throw new Error(`월별 매출 데이터 삭제 중 오류 발생: ${monthlySalesDeleteError.message}`);
      }

      // 3. shop_sales_metrics 테이블에서 해당 shop_id를 가진 레코드들 삭제
      const { error: shopSalesMetricsDeleteError } = await supabase
        .from('shop_sales_metrics')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (shopSalesMetricsDeleteError) {
        throw new Error(`전문점 매출 지표 삭제 중 오류 발생: ${shopSalesMetricsDeleteError.message}`);
      }

      // 4. shop_sales_summary 테이블에서 해당 shop_id를 가진 레코드들 삭제
      const { error: shopSalesSummaryDeleteError } = await supabase
        .from('shop_sales_summary')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (shopSalesSummaryDeleteError) {
        throw new Error(`전문점 매출 요약 삭제 중 오류 발생: ${shopSalesSummaryDeleteError.message}`);
      }

      // 5. shop_product_sales 테이블에서 해당 shop_id를 가진 레코드들 삭제
      const { error: shopProductSalesDeleteError } = await supabase
        .from('shop_product_sales')
        .delete()
        .eq('shop_id', deleteItemId);
      
      if (shopProductSalesDeleteError) {
        throw new Error(`전문점 제품 매출 삭제 중 오류 발생: ${shopProductSalesDeleteError.message}`);
      }


      // 3. 전문점 삭제
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', deleteItemId);

      if (error) {
        throw new Error(`전문점 삭제 중 오류 발생: ${error.message}`);
      }

      // 삭제 성공 후 상태 업데이트
      setIsDeleteModalOpen(false);
      setDeleteItemId(null);
      setDeleteType(null);
      
      // 데이터 다시 로드
      await fetchAllShops();
      
      // 현재 확장된 KOL의 ID가 있다면, 그 KOL의 전문점 목록도 업데이트
      if (expandedKolId) {
        await fetchShopsByKol(expandedKolId);
      }
      
      // 현재 선택된 항목이 삭제된 전문점인 경우 선택 해제
      if (selectedEntityType === 'shop' && selectedEntityId === deleteItemId) {
        setSelectedEntityType(null);
        setSelectedEntityId(null);
      }
    } catch (error) {
      alert(`삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsDeleteModalOpen(false);
      setDeleteItemId(null);
      setDeleteType(null);
    }
  };

  // KOL 수정 모달 열기
  const openEditKolModal = (kol: KOL) => {
    setSelectedKol(kol);
    setKolForm({
      name: kol.name,
      shop_name: kol.shop_name,
      region: kol.region || '',
      email: kol.email || ''
    });
    setIsKolModalOpen(true);
  };

  // 전문점 수정 모달 열기
  const openEditShopModal = (shop: Shop) => {
    setSelectedShop(shop);
    setShopForm({
      shop_name: shop.shop_name,
      owner_name: shop.owner_name,
      kol_id: shop.kol_id ? shop.kol_id.toString() : '',
      region: shop.region || '',
      email: shop.email || ''
    });
    setIsShopModalOpen(true);
  };
  
  // KOL 추가 모달 열기
  const openAddKolModal = () => {
    setSelectedKol(null);
    setKolForm({ name: '', shop_name: '', region: '', email: '' });
    setIsKolModalOpen(true);
  };
  
  // 전문점 추가 모달 열기
  const openAddShopModal = (kolId: number) => {
    setSelectedShop(null);
    setShopForm({
      shop_name: '',
      owner_name: '',
      kol_id: String(kolId),
      region: kols.find(k => k.id === kolId)?.region || '',
      email: ''
    });
    setIsShopModalOpen(true);
  };

  // 삭제 모달 열기
  const openDeleteModal = (type: 'kol' | 'shop', id: number) => {
    setDeleteType(type);
    setDeleteItemId(id);
    setIsDeleteModalOpen(true);
    
    // KOL 삭제 시 소속된 전문점 수 확인
    if (type === 'kol') {
      const fetchRelatedShops = async () => {
        if (!supabase) {
          console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
          return;
        }
        
        const { data: relatedShops, error } = await supabase
          .from('shops')
          .select('id')
          .eq('kol_id', id);
          
        if (error) {
          console.error(`KOL ID ${id}의 관련 전문점 조회 중 오류 발생:`, error.message, error.details);
          setRelatedShopsCount(0);
          return;
        }
        
        if (relatedShops && relatedShops.length > 0) {
          setRelatedShopsCount(relatedShops.length);
        } else {
          setRelatedShopsCount(0);
        }
      };
      
      fetchRelatedShops();
    }
  };

  // 삭제 확인 실행
  const confirmDelete = async () => {
    if (deleteType === 'kol') {
      await deleteKol();
    } else if (deleteType === 'shop') {
      await deleteShop();
    }
  };
  
  // 선택된 엔티티 찾기
  const selectedEntity = selectedEntityType === 'kol'
    ? kols.find(k => k.id === selectedEntityId) || null
    : selectedEntityType === 'shop'
      ? shops.find(s => s.id === selectedEntityId) || null
      : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">KOL 및 전문점 관리</h1>
        <div className="flex space-x-2">
          <button
            onClick={openAddKolModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusCircle size={16} className="mr-2" />
            KOL 추가
          </button>
          <button
            onClick={() => {
              setSelectedShop(null);
              setShopForm({ shop_name: '', owner_name: '', kol_id: '', region: '', email: '' });
              setIsShopModalOpen(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusCircle size={16} className="mr-2" />
            전문점 추가
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center bg-white shadow rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
          {/* 사이드바 컴포넌트 */}
          <EntitySidebar
            kols={kols}
            shopsByKol={shopsByKol}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedKolId={expandedKolId}
            toggleKol={toggleKol}
            onSelectKol={handleSelectKol}
            onSelectShop={handleSelectShop}
            openAddKolModal={openAddKolModal}
            openAddShopModal={openAddShopModal}
            openEditKolModal={openEditKolModal}
            openEditShopModal={openEditShopModal}
            openDeleteModal={openDeleteModal}
            selectedEntityId={selectedEntityId}
            selectedEntityType={selectedEntityType}
          />
          
          {/* 메인 테이블 컴포넌트 */}
          <div className="flex-1 overflow-auto">
            <EntityTable
              selectedEntityType={selectedEntityType}
              selectedEntity={selectedEntity}
              kols={kols}
              openEditKolModal={openEditKolModal}
              openEditShopModal={openEditShopModal}
              openDeleteModal={openDeleteModal}
            />
          </div>
        </div>
      )}

      {/* 모달 컴포넌트들 */}
      <KolModal 
        isOpen={isKolModalOpen}
        onClose={() => setIsKolModalOpen(false)}
        selectedKol={selectedKol}
        onSubmit={selectedKol ? updateKol : addKol}
      />
      
      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        selectedShop={selectedShop}
        onSubmit={selectedShop ? updateShop : addShop}
        kols={kols}
      />
      
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteItemId(null);
          setDeleteType(null);
        }}
        deleteType={deleteType}
        confirmDelete={confirmDelete}
        relatedShopsCount={relatedShopsCount}
      />
    </div>
  );
} 