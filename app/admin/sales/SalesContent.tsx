"use client";

import { SalesRegistration, IProduct, IStore, ISalesOrder } from "@/components/kols/SalesRegistration";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Search, Plus, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";

// 인터페이스 정의
interface ISalesData {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  kolId: string;
  kolName: string;
  amount: number;
  products: string[];
}

interface IKol {
  id: string;
  name: string;
}

// 로컬에서 사용하는 전문점 타입 (ILocalStore로 이름 변경)
interface ILocalStore {
  id: string;
  name: string;
  kolId: string;
}

export function SalesContent() {
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  
  // 선택된 KOL과 전문점 상태
  const [selectedKolId, setSelectedKolId] = useState<string>("all");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  // KOL 사이드바 확장 상태
  const [expandedKols, setExpandedKols] = useState<Record<string, boolean>>({});
  
  // 데이터 상태
  const [kols, setKols] = useState<IKol[]>([]);
  const [stores, setStores] = useState<ILocalStore[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [sales, setSales] = useState<ISalesData[]>([]);
  
  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  // 데이터 로드 함수
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 모든 데이터 병렬로 로드
      await Promise.all([
        fetchKols(),
        fetchStores(),
        fetchProducts(),
        fetchOrders()
      ]);
    } catch (err) {
      console.error("데이터 로드 오류:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.");
      toast.error("데이터 로드 실패", {
        description: "매출 데이터를 불러오는 중 오류가 발생했습니다."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // KOL 데이터 로드
  const fetchKols = async () => {
    try {
      const response = await fetch("/api/kols");
      
      if (!response.ok) {
        throw new Error("KOL 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedKols: IKol[] = data.map((kol: any) => ({
        id: kol.id.toString(),
        name: kol.name || ""
      }));
      
      setKols(formattedKols);
    } catch (err) {
      console.error("KOL 목록 조회 오류:", err);
      throw err;
    }
  };
  
  // 전문점 데이터 로드
  const fetchStores = async () => {
    try {
      const response = await fetch("/api/shops");
      
      if (!response.ok) {
        throw new Error("전문점 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedStores: ILocalStore[] = data.map((shop: any) => ({
        id: shop.id.toString(),
        name: shop.ownerName || "", // 전문점 원장님 이름을 전문점명으로 사용
        kolId: shop.kolId.toString()
      }));
      
      setStores(formattedStores);
    } catch (err) {
      console.error("전문점 목록 조회 오류:", err);
      throw err;
    }
  };
  
  // 제품 데이터 로드
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      
      if (!response.ok) {
        throw new Error("제품 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedProducts: IProduct[] = data.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price
      }));
      
      setProducts(formattedProducts);
    } catch (err) {
      console.error("제품 목록 조회 오류:", err);
      throw err;
    }
  };
  
  // 매출(주문) 데이터 로드
  const fetchOrders = async () => {
    try {
      // 관리자용 주문 API 사용
      const response = await fetch("/api/admin/orders");
      
      if (!response.ok) {
        throw new Error("매출 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedSales: ISalesData[] = data.map((order: any) => {
        // 제품 정보 추출
        const products = order.orderItems.map((item: any) => {
          const product = item.product;
          return `${product.name} x${item.quantity}`;
        });
        
        // 날짜 형식 변환
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        return {
          id: order.id.toString(),
          date: formattedDate,
          storeId: order.shopId.toString(),
          storeName: order.shop?.ownerName || "알 수 없는 전문점",
          kolId: order.shop?.kolId.toString() || "",
          kolName: order.shop?.kol?.name || "알 수 없는 KOL",
          amount: order.totalAmount,
          products
        };
      });
      
      setSales(formattedSales);
    } catch (err) {
      console.error("매출 목록 조회 오류:", err);
      throw err;
    }
  };

  // KOL별 그룹화된 매출 데이터
  const groupedSalesByKol = useMemo(() => {
    const groups: Record<string, ISalesData[]> = {};
    
    sales.forEach(sale => {
      if (!groups[sale.kolId]) {
        groups[sale.kolId] = [];
      }
      groups[sale.kolId].push(sale);
    });
    
    return groups;
  }, [sales]);

  // 전문점별 그룹화된 매출 데이터
  const groupedSalesByStore = useMemo(() => {
    const groups: Record<string, ISalesData[]> = {};
    
    sales.forEach(sale => {
      if (!groups[sale.storeId]) {
        groups[sale.storeId] = [];
      }
      groups[sale.storeId].push(sale);
    });
    
    return groups;
  }, [sales]);

  // KOL별 전문점 목록
  const storesByKol = useMemo(() => {
    const groups: Record<string, ILocalStore[]> = {};
    
    stores.forEach(store => {
      if (!groups[store.kolId]) {
        groups[store.kolId] = [];
      }
      groups[store.kolId].push(store);
    });
    
    return groups;
  }, [stores]);

  // 필터링된 매출 데이터
  const filteredSales = useMemo(() => {
    // 검색어 필터링
    let filtered = sales.filter(sale => 
      sale.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.kolName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // KOL 및 전문점 필터링
    if (selectedKolId !== "all") {
      filtered = filtered.filter(sale => sale.kolId === selectedKolId);
      
      if (selectedStoreId) {
        filtered = filtered.filter(sale => sale.storeId === selectedStoreId);
      }
    }
    
    return filtered;
  }, [sales, searchQuery, selectedKolId, selectedStoreId]);

  // KOL 사이드바 토글
  const toggleKolExpanded = (kolId: string) => {
    setExpandedKols(prev => ({
      ...prev,
      [kolId]: !prev[kolId]
    }));
  };

  // 선택된 항목의 타이틀 계산
  const selectedTitle = useMemo(() => {
    if (selectedKolId === "all") return "모든 매출";
    
    const kol = kols.find(k => k.id === selectedKolId);
    if (!kol) return "매출 현황";
    
    if (selectedStoreId) {
      const store = stores.find(s => s.id === selectedStoreId);
      if (store) return `${kol.name} > ${store.name}`;
    }
    
    return kol.name;
  }, [selectedKolId, selectedStoreId, kols, stores]);

  // 관리자용 매출 등록 핸들러
  const handleSubmitOrder = async (order: ISalesOrder) => {
    try {
      // 실제 API 호출
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "매출 등록에 실패했습니다");
      }

      await response.json();
      
      // 성공 후 데이터 새로고침
      fetchOrders();
      
      return Promise.resolve();
    } catch (error) {
      console.error("매출 등록 실패:", error);
      toast.error("매출 등록 실패", {
        description: "매출 등록 중 오류가 발생했습니다."
      });
      return Promise.reject(error);
    }
  };

  // KOL 사이드바 항목 컴포넌트
  const KolSidebarItem = ({ kol }: { kol: IKol }) => {
    const kolSales = groupedSalesByKol[kol.id] || [];
    const kolStores = storesByKol[kol.id] || [];
    const isExpanded = expandedKols[kol.id];
    const isSelected = selectedKolId === kol.id && !selectedStoreId;
    
    // 검색어가 있을 때 관련 없는 KOL 숨기기
    if (searchQuery && kolSales.length === 0) return null;
    
    return (
      <div>
        <button
          className={cn(
            "w-full text-left px-4 py-2 rounded-md transition-colors flex items-center justify-between",
            isSelected
              ? "bg-purple-100 text-purple-900 font-medium" 
              : "hover:bg-gray-100"
          )}
          onClick={() => {
            setSelectedKolId(kol.id);
            setSelectedStoreId(null);
            // 클릭 시 자동으로 확장
            if (!isExpanded && kolStores.length > 0) {
              toggleKolExpanded(kol.id);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform", 
                isExpanded ? "transform rotate-90" : ""
              )} 
              onClick={(e) => {
                e.stopPropagation();
                toggleKolExpanded(kol.id);
              }}
            />
            <span className="truncate">{kol.name}</span>
          </div>
          <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700 min-w-[1.5rem] text-center">
            {kolSales.length}
          </span>
        </button>
        
        {/* 전문점 하위 목록 */}
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {kolStores.map(store => {
              const storeSales = groupedSalesByStore[store.id] || [];
              
              // 검색어가 있을 때 관련 없는 전문점 숨기기
              if (searchQuery && storeSales.length === 0) return null;
              
              return (
                <button
                  key={store.id}
                  className={cn(
                    "w-full text-left px-4 py-1.5 rounded-md transition-colors flex items-center justify-between text-sm",
                    selectedStoreId === store.id
                      ? "bg-purple-100 text-purple-900 font-medium" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => {
                    setSelectedKolId(kol.id);
                    setSelectedStoreId(store.id);
                  }}
                >
                  <span className="truncate">{store.name}</span>
                  <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700 min-w-[1.5rem] text-center">
                    {storeSales.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">매출 관리</h1>
          <SalesRegistration 
            stores={stores} 
            products={products} 
            isAdmin={true}
            onSubmitOrder={handleSubmitOrder}
            buttonLabel="매출 등록"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p className="font-bold">오류</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="KOL 또는 전문점으로 검색..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="ml-2 text-lg">데이터를 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-[250px_1fr] gap-6">
            {/* KOL/전문점 사이드바 */}
            <div className="border rounded-md p-2 space-y-1 h-[calc(100vh-250px)] overflow-y-auto">
              {/* 모든 매출 항목 */}
              <button
                className={cn(
                  "w-full text-left px-4 py-2 rounded-md transition-colors flex items-center justify-between",
                  selectedKolId === "all" 
                    ? "bg-purple-100 text-purple-900 font-medium" 
                    : "hover:bg-gray-100"
                )}
                onClick={() => {
                  setSelectedKolId("all");
                  setSelectedStoreId(null);
                }}
              >
                <span className="truncate">모든 매출</span>
                <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700 min-w-[1.5rem] text-center">
                  {sales.length}
                </span>
              </button>
              
              {/* KOL 목록 */}
              {kols.map(kol => (
                <KolSidebarItem key={kol.id} kol={kol} />
              ))}
            </div>
            
            {/* 선택된 KOL/전문점의 매출 목록 */}
            <div className="border rounded-md">
              <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedTitle}</h3>
                {selectedKolId !== "all" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // 매출 등록 버튼을 클릭하면 선택된 KOL 또는 전문점으로 미리 선택된 매출 등록 다이얼로그 열기
                      console.log(`${selectedTitle}에 매출 등록`);
                    }}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {selectedStoreId ? "이 전문점에 매출 등록" : "이 KOL에 매출 등록"}
                  </Button>
                )}
              </div>
              
              {/* 매출 현황 테이블 */}
              <div className="overflow-x-auto">
                {filteredSales.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">날짜</th>
                        <th className="py-2 px-4 text-left">전문점</th>
                        <th className="py-2 px-4 text-left">KOL</th>
                        <th className="py-2 px-4 text-left">상품</th>
                        <th className="py-2 px-4 text-right">금액</th>
                        <th className="py-2 px-4 text-center">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{sale.date}</td>
                          <td className="py-2 px-4">{sale.storeName}</td>
                          <td className="py-2 px-4">{sale.kolName}</td>
                          <td className="py-2 px-4">
                            <ul className="list-disc ml-4">
                              {sale.products.map((product, index) => (
                                <li key={index}>{product}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-2 px-4 text-right font-medium">₩{sale.amount.toLocaleString()}</td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="outline" size="sm">수정</Button>
                              <Button variant="outline" size="sm" className="text-red-500">삭제</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={4} className="py-2 px-4 text-right">총 매출액</td>
                        <td className="py-2 px-4 text-right">
                          ₩{filteredSales.reduce((total, sale) => total + sale.amount, 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchQuery 
                      ? "검색 결과가 없습니다." 
                      : "선택한 항목에 대한 매출 데이터가 없습니다."}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border p-6 bg-white">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">관리자 매출 등록 안내</h2>
            <p className="text-muted-foreground">
              관리자는 모든 전문점의 매출을 등록하고 관리할 수 있습니다.
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>좌측 사이드바를 통해 KOL별, 전문점별 매출을 확인할 수 있습니다.</li>
              <li>오른쪽 상단의 '매출 등록' 버튼을 클릭하여 새로운 매출을 등록할 수 있습니다.</li>
              <li>등록된 매출은 KOL에게 실시간으로 표시됩니다.</li>
              <li>매출 정보는 수정 및 삭제가 가능합니다.</li>
            </ul>
          </div>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
} 