"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, PieChart, Search, Save, Plus } from 'lucide-react';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  is_device: boolean;
  category: string;
};

type ProductSalesMetric = {
  id?: number;
  kol_id: number;
  product_id: number;
  year_month: string;
  quantity: number;
  sales_amount: number;
  sales_ratio: number;
  productName?: string; // UI 표시용
  productPrice?: number; // UI 표시용
  isDirty?: boolean; // 변경 여부 추적
};

// 제품 매출 비율 관리 페이지
export default function ProductSalesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const [kols, setKols] = useState<KOL[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [yearMonth, setYearMonth] = useState<string>('');
  const [productSalesData, setProductSalesData] = useState<ProductSalesMetric[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingStatus, setSavingStatus] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

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

  // 제품 목록 조회
  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, is_device, category')
      .eq('status', 'active')
      .order('name');
    
    if (data) {
      setProducts(data);
    }
  };

  // 제품 매출 데이터 조회
  const fetchProductSalesData = async (kolId: number, yearMonth: string) => {
    setIsLoading(true);
    
    // 제품 목록이 없으면 먼저 조회
    if (products.length === 0) {
      await fetchProducts();
    }
    
    // 매출 데이터 조회
    const { data: salesData } = await supabase
      .from('product_sales_metrics')
      .select('*')
      .eq('kol_id', kolId)
      .eq('year_month', yearMonth);
    
    // 제품 정보와 매출 데이터 결합
    const enrichedSalesData = salesData?.map(data => {
      const product = products.find(p => p.id === data.product_id);
      return {
        ...data,
        productName: product?.name || `제품 #${data.product_id}`,
        productPrice: product?.price || 0,
        isDirty: false
      };
    }) || [];
    
    // 총 매출액 계산
    const totalSalesAmount = enrichedSalesData.reduce((sum, item) => sum + item.sales_amount, 0);
    setTotalSales(totalSalesAmount);
    
    setProductSalesData(enrichedSalesData);
    setIsLoading(false);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchKols();
    fetchProducts();
  }, []);

  // 선택된 KOL 또는 년월이 바뀔 때 데이터 다시 조회
  useEffect(() => {
    if (selectedKolId && yearMonth) {
      fetchProductSalesData(selectedKolId, yearMonth);
    }
  }, [selectedKolId, yearMonth]);

  // 제품 수량 업데이트
  const updateProductQuantity = (productId: number, quantity: number) => {
    setProductSalesData(prevData => {
      // 해당 제품 찾기
      const productIndex = prevData.findIndex(item => item.product_id === productId);
      const product = products.find(p => p.id === productId);
      const price = product?.price || 0;
      
      // 판매액 계산
      const salesAmount = quantity * price;
      
      // 기존 데이터 수정
      if (productIndex >= 0) {
        const newData = [...prevData];
        newData[productIndex] = {
          ...newData[productIndex],
          quantity,
          sales_amount: salesAmount,
          isDirty: true
        };
        
        // 총 매출액 업데이트
        const newTotalSales = newData.reduce((sum, item) => sum + item.sales_amount, 0);
        setTotalSales(newTotalSales);
        
        // 비율 재계산
        return newData.map(item => ({
          ...item,
          sales_ratio: newTotalSales > 0 ? parseFloat(((item.sales_amount / newTotalSales) * 100).toFixed(2)) : 0,
          isDirty: item.product_id === productId ? true : item.isDirty
        }));
      } 
      // 새 제품 추가
      else {
        const newItem: ProductSalesMetric = {
          kol_id: selectedKolId!,
          product_id: productId,
          year_month: yearMonth,
          quantity,
          sales_amount: salesAmount,
          sales_ratio: 0, // 임시값, 아래에서 계산
          productName: product?.name || `제품 #${productId}`,
          productPrice: price,
          isDirty: true
        };
        
        const newData = [...prevData, newItem];
        const newTotalSales = newData.reduce((sum, item) => sum + item.sales_amount, 0);
        setTotalSales(newTotalSales);
        
        // 비율 재계산
        return newData.map(item => ({
          ...item,
          sales_ratio: newTotalSales > 0 ? parseFloat(((item.sales_amount / newTotalSales) * 100).toFixed(2)) : 0,
          isDirty: item.product_id === productId ? true : item.isDirty
        }));
      }
    });
  };

  // 제품 추가 처리
  const handleAddProduct = () => {
    if (selectedProductId) {
      // 이미 추가된 제품인지 확인
      const existingProduct = productSalesData.find(
        item => item.product_id === selectedProductId
      );
      
      if (existingProduct) {
        alert('이미 추가된 제품입니다.');
        return;
      }
      
      // 기본값 1로 추가
      updateProductQuantity(selectedProductId, 1);
      setSelectedProductId(null);
      setShowAddProduct(false);
    }
  };

  // 변경사항 저장
  const saveChanges = async () => {
    setSavingStatus('저장 중...');

    try {
      // 변경된 데이터만 필터링
      const dirtyData = productSalesData.filter(data => data.isDirty);
      
      if (dirtyData.length === 0) {
        setSavingStatus('변경사항이 없습니다');
        setTimeout(() => setSavingStatus(''), 2000);
        return;
      }

      // 저장할 데이터 준비 (UI 관련 필드 제거)
      const prepareDataForSave = (data: ProductSalesMetric) => {
        const { isDirty, productName, productPrice, ...saveData } = data;
        return saveData;
      };

      // 새로운 데이터와 업데이트할 데이터 분리
      const newData = dirtyData.filter(data => !data.id);
      const updateData = dirtyData.filter(data => data.id);

      // 새 데이터 추가
      if (newData.length > 0) {
        const dataToInsert = newData.map(prepareDataForSave);
        const { error: insertError } = await supabase
          .from('product_sales_metrics')
          .insert(dataToInsert);

        if (insertError) throw new Error(`새 데이터 추가 오류: ${insertError.message}`);
      }

      // 기존 데이터 업데이트
      for (const item of updateData) {
        const dataToUpdate = prepareDataForSave(item);
        const { error: updateError } = await supabase
          .from('product_sales_metrics')
          .update(dataToUpdate)
          .eq('id', item.id);

        if (updateError) throw new Error(`데이터 업데이트 오류: ${updateError.message}`);
      }

      // 성공 후 데이터 다시 로드
      if (selectedKolId) {
        await fetchProductSalesData(selectedKolId, yearMonth);
      }

      setSavingStatus('저장 완료!');
      setTimeout(() => setSavingStatus(''), 2000);
    } catch (error) {
      setSavingStatus(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTimeout(() => setSavingStatus(''), 5000);
    }
  };

  // 제품 필터링 (검색)
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 제품 정렬 (장비 구분)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // 우선 장비/제품 구분
    if (a.is_device !== b.is_device) {
      return a.is_device ? -1 : 1;
    }
    // 그 다음 카테고리
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    // 마지막으로 이름
    return a.name.localeCompare(b.name);
  });

  // KOL 이름 찾기
  const getKolName = (kolId: number) => {
    const kol = kols.find(k => k.id === kolId);
    return kol ? kol.name : `KOL #${kolId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">제품 매출 비율 관리</h1>
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
            onClick={saveChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            disabled={!productSalesData.some(data => data.isDirty)}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KOL 선택 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">KOL 선택</h3>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <ul className="divide-y divide-gray-200">
              {kols.map((kol) => (
                <li key={kol.id}>
                  <button
                    onClick={() => setSelectedKolId(kol.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none ${
                      selectedKolId === kol.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium">{kol.name}</div>
                    <div className="text-sm text-gray-500">{kol.shop_name}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 매출 요약 */}
        {selectedKolId && (
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {getKolName(selectedKolId)} - {yearMonth} 제품 매출
              </h3>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center text-sm"
              >
                <Plus size={16} className="mr-1" />
                제품 추가
              </button>
            </div>
            
            {showAddProduct && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제품 검색..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md mb-2">
                  <ul className="divide-y divide-gray-200">
                    {sortedProducts.map((product) => (
                      <li 
                        key={product.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedProductId === product.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <div className="px-4 py-2">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {product.name}
                              {product.is_device && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                  장비
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Intl.NumberFormat('ko-KR').format(product.price)}원
                            </div>
                          </div>
                          {product.category && (
                            <div className="text-xs text-gray-500">{product.category}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="mr-2 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    disabled={!selectedProductId}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">총 매출액:</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat('ko-KR').format(totalSales)}원
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>등록된 제품:</span>
                  <span>{productSalesData.length}개</span>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-4 text-gray-500">데이터 로딩 중...</div>
              ) : productSalesData.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  제품 매출 데이터가 없습니다. 제품을 추가해주세요.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제품명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          단가
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          수량
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          매출액
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          비율
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productSalesData.map((data) => (
                        <tr key={data.product_id} className={data.isDirty ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {data.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Intl.NumberFormat('ko-KR').format(data.productPrice || 0)}원
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <input
                              type="number"
                              min="0"
                              value={data.quantity}
                              onChange={(e) => updateProductQuantity(data.product_id, Number(e.target.value))}
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Intl.NumberFormat('ko-KR').format(data.sales_amount)}원
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {data.sales_ratio.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 