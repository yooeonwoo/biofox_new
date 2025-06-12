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

type KOLMonthlyData = {
  id?: number;
  kol_id: number;
  year_month: string;
  total_sales: number;
  product_sales: number;
  device_sales: number;
  total_commission: number;
  total_active_shops: number;
  total_shops: number;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id: number;
};

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function KOLDataEntry() {
  const [kols, setKols] = useState<KOL[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedKOL, setSelectedKOL] = useState<number | null>(null);
  const [expandedKOLs, setExpandedKOLs] = useState<number[]>([]);
  const [yearMonth, setYearMonth] = useState('202505'); // 기본값 설정
  const [kolMonthlyData, setKolMonthlyData] = useState<{[key: number]: KOLMonthlyData}>({});
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
        
        // KOL 월별 데이터 가져오기
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('kol_total_monthly_sales')
          .select('*')
          .eq('year_month', yearMonth);
        
        if (monthlyError) throw monthlyError;
        
        // 데이터를 KOL ID로 인덱싱
        const indexedData: {[key: number]: KOLMonthlyData} = {};
        monthlyData?.forEach(item => {
          indexedData[item.kol_id] = item;
        });
        
        setKolMonthlyData(indexedData);
        
        // KOL 중 월별 데이터가 없는 경우 기본 템플릿 생성
        const newSaveStatus: {[key: number]: 'saved' | 'unsaved' | 'saving'} = {};
        kolData?.forEach(kol => {
          if (!indexedData[kol.id]) {
            indexedData[kol.id] = {
              kol_id: kol.id,
              year_month: yearMonth,
              total_sales: 0,
              product_sales: 0,
              device_sales: 0,
              total_commission: 0,
              total_active_shops: 0,
              total_shops: shops.filter(shop => shop.kol_id === kol.id).length
            };
            newSaveStatus[kol.id] = 'unsaved';
          } else {
            newSaveStatus[kol.id] = 'saved';
          }
        });
        
        setKolMonthlyData(indexedData);
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
  const handleDataChange = (kolId: number, field: keyof KOLMonthlyData, value: number) => {
    setKolMonthlyData(prev => ({
      ...prev,
      [kolId]: {
        ...prev[kolId],
        [field]: value
      }
    }));
    
    setSaveStatus(prev => ({
      ...prev,
      [kolId]: 'unsaved'
    }));
  };

  // 데이터 저장 핸들러
  const saveKolData = async (kolId: number) => {
    try {
      setSaveStatus(prev => ({
        ...prev,
        [kolId]: 'saving'
      }));
      
      const dataToSave = kolMonthlyData[kolId];
      
      // 1. kol_total_monthly_sales 테이블 처리
      // 이미 존재하는 데이터인지 확인
      const { data: existingData, error: checkError } = await supabase
        .from('kol_total_monthly_sales')
        .select('id')
        .eq('kol_id', kolId)
        .eq('year_month', yearMonth)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingData?.id) {
        // 업데이트
        const { error: updateError } = await supabase
          .from('kol_total_monthly_sales')
          .update({
            total_sales: dataToSave.total_sales,
            product_sales: dataToSave.product_sales,
            device_sales: dataToSave.device_sales,
            total_commission: dataToSave.total_commission,
            total_active_shops: dataToSave.total_active_shops,
            total_shops: dataToSave.total_shops
          })
          .eq('id', existingData.id);
        
        if (updateError) throw updateError;
      } else {
        // 새로 생성
        const { error: insertError } = await supabase
          .from('kol_total_monthly_sales')
          .insert([dataToSave]);
        
        if (insertError) throw insertError;
      }

      // 2. kol_dashboard_metrics 테이블 처리 (YYYY-MM 형식으로 변환)
      const dashboardYearMonth = yearMonth.length === 6 
        ? `${yearMonth.substring(0, 4)}-${yearMonth.substring(4, 6)}`
        : yearMonth;

      // kol_dashboard_metrics 데이터 확인
      const { data: existingDashboardData, error: dashboardCheckError } = await supabase
        .from('kol_dashboard_metrics')
        .select('id')
        .eq('kol_id', kolId)
        .eq('year_month', dashboardYearMonth)
        .maybeSingle();
      
      if (dashboardCheckError) throw dashboardCheckError;

      const dashboardDataToSave = {
        kol_id: kolId,
        year_month: dashboardYearMonth,
        monthly_sales: dataToSave.total_sales,
        monthly_commission: dataToSave.total_commission,
        total_shops_count: dataToSave.total_shops,
        active_shops_count: dataToSave.total_active_shops
      };

      if (existingDashboardData?.id) {
        // kol_dashboard_metrics 업데이트
        const { error: dashboardUpdateError } = await supabase
          .from('kol_dashboard_metrics')
          .update(dashboardDataToSave)
          .eq('id', existingDashboardData.id);
        
        if (dashboardUpdateError) throw dashboardUpdateError;
      } else {
        // kol_dashboard_metrics 새로 생성
        const { error: dashboardInsertError } = await supabase
          .from('kol_dashboard_metrics')
          .insert([dashboardDataToSave]);
        
        if (dashboardInsertError) throw dashboardInsertError;
      }
      
      setSaveStatus(prev => ({
        ...prev,
        [kolId]: 'saved'
      }));
      
      alert(`KOL ID ${kolId}의 데이터가 두 테이블에 모두 저장되었습니다.`);
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      alert('데이터 저장 중 오류가 발생했습니다.');
      
      setSaveStatus(prev => ({
        ...prev,
        [kolId]: 'unsaved'
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
    <>
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
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-300px)] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">KOL 목록</h2>
          <ul>
            {kols.map(kol => (
              <li key={kol.id} className="mb-1">
                <button 
                  onClick={() => toggleKOL(kol.id)}
                  className={`flex items-center w-full text-left p-2 rounded hover:bg-gray-100 ${selectedKOL === kol.id ? 'bg-blue-50' : ''}`}
                >
                  {expandedKOLs.includes(kol.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="ml-2">{kol.shop_name} / {kol.name}</span>
                  {saveStatus[kol.id] === 'unsaved' && (
                    <span className="ml-auto text-xs text-red-500">저장 필요</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* 오른쪽 내용 */}
        <div className="w-full md:flex-1 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-300px)] overflow-y-auto">
          {selectedKOL ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {kols.find(k => k.id === selectedKOL)?.shop_name} / {kols.find(k => k.id === selectedKOL)?.name} 데이터
                </h2>
                <button
                  onClick={() => saveKolData(selectedKOL)}
                  disabled={saveStatus[selectedKOL] === 'saving' || saveStatus[selectedKOL] === 'saved'}
                  className={`flex items-center px-4 py-2 rounded ${
                    saveStatus[selectedKOL] === 'saved' 
                      ? 'bg-green-100 text-green-700' 
                      : saveStatus[selectedKOL] === 'saving'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Save size={16} className="mr-2" />
                  {saveStatus[selectedKOL] === 'saved' 
                    ? '저장됨' 
                    : saveStatus[selectedKOL] === 'saving'
                      ? '저장 중...'
                      : '저장하기'}
                </button>
              </div>
              
              {/* KOL 데이터 테이블 */}
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
                        value={kolMonthlyData[selectedKOL]?.total_sales || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'total_sales', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className={tableCellStyle}>제품 매출 (₩)</td>
                    <td className={tableCellStyle}>
                      <input
                        type="number"
                        value={kolMonthlyData[selectedKOL]?.product_sales || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'product_sales', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className={tableCellStyle}>장비 매출 (₩)</td>
                    <td className={tableCellStyle}>
                      <input
                        type="number"
                        value={kolMonthlyData[selectedKOL]?.device_sales || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'device_sales', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className={tableCellStyle}>총 수당 (₩)</td>
                    <td className={tableCellStyle}>
                      <input
                        type="number"
                        value={kolMonthlyData[selectedKOL]?.total_commission || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'total_commission', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className={tableCellStyle}>활성 전문점 수</td>
                    <td className={tableCellStyle}>
                      <input
                        type="number"
                        value={kolMonthlyData[selectedKOL]?.total_active_shops || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'total_active_shops', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className={tableCellStyle}>총 전문점 수</td>
                    <td className={tableCellStyle}>
                      <input
                        type="number"
                        value={kolMonthlyData[selectedKOL]?.total_shops || 0}
                        onChange={(e) => handleDataChange(selectedKOL, 'total_shops', Number(e.target.value))}
                        className={inputStyle}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* 소속 전문점 목록 */}
              <div className="mt-8">
                <h3 className="text-md font-semibold mb-2">소속 전문점 목록</h3>
                {shops.filter(shop => shop.kol_id === selectedKOL).length > 0 ? (
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className={tableHeaderStyle}>ID</th>
                        <th className={tableHeaderStyle}>전문점명</th>
                        <th className={tableHeaderStyle}>소유자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shops
                        .filter(shop => shop.kol_id === selectedKOL)
                        .map(shop => (
                          <tr key={shop.id}>
                            <td className={tableCellStyle}>{shop.id}</td>
                            <td className={tableCellStyle}>{shop.shop_name}</td>
                            <td className={tableCellStyle}>{shop.owner_name}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">소속 전문점이 없습니다.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>왼쪽 목록에서 KOL을 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 