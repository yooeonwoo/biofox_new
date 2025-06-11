'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronDown, ChevronRight, Save, Plus } from 'lucide-react';

// 인라인 스타일 상수
const tableHeaderStyle = "px-4 py-2 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider";
const tableCellStyle = "px-4 py-2 whitespace-nowrap text-sm text-gray-700 border-b";
const inputStyle = "w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

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
};

type ShopSalesMetrics = {
  id?: number;
  shop_id: number;
  year_month: string;
  total_sales: number;
  product_sales: number;
  device_sales: number;
  commission: number;
};

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ShopDataEntryPage() {
  const [kols, setKols] = useState<KOL[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedKOL, setSelectedKOL] = useState<number | null>(null);
  const [expandedKOLs, setExpandedKOLs] = useState<number[]>([]);
  const [yearMonth, setYearMonth] = useState('202505'); // 기본값 설정
  const [shopSalesData, setShopSalesData] = useState<{[key: number]: ShopSalesMetrics}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{[key: number]: 'saved' | 'unsaved' | 'saving'}>({});

  // KOL 목록 및 관련 데이터 로드
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // KOL 목록 가져오기
        const { data: kolData, error: kolError } = await supabase
          .from('kols')
          .select('id, name, shop_name')
          .order('id');
        
        if (kolError) throw kolError;
        setKols(kolData || []);
        
        // 매장 정보 가져오기
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('id, shop_name, owner_name, kol_id');
        
        if (shopError) throw shopError;
        setShops(shopData || []);
        
        // 매장 매출 데이터 가져오기
        const { data: salesData, error: salesError } = await supabase
          .from('shop_sales_metrics')
          .select('*')
          .eq('year_month', yearMonth);
        
        if (salesError) throw salesError;
        
        // 데이터를 매장 ID로 인덱싱
        const indexedData: {[key: number]: ShopSalesMetrics} = {};
        salesData?.forEach(item => {
          indexedData[item.shop_id] = item;
        });
        
        setShopSalesData(indexedData);
        
        // 기본 저장 상태 설정
        const newSaveStatus: {[key: number]: 'saved' | 'unsaved' | 'saving'} = {};
        shopData?.forEach(shop => {
          newSaveStatus[shop.id] = indexedData[shop.id] ? 'saved' : 'unsaved';
        });
        
        setSaveStatus(newSaveStatus);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [yearMonth]);

  // KOL 확장/축소 토글
  const toggleKOL = (kolId: number) => {
    if (expandedKOLs.includes(kolId)) {
      setExpandedKOLs(expandedKOLs.filter(id => id !== kolId));
    } else {
      setExpandedKOLs([...expandedKOLs, kolId]);
    }
    setSelectedKOL(kolId);
  };

  // 데이터 변경 핸들러
  const handleDataChange = (shopId: number, field: keyof ShopSalesMetrics, value: number) => {
    setShopSalesData(prev => ({
      ...prev,
      [shopId]: {
        ...prev[shopId] || {
          shop_id: shopId,
          year_month: yearMonth,
          total_sales: 0,
          product_sales: 0,
          device_sales: 0,
          commission: 0
        },
        [field]: value
      }
    }));
    
    setSaveStatus(prev => ({
      ...prev,
      [shopId]: 'unsaved'
    }));
  };

  // 데이터 저장 핸들러
  const saveShopData = async (shopId: number) => {
    try {
      setSaveStatus(prev => ({
        ...prev,
        [shopId]: 'saving'
      }));
      
      const dataToSave = shopSalesData[shopId];
      
      // 이미 존재하는 데이터인지 확인
      const { data: existingData, error: checkError } = await supabase
        .from('shop_sales_metrics')
        .select('id')
        .eq('shop_id', shopId)
        .eq('year_month', yearMonth)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingData?.id) {
        // 업데이트
        const { error: updateError } = await supabase
          .from('shop_sales_metrics')
          .update({
            total_sales: dataToSave.total_sales,
            product_sales: dataToSave.product_sales,
            device_sales: dataToSave.device_sales,
            commission: dataToSave.commission
          })
          .eq('id', existingData.id);
        
        if (updateError) throw updateError;
      } else {
        // 새로 생성
        const { error: insertError } = await supabase
          .from('shop_sales_metrics')
          .insert([dataToSave]);
        
        if (insertError) throw insertError;
      }
      
      setSaveStatus(prev => ({
        ...prev,
        [shopId]: 'saved'
      }));
      
      alert(`매장 ID ${shopId}의 데이터가 저장되었습니다.`);
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      alert('데이터 저장 중 오류가 발생했습니다.');
      
      setSaveStatus(prev => ({
        ...prev,
        [shopId]: 'unsaved'
      }));
    }
  };

  // 연월 변경 핸들러
  const handleYearMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearMonth(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">전문점 매출 데이터 입력</h1>
      
      {/* 연월 선택 */}
      <div className="mb-6">
        <label htmlFor="yearMonth" className="block text-sm font-medium text-gray-700 mb-1">기준 연월:</label>
        <select 
          id="yearMonth"
          value={yearMonth}
          onChange={handleYearMonthChange}
          className="border rounded p-2 w-40"
        >
          <option value="202501">2025년 1월</option>
          <option value="202502">2025년 2월</option>
          <option value="202503">2025년 3월</option>
          <option value="202504">2025년 4월</option>
          <option value="202505">2025년 5월</option>
          <option value="202506">2025년 6월</option>
        </select>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* 왼쪽 사이드바 */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">KOL 목록</h2>
          <ul className="space-y-1">
            {kols.map(kol => (
              <li key={kol.id}>
                <button 
                  onClick={() => toggleKOL(kol.id)}
                  className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100"
                >
                  {expandedKOLs.includes(kol.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="ml-2">{kol.shop_name} / {kol.name}</span>
                </button>
                
                {expandedKOLs.includes(kol.id) && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {shops
                      .filter(shop => shop.kol_id === kol.id)
                      .map(shop => (
                        <li key={shop.id}>
                          <button
                            onClick={() => setSelectedKOL(kol.id)}
                            className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100"
                          >
                            <span className="text-sm">{shop.shop_name}</span>
                            {saveStatus[shop.id] === 'unsaved' && (
                              <span className="ml-auto text-xs text-red-500">저장 필요</span>
                            )}
                          </button>
                        </li>
                      ))
                    }
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* 오른쪽 내용 */}
        <div className="w-full md:flex-1 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-200px)] overflow-y-auto">
          {selectedKOL ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                {kols.find(k => k.id === selectedKOL)?.shop_name} / {kols.find(k => k.id === selectedKOL)?.name} 소속 전문점
              </h2>
              
              {shops.filter(shop => shop.kol_id === selectedKOL).length > 0 ? (
                <div className="space-y-6">
                  {shops
                    .filter(shop => shop.kol_id === selectedKOL)
                    .map(shop => (
                      <div key={shop.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-md font-medium">{shop.shop_name} (소유자: {shop.owner_name})</h3>
                          <button
                            onClick={() => saveShopData(shop.id)}
                            disabled={saveStatus[shop.id] === 'saving' || saveStatus[shop.id] === 'saved'}
                            className={`flex items-center px-4 py-2 rounded ${
                              saveStatus[shop.id] === 'saved' 
                                ? 'bg-green-100 text-green-700' 
                                : saveStatus[shop.id] === 'saving'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            <Save size={16} className="mr-2" />
                            {saveStatus[shop.id] === 'saved' 
                              ? '저장됨' 
                              : saveStatus[shop.id] === 'saving'
                                ? '저장 중...'
                                : '저장하기'}
                          </button>
                        </div>
                        
                        <table className="min-w-full">
                          <thead>
                            <tr>
                              <th className={tableHeaderStyle}>항목</th>
                              <th className={tableHeaderStyle}>값</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className={tableCellStyle}>총 매출 (₩)</td>
                              <td className={tableCellStyle}>
                                <input
                                  type="number"
                                  value={shopSalesData[shop.id]?.total_sales || 0}
                                  onChange={(e) => handleDataChange(shop.id, 'total_sales', Number(e.target.value))}
                                  className={inputStyle}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className={tableCellStyle}>제품 매출 (₩)</td>
                              <td className={tableCellStyle}>
                                <input
                                  type="number"
                                  value={shopSalesData[shop.id]?.product_sales || 0}
                                  onChange={(e) => handleDataChange(shop.id, 'product_sales', Number(e.target.value))}
                                  className={inputStyle}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className={tableCellStyle}>장비 매출 (₩)</td>
                              <td className={tableCellStyle}>
                                <input
                                  type="number"
                                  value={shopSalesData[shop.id]?.device_sales || 0}
                                  onChange={(e) => handleDataChange(shop.id, 'device_sales', Number(e.target.value))}
                                  className={inputStyle}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className={tableCellStyle}>수당 (₩)</td>
                              <td className={tableCellStyle}>
                                <input
                                  type="number"
                                  value={shopSalesData[shop.id]?.commission || 0}
                                  onChange={(e) => handleDataChange(shop.id, 'commission', Number(e.target.value))}
                                  className={inputStyle}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-gray-500 italic">소속 전문점이 없습니다.</p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>왼쪽 목록에서 KOL을 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 