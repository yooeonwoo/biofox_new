"use client";

import { SalesRegistration, IProduct, IStore, ISalesOrder } from "@/components/kols/SalesRegistration";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Search, Plus, ChevronRight, Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      // 인증 상태 확인 (로컬 스토리지나 쿠키에서 토큰 확인)
      const isAuthenticated = document.cookie.includes('__session=') || 
                             document.cookie.includes('__clerk_db_jwt=');
      
      if (!isAuthenticated) {
        // 인증되지 않은 경우 에러 표시 후 로그인 페이지로 리다이렉트
        setError("인증이 필요합니다. 잠시 후 로그인 페이지로 이동합니다.");
        setTimeout(() => {
          window.location.href = '/signin?redirect_url=/admin/sales';
        }, 3000);
        return;
      }
      
      // 각 API 호출 함수를 개별적으로 실행하고 오류를 개별적으로 처리
      let hasLoadedSomeData = false;
      let errorMessages = [];
      
      try {
        const kolData = await fetchKols();
        if (kolData) {
          hasLoadedSomeData = true;
        }
      } catch (kolError) {
        console.error("KOL 데이터 로드 실패:", kolError);
        errorMessages.push("KOL 목록을 불러오는데 실패했습니다");
      }
      
      try {
        const storeData = await fetchStores();
        if (storeData) {
          hasLoadedSomeData = true;
        }
      } catch (storeError) {
        console.error("전문점 데이터 로드 실패:", storeError);
        errorMessages.push("전문점 목록을 불러오는데 실패했습니다");
      }
      
      try {
        const productData = await fetchProducts();
        if (productData) {
          hasLoadedSomeData = true;
        }
      } catch (productError) {
        console.error("제품 데이터 로드 실패:", productError);
        errorMessages.push("제품 목록을 불러오는데 실패했습니다");
      }
      
      try {
        const orderData = await fetchOrders();
        if (orderData) {
          hasLoadedSomeData = true;
        }
      } catch (orderError) {
        console.error("주문 데이터 로드 실패:", orderError);
        errorMessages.push("매출 데이터를 불러오는데 실패했습니다");
      }
      
      // 일부 데이터라도 로드되었는지 확인
      if (!hasLoadedSomeData) {
        // 모든 API 호출이 실패한 경우
        setError("모든 데이터를 불러오는데 실패했습니다. 인증 상태와 네트워크 연결을 확인해주세요.");
        if (errorMessages.length > 0) {
          toast.error("데이터 로드 실패", {
            description: errorMessages.join(', ')
          });
        }
      } else if (errorMessages.length > 0) {
        // 일부 API 호출만 실패한 경우 토스트로 알림만 표시
        toast.warning("일부 데이터 로드 실패", {
          description: errorMessages.join(', ')
        });
      }
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
  
  /**
   * KOL 데이터 로드
   */
  const fetchKols = async () => {
    try {
      const response = await fetch("/api/kols", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // 응답 상태 확인 및 자세한 오류 처리
      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답 텍스트를 가져오지 못했습니다");
        console.error(`[fetchKols] HTTP ${response.status} - ${response.statusText}, 응답: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
        
        throw new Error(`KOL 데이터를 불러오는데 실패했습니다 (status: ${response.status})`);
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedKols: IKol[] = data.map((kol: any) => ({
        id: kol.id.toString(),
        name: kol.name || ""
      }));
      
      setKols(formattedKols);
      return formattedKols;
    } catch (err) {
      console.error("KOL 목록 조회 오류:", err);
      throw err;
    }
  };
  
  /**
   * 전문점 데이터 로드
   */
  const fetchStores = async () => {
    try {
      const response = await fetch("/api/shops", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // 응답 상태 확인 및 자세한 오류 처리
      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답 텍스트를 가져오지 못했습니다");
        console.error(`[fetchStores] HTTP ${response.status} - ${response.statusText}, 응답: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
        
        throw new Error(`전문점 데이터를 불러오는데 실패했습니다 (status: ${response.status})`);
      }
      
      const data = await response.json();
      
      const formattedStores: ILocalStore[] = data.map((shop: any) => ({
        id: shop.id.toString(),
        name: shop.ownerName || "", // 전문점 원장님 이름을 전문점명으로 사용
        kolId: shop.kolId.toString()
      }));
      
      setStores(formattedStores);
      return formattedStores;
    } catch (err) {
      console.error("전문점 목록 조회 오류:", err);
      throw err;
    }
  };
  
  /**
   * 제품 데이터 로드
   */
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // 응답 상태 확인 및 자세한 오류 처리
      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답 텍스트를 가져오지 못했습니다");
        console.error(`[fetchProducts] HTTP ${response.status} - ${response.statusText}, 응답: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
        
        throw new Error(`제품 데이터를 불러오는데 실패했습니다 (status: ${response.status})`);
      }
      
      const data = await response.json();
      
      const formattedProducts: IProduct[] = data.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price
      }));
      
      setProducts(formattedProducts);
      return formattedProducts;
    } catch (err) {
      console.error("제품 목록 조회 오류:", err);
      throw err;
    }
  };
  
  /**
   * 매출(주문) 데이터 로드
   */
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // 응답 상태 확인 및 자세한 오류 처리
      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답 텍스트를 가져오지 못했습니다");
        console.error(`[fetchOrders] HTTP ${response.status} - ${response.statusText}, 응답: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
        
        throw new Error(`매출 데이터를 불러오는데 실패했습니다 (status: ${response.status})`);
      }
      
      const data = await response.json();
      
      // 디버깅을 위한 콘솔 로그 추가
      console.log("API 응답 구조:", data);
      
      // API 응답 구조 확인 - orders 배열이 있으면 그것을 사용하고, 없으면 data 자체를 사용
      const ordersArray = data.orders || data;
      
      // 배열인지 확인
      if (!Array.isArray(ordersArray)) {
        console.error("주문 데이터가 배열 형태가 아닙니다:", ordersArray);
        throw new Error("주문 데이터 형식이 올바르지 않습니다");
      }
      
      // 주문 데이터를 매출 데이터 형식으로 변환
      const formattedSales: ISalesData[] = ordersArray.map((order: any) => ({
        id: order.id.toString(),
        date: new Date(order.orderDate).toISOString().split('T')[0], // YYYY-MM-DD 형식
        storeId: order.shopId.toString(),
        storeName: order.shop?.ownerName || "알 수 없는 전문점",
        kolId: order.shop?.kol?.id.toString() || "",
        kolName: order.shop?.kol?.name || "알 수 없는 KOL",
        amount: order.totalAmount,
        products: order.orderItems.map((item: any) => item.product?.name || "알 수 없는 제품")
      }));
      
      setSales(formattedSales);
      return formattedSales;
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
        credentials: 'include',
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
    const isExpanded = expandedKols[kol.id] ?? false;
    const kolStores = stores.filter((store) => store.kolId === kol.id);
    
    return (
      <div className="mb-2">
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-md cursor-pointer",
            selectedKolId === kol.id
              ? "bg-blue-50 text-blue-700 font-medium"
              : "hover:bg-gray-100"
          )}
          onClick={() => toggleKolExpanded(kol.id)}
        >
          <div className="flex items-center">
            <span>{kol.name}</span>
            <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
              {kolStores.length}
            </span>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "transform rotate-90" : ""
            )}
          />
        </div>
        
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {kolStores.map((store) => (
              <div
                key={store.id}
                className={cn(
                  "flex items-center p-2 rounded-md cursor-pointer",
                  selectedStoreId === store.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-100"
                )}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <Store className="h-4 w-4 mr-2" />
                <span className="text-sm">{store.name}</span>
              </div>
            ))}
            {kolStores.length === 0 && (
              <div className="p-2 text-sm text-gray-500">전문점 없음</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p className="font-bold">오류</p>
          <p>{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>매출 현황</CardTitle>
            <CardDescription>KOL 및 전문점별 매출 관리</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="KOL, 전문점으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {!isLoading && (
              <Button onClick={() => handleSubmitOrder({ storeId: "", items: [], totalAmount: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> 매출 등록
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[250px_1fr] gap-6">
            {/* KOL 및 전문점 사이드바 */}
            <div className="border rounded-md p-2 space-y-1 h-[calc(100vh-250px)] overflow-y-auto">
              <div className="font-medium mb-2 p-2">KOL 및 전문점</div>
              
              <div
                className={cn(
                  "flex items-center p-2 rounded-md cursor-pointer mb-2",
                  selectedKolId === "all"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-100"
                )}
                onClick={() => {
                  setSelectedKolId("all");
                  setSelectedStoreId(null);
                }}
              >
                <span>모든 매출</span>
              </div>
              
              {kols.map((kol) => (
                <KolSidebarItem key={kol.id} kol={kol} />
              ))}
            </div>
            
            {/* 매출 데이터 테이블 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{selectedTitle}</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-sm text-gray-500">데이터를 불러오는 중...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>KOL</TableHead>
                      <TableHead>전문점</TableHead>
                      <TableHead>제품</TableHead>
                      <TableHead className="text-right">매출액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                          등록된 매출이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.kolName}</TableCell>
                          <TableCell>{sale.storeName}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{sale.products.join(", ")}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("ko-KR", {
                              style: "currency",
                              currency: "KRW",
                            }).format(sale.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Toaster position="top-center" richColors />
    </div>
  );
}
