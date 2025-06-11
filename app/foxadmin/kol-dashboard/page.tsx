'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

// 인라인 스타일 상수
const tableHeaderStyle = "px-4 py-2 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider";
const tableCellStyle = "px-4 py-2 whitespace-nowrap text-sm text-gray-700 border-b";

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

export default function KOLDashboardPage() {
  const [kols, setKols] = useState<KOL[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedKOL, setSelectedKOL] = useState<number | null>(null);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [expandedKOLs, setExpandedKOLs] = useState<number[]>([]);
  const [yearMonth, setYearMonth] = useState('202505'); // 기본값 설정
  const [kolMonthlyData, setKolMonthlyData] = useState<{[key: number]: KOLMonthlyData}>({});
  const [shopSalesData, setShopSalesData] = useState<{[key: number]: ShopSalesMetrics}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
        const indexedKolData: {[key: number]: KOLMonthlyData} = {};
        monthlyData?.forEach(item => {
          indexedKolData[item.kol_id] = item;
        });
        
        setKolMonthlyData(indexedKolData);
        
        // 매장 매출 데이터 가져오기
        const { data: salesData, error: salesError } = await supabase
          .from('shop_sales_metrics')
          .select('*')
          .eq('year_month', yearMonth);
        
        if (salesError) throw salesError;
        
        // 데이터를 매장 ID로 인덱싱
        const indexedShopData: {[key: number]: ShopSalesMetrics} = {};
        salesData?.forEach(item => {
          indexedShopData[item.shop_id] = item;
        });
        
        setShopSalesData(indexedShopData);
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
    setSelectedShop(null);
  };

  // 전문점 선택 핸들러
  const selectShop = (shopId: number) => {
    setSelectedShop(shopId);
  };

  // 연월 변경 핸들러
  const handleYearMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearMonth(e.target.value);
  };

  // 검색 필터링
  const filteredKols = kols.filter(kol => 
    kol.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    kol.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 금액 포맷
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
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
      <h1 className="text-2xl font-bold mb-6">KOL 및 전문점 현황</h1>
      
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
          {/* 검색 상자 */}
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="KOL 또는 상점 검색..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <h2 className="text-lg font-semibold mb-4">KOL 및 전문점 목록</h2>
          <ul className="space-y-1">
            {filteredKols.map(kol => (
              <li key={kol.id}>
                <button 
                  onClick={() => toggleKOL(kol.id)}
                  className={`flex items-center w-full text-left p-2 rounded hover:bg-gray-100 ${selectedKOL === kol.id && !selectedShop ? 'bg-blue-50' : ''}`}
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
                            onClick={() => selectShop(shop.id)}
                            className={`flex items-center w-full text-left p-2 rounded hover:bg-gray-100 ${selectedShop === shop.id ? 'bg-blue-50' : ''}`}
                          >
                            <span className="text-sm">{shop.shop_name}</span>
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
        
        {/* 오른쪽 내용 - 데이터 표시 */}
        <div className="w-full md:flex-1 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-200px)] overflow-y-auto">
          {selectedKOL && !selectedShop ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                {kols.find(k => k.id === selectedKOL)?.shop_name} / {kols.find(k => k.id === selectedKOL)?.name} 현황
              </h2>
              
              {/* KOL 데이터 테이블 */}
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium mb-3">월별 종합 지표</h3>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className={tableHeaderStyle}>지표</th>
                      <th className={tableHeaderStyle}>값</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={tableCellStyle}>총 매출</td>
                      <td className={tableCellStyle}>{formatCurrency(kolMonthlyData[selectedKOL]?.total_sales || 0)}</td>
                    </tr>
                    <tr>
                      <td className={tableCellStyle}>제품 매출</td>
                      <td className={tableCellStyle}>{formatCurrency(kolMonthlyData[selectedKOL]?.product_sales || 0)}</td>
                    </tr>
                    <tr>
                      <td className={tableCellStyle}>장비 매출</td>
                      <td className={tableCellStyle}>{formatCurrency(kolMonthlyData[selectedKOL]?.device_sales || 0)}</td>
                    </tr>
                    <tr>
                      <td className={tableCellStyle}>총 수당</td>
                      <td className={tableCellStyle}>{formatCurrency(kolMonthlyData[selectedKOL]?.total_commission || 0)}</td>
                    </tr>
                    <tr>
                      <td className={tableCellStyle}>활성 전문점 수</td>
                      <td className={tableCellStyle}>{kolMonthlyData[selectedKOL]?.total_active_shops || 0}</td>
                    </tr>
                    <tr>
                      <td className={tableCellStyle}>총 전문점 수</td>
                      <td className={tableCellStyle}>{kolMonthlyData[selectedKOL]?.total_shops || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* 소속 전문점 목록 */}
              <div>
                <h3 className="text-md font-medium mb-3">소속 전문점 목록</h3>
                {shops.filter(shop => shop.kol_id === selectedKOL).length > 0 ? (
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className={tableHeaderStyle}>전문점명</th>
                        <th className={tableHeaderStyle}>소유자</th>
                        <th className={tableHeaderStyle}>총 매출</th>
                        <th className={tableHeaderStyle}>제품 매출</th>
                        <th className={tableHeaderStyle}>장비 매출</th>
                        <th className={tableHeaderStyle}>수당</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shops
                        .filter(shop => shop.kol_id === selectedKOL)
                        .map(shop => (
                          <tr key={shop.id}>
                            <td className={tableCellStyle}>{shop.shop_name}</td>
                            <td className={tableCellStyle}>{shop.owner_name}</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[shop.id]?.total_sales || 0)}</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[shop.id]?.product_sales || 0)}</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[shop.id]?.device_sales || 0)}</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[shop.id]?.commission || 0)}</td>
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
          ) : selectedShop ? (
            <>
              {/* 선택된 전문점 데이터 */}
              {(() => {
                const shop = shops.find(s => s.id === selectedShop);
                if (!shop) return <p className="text-red-500">전문점 데이터를 찾을 수 없습니다.</p>;
                
                const kol = kols.find(k => k.id === shop.kol_id);
                return (
                  <>
                    <h2 className="text-lg font-semibold mb-4">
                      {shop.shop_name} (소유자: {shop.owner_name})
                    </h2>
                    <p className="text-gray-600 mb-4">소속 KOL: {kol?.shop_name} / {kol?.name}</p>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="text-md font-medium mb-3">월별 매출 지표</h3>
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className={tableHeaderStyle}>지표</th>
                            <th className={tableHeaderStyle}>값</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className={tableCellStyle}>총 매출</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[selectedShop]?.total_sales || 0)}</td>
                          </tr>
                          <tr>
                            <td className={tableCellStyle}>제품 매출</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[selectedShop]?.product_sales || 0)}</td>
                          </tr>
                          <tr>
                            <td className={tableCellStyle}>장비 매출</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[selectedShop]?.device_sales || 0)}</td>
                          </tr>
                          <tr>
                            <td className={tableCellStyle}>수당</td>
                            <td className={tableCellStyle}>{formatCurrency(shopSalesData[selectedShop]?.commission || 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>왼쪽 목록에서 KOL 또는 전문점을 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 