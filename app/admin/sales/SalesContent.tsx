"use client";

import { SalesRegistration, IProduct, IStore, ISalesOrder, ISalesItem } from "@/components/kols/SalesRegistration";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Search, Plus, ChevronRight, Loader2, Store, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// 로컬 인터페이스 정의
interface ILocalStore extends IStore {
  kolId: string;
}

interface ILocalKol {
  id: string;
  name: string;
}

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

export function SalesContent() {
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  
  // 선택된 KOL과 전문점 상태
  const [selectedKolId, setSelectedKolId] = useState<string>("all");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  // KOL 사이드바 확장 상태
  const [expandedKols, setExpandedKols] = useState<Record<string, boolean>>({});
  
  // 데이터 상태
  const [kols, setKols] = useState<ILocalKol[]>([]);
  const [stores, setStores] = useState<ILocalStore[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [sales, setSales] = useState<ISalesData[]>([]);
  
  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 매출 등록 모달 상태
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedRegistrationStore, setSelectedRegistrationStore] = useState<string>("");

  // 모바일 매출 등록 시트 상태
  const [isRegistrationSheetOpen, setIsRegistrationSheetOpen] = useState(false);

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
      const formattedKols: ILocalKol[] = data.map((kol: any) => ({
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

  // 필터링된 매장 목록
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesKol = selectedKolId === "all" || store.kolId === selectedKolId;
      return matchesSearch && matchesKol;
    });
  }, [stores, searchQuery, selectedKolId]);

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

  // 매출 등록 모달 열기
  const openRegistrationModal = (storeId: string = "") => {
    setSelectedRegistrationStore(storeId);
    setIsRegistrationOpen(true);
  };

  // 매출 등록 처리 함수
  const handleSalesRegistration = async (order: ISalesOrder) => {
    try {
      // 매출 등록 API 호출
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          storeId: order.storeId,
          items: order.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          })),
          totalAmount: order.totalAmount
        }),
      });

      if (!response.ok) {
        throw new Error("매출 등록에 실패했습니다.");
      }

      // 성공 시 데이터 새로고침
      await fetchData();
      
      toast.success("매출이 성공적으로 등록되었습니다.");
    } catch (error) {
      console.error("매출 등록 오류:", error);
      toast.error("매출 등록 실패", {
        description: "매출을 등록하는 중 오류가 발생했습니다."
      });
    }
  };

  // 매출 등록 컴포넌트 렌더링
  const renderSalesRegistration = (isSheet: boolean = false) => {
    const selectedStores = selectedKolId === "all" 
      ? stores 
      : stores.filter(store => store.kolId === selectedKolId);

    return (
      <SalesRegistration
        stores={selectedStores}
        products={products}
        isAdmin={true}
        onSubmitOrder={handleSalesRegistration}
        isOpen={isSheet ? isRegistrationSheetOpen : isRegistrationOpen}
        onOpenChange={isSheet ? setIsRegistrationSheetOpen : setIsRegistrationOpen}
        buttonLabel="매출 등록"
        initialStoreId={selectedRegistrationStore}
      />
    );
  };

  // KOL 사이드바 아이템 컴포넌트
  const KolSidebarItem = ({ kol }: { kol: ILocalKol }) => {
    const isExpanded = expandedKols[kol.id];
    const isSelected = selectedKolId === kol.id;
    const kolStores = storesByKol[kol.id] || [];

    return (
      <div className="space-y-1">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleKolExpanded(kol.id)}
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all",
                isSelected && !selectedStoreId
                  ? "bg-purple-50 text-purple-700 font-medium shadow-sm"
                  : "hover:bg-purple-50/50 text-gray-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedKolId(kol.id);
                setSelectedStoreId(null);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{kol.name}</span>
                <span className="text-xs text-gray-500">({kolStores.length})</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  isExpanded ? "transform rotate-180" : ""
                )}
              />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-1 ml-2 space-y-1 border-l-2 border-purple-100">
              {kolStores.map((store) => (
                <div
                  key={store.id}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-all",
                    selectedStoreId === store.id
                      ? "bg-purple-50 text-purple-700 font-medium shadow-sm"
                      : "hover:bg-purple-50/50 text-gray-600"
                  )}
                  onClick={() => {
                    setSelectedKolId(kol.id);
                    setSelectedStoreId(store.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="text-sm">{store.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-purple-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRegistrationModal(store.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // 매출 카드 컴포넌트
  const SalesCard = ({ sale }: { sale: ISalesData }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{sale.storeName}</CardTitle>
            <CardDescription>{sale.kolName}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{new Intl.NumberFormat('ko-KR').format(sale.amount)}원</p>
            <p className="text-sm text-gray-500">{sale.date}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-600">
          {sale.products.join(", ")}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      
      {/* 헤더 영역 */}
      <div className="flex flex-col gap-4 mb-6">
        {/* 매출 등록 버튼 영역 */}
        <div className="flex justify-end w-full">
          {/* 데스크톱 매출 등록 버튼 */}
          <div className="hidden md:block">
            {renderSalesRegistration(false)}
          </div>
          
          {/* 모바일 매출 등록 시트 */}
          <div className="block md:hidden w-full md:w-auto">
            <Sheet open={isRegistrationSheetOpen} onOpenChange={setIsRegistrationSheetOpen}>
              <SheetTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  매출 등록
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader>
                  <SheetTitle>매출 등록</SheetTitle>
                </SheetHeader>
                {renderSalesRegistration(true)}
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* 검색 필드 영역 */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex md:space-x-6">
        {/* KOL 사이드바 */}
        <div className="w-64 shrink-0">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">KOL 목록</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedKolId("all")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedKolId === "all"
                      ? "bg-purple-50 text-purple-700 shadow-sm"
                      : "text-gray-600 hover:bg-purple-50/50"
                  )}
                >
                  전체 KOL
                </button>
                {kols.map((kol) => (
                  <KolSidebarItem key={kol.id} kol={kol} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold">
                  {selectedTitle}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden md:block">
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">날짜</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">전문점</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">KOL</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">매출액</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">제품</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale, index) => (
                        <tr 
                          key={sale.id}
                          className={cn(
                            "border-b transition-colors hover:bg-gray-50",
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          )}
                        >
                          <td className="px-4 py-3 text-sm">{sale.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">{sale.storeName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{sale.kolName}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold">
                              {new Intl.NumberFormat('ko-KR').format(sale.amount)}원
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {sale.products.map((product, i) => (
                                <span 
                                  key={i}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs"
                                >
                                  {product}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 모바일 매출 목록 */}
      <div className="md:hidden">
        {sales.map((sale) => (
          <SalesCard key={sale.id} sale={sale} />
        ))}
      </div>
    </div>
  );
}
