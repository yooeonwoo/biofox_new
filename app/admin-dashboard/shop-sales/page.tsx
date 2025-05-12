"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Store, Save, ChevronDown, ChevronRight } from 'lucide-react';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id: number;
  region: string;
};

type ShopSalesMetric = {
  id?: number;
  shop_id: number;
  year_month: string;
  total_sales: number;
  product_sales: number;
  device_sales: number;
  commission: number;
  isDirty?: boolean;  // 변경 여부 추적
};

// 전문점 매출 관리 페이지
export default function ShopSalesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const [kols, setKols] = useState<KOL[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [yearMonth, setYearMonth] = useState<string>('');
  const [shopSalesData, setShopSalesData] = useState<ShopSalesMetric[]>([]);
  const [expandedKolId, setExpandedKolId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState('');

  // 현재 년월 설정 (기본값)
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setYearMonth(`${year}-${month}`);
  }, []);

  // KOL 목록 조회
  const fetchKols = async () => {
    const { data } = await supabase
      .from('kols')
      .select('id, name, shop_name')
      .order('id');
    
    if (data) {
      setKols(data);
    }
  };

  // 전문점 목록 조회
  const fetchShops = async (kolId: number) => {
    const { data } = await supabase
      .from('shops')
      .select('id, shop_name, owner_name, kol_id, region')
      .eq('kol_id', kolId)
      .order('shop_name');
    
    if (data) {
      setShops(data);
      return data;
    }
    return [];
  };

  // 전문점 매출 데이터 조회
  const fetchShopSalesData = async (kolId: number, yearMonth: string) => {
    setIsLoading(true);
    
    // 해당 KOL의 모든 전문점 조회
    const shopsData = await fetchShops(kolId);
    
    if (!shopsData || shopsData.length === 0) {
      setShopSalesData([]);
      setIsLoading(false);
      return;
    }

    const shopIds = shopsData.map(shop => shop.id);
    
    // 매출 데이터 조회
    const { data: salesData } = await supabase
      .from('shop_sales_metrics')
      .select('*')
      .in('shop_id', shopIds)
      .eq('year_month', yearMonth);
    
    // 모든 전문점에 대한 매출 데이터 준비
    const allShopSalesData = shopsData.map(shop => {
      // 기존 데이터 찾기
      const existingData = salesData?.find(d => d.shop_id === shop.id);
      
      if (existingData) {
        return {
          ...existingData,
          isDirty: false
        };
      } else {
        // 없으면 기본 데이터 생성
        return {
          shop_id: shop.id,
          year_month: yearMonth,
          total_sales: 0,
          product_sales: 0,
          device_sales: 0,
          commission: 0,
          isDirty: false
        };
      }
    });
    
    setShopSalesData(allShopSalesData);
    setIsLoading(false);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchKols();
  }, []);

  // KOL 확장 토글
  const toggleKol = (kolId: number) => {
    if (expandedKolId === kolId) {
      setExpandedKolId(null);
    } else {
      setExpandedKolId(kolId);
      setSelectedKolId(kolId);
      fetchShopSalesData(kolId, yearMonth);
    }
  };

  // 연월 변경 시 데이터 다시 조회
  useEffect(() => {
    if (selectedKolId && yearMonth) {
      fetchShopSalesData(selectedKolId, yearMonth);
    }
  }, [yearMonth]);

  // 매출 데이터 업데이트
  const updateShopSalesField = (shopId: number, field: string, value: number) => {
    setShopSalesData(prevData => 
      prevData.map(item => {
        if (item.shop_id === shopId) {
          // 총 매출 자동 계산 (제품 + 기기)
          if (field === 'product_sales' || field === 'device_sales') {
            const otherField = field === 'product_sales' ? 'device_sales' : 'product_sales';
            const otherValue = item[otherField as keyof ShopSalesMetric] as number;
            return {
              ...item,
              [field]: value,
              total_sales: value + otherValue,
              isDirty: true
            };
          }
          
          return {
            ...item,
            [field]: value,
            isDirty: true
          };
        }
        return item;
      })
    );
  };

  // 모든 변경사항 저장
  const saveAllChanges = async () => {
    setSavingStatus('저장 중...');

    try {
      // 변경된 데이터만 필터링
      const dirtyData = shopSalesData.filter(data => data.isDirty);
      
      if (dirtyData.length === 0) {
        setSavingStatus('변경사항이 없습니다');
        setTimeout(() => setSavingStatus(''), 2000);
        return;
      }

      // 새로운 데이터와 업데이트할 데이터 분리
      const newData = dirtyData.filter(data => !data.id);
      const updateData = dirtyData.filter(data => data.id);

      // 새 데이터 추가
      if (newData.length > 0) {
        const dataToInsert = newData.map(({ isDirty, ...data }) => data);
        const { error: insertError } = await supabase
          .from('shop_sales_metrics')
          .insert(dataToInsert);

        if (insertError) throw new Error(`새 데이터 추가 오류: ${insertError.message}`);
      }

      // 기존 데이터 업데이트
      for (const item of updateData) {
        const { isDirty, id, ...dataToUpdate } = item;
        const { error: updateError } = await supabase
          .from('shop_sales_metrics')
          .update(dataToUpdate)
          .eq('id', id);

        if (updateError) throw new Error(`데이터 업데이트 오류: ${updateError.message}`);
      }

      // 성공 후 데이터 다시 로드
      if (selectedKolId) {
        await fetchShopSalesData(selectedKolId, yearMonth);
      }

      setSavingStatus('저장 완료!');
      setTimeout(() => setSavingStatus(''), 2000);
    } catch (error) {
      setSavingStatus(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTimeout(() => setSavingStatus(''), 5000);
    }
  };

  // 매장 이름 찾기
  const getShopName = (shopId: number) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.shop_name : `매장 #${shopId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">전문점 매출 관리</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2">
            <Calendar size={20} className="text-gray-400 mr-2" />
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="border-none focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={saveAllChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            disabled={!shopSalesData.some(data => data.isDirty)}
          >
            <Save size={16} className="mr-2" />
            변경사항 저장
          </button>
        </div>
      </div>

      {savingStatus && (
        <div className={`p-2 rounded-md text-center text-sm ${
          savingStatus.includes('오류') 
            ? 'bg-red-100 text-red-700' 
            : savingStatus.includes('완료') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
        }`}>
          {savingStatus}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* KOL 목록과 전문점 트리 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">KOL 및 전문점 목록</h3>
          
          <div className="space-y-2">
            {kols.map((kol) => (
              <div key={kol.id} className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => toggleKol(kol.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center">
                    {expandedKolId === kol.id ? (
                      <ChevronDown size={18} className="text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400 mr-2" />
                    )}
                    <div>
                      <div className="font-medium">{kol.name}</div>
                      <div className="text-sm text-gray-500">{kol.shop_name}</div>
                    </div>
                  </div>
                </button>
                
                {expandedKolId === kol.id && (
                  <div className="border-t border-gray-200 pl-10 pr-3 py-2">
                    {isLoading ? (
                      <div className="text-center text-sm text-gray-500 py-2">로딩 중...</div>
                    ) : shops.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-2">전문점 없음</div>
                    ) : (
                      <ul className="space-y-1">
                        {shops.map((shop) => (
                          <li key={shop.id} className="flex items-center py-1">
                            <Store size={14} className="text-gray-400 mr-2" />
                            <span className="text-sm">{shop.shop_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({shop.owner_name})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 매출 데이터 테이블 */}
        {selectedKolId && expandedKolId && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전문점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    년월
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제품 매출 (원)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기기 매출 (원)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 매출 (원)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수수료 (원)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : shopSalesData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  shopSalesData.map((data) => (
                    <tr key={data.shop_id} className={data.isDirty ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getShopName(data.shop_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.year_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="number"
                          value={data.product_sales}
                          onChange={(e) => updateShopSalesField(data.shop_id, 'product_sales', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="number"
                          value={data.device_sales}
                          onChange={(e) => updateShopSalesField(data.shop_id, 'device_sales', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('ko-KR').format(data.total_sales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="number"
                          value={data.commission}
                          onChange={(e) => updateShopSalesField(data.shop_id, 'commission', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 