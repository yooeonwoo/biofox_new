"use client";

import { useEffect, useState } from "react";
import { SpecialtyStoreManagement, IKOL, ISpecialtyStore } from "@/components/kols/SpecialtyStoreManagement";
import { Toaster } from "sonner";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// metadata는 클라이언트 컴포넌트에서 사용할 수 없으므로 제거
// export const metadata: Metadata = {
//   title: "전문점 관리 - BIOFOX 관리자",
//   description: "관리자가 KOL에 소속된 전문점을 등록하고 관리할 수 있는 페이지입니다.",
// };

export default function AdminStoresPage() {
  // 상태 관리
  const [kols, setKols] = useState<IKOL[]>([]);
  const [stores, setStores] = useState<ISpecialtyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  // KOL 및 전문점 데이터 로드 함수
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // KOL 목록 가져오기
      await fetchKols();
      
      // 전문점 목록 가져오기
      await fetchStores();
    } catch (err) {
      console.error("데이터 로드 중 오류 발생:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.");
      toast.error("데이터 로드 실패", {
        description: "KOL 또는 전문점 데이터를 불러오는 중 오류가 발생했습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  // KOL 데이터 가져오기
  const fetchKols = async () => {
    try {
      const response = await fetch("/api/kols");
      
      if (!response.ok) {
        throw new Error("KOL 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedKols: IKOL[] = data.map((kol: any) => ({
        id: kol.id.toString(), // 숫자를 문자열로 변환
        name: kol.name || "",
      }));
      
      setKols(formattedKols);
    } catch (err) {
      console.error("KOL 목록 조회 오류:", err);
      throw err;
    }
  };

  // 전문점 데이터 가져오기
  const fetchStores = async () => {
    try {
      const response = await fetch("/api/shops");
      
      if (!response.ok) {
        throw new Error("전문점 데이터를 불러오는데 실패했습니다");
      }
      
      const data = await response.json();
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const formattedStores: ISpecialtyStore[] = data.map((shop: any) => {
        // kol 속성이 있으면 해당 정보 사용, 없으면 빈 문자열 사용
        const kolName = shop.kol?.name || "";
        
        return {
          id: shop.id.toString(),
          kolId: shop.kolId.toString(),
          kolName: kolName,
          ownerName: shop.ownerName || "",
          region: shop.region || "",
          smartPlaceLink: shop.smartPlaceLink || "",
          status: shop.status === "inactive" ? "inactive" : "active",
        };
      });
      
      setStores(formattedStores);
    } catch (err) {
      console.error("전문점 목록 조회 오류:", err);
      throw err;
    }
  };

  // 관리자는 새 전문점 등록, 기존 전문점 수정/삭제 등의 기능 사용 가능
  const handleAddStore = async (storeData: any) => {
    try {
      // 실제 API 호출로 전문점 추가
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kolId: parseInt(storeData.kolId), // 숫자로 변환
          ownerName: storeData.ownerName,
          region: storeData.region,
          smartPlaceLink: storeData.smartPlaceLink || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "전문점 등록에 실패했습니다");
      }

      const result = await response.json();
      
      // 데이터 새로고침
      fetchStores();
      
      return result;
    } catch (error) {
      console.error("전문점 등록 실패:", error);
      throw error;
    }
  };

  const handleUpdateStore = async (storeData: any) => {
    try {
      // 실제 API 호출로 전문점 수정
      const response = await fetch(`/api/shops/${storeData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kolId: parseInt(storeData.kolId), // 숫자로 변환
          ownerName: storeData.ownerName,
          region: storeData.region,
          smartPlaceLink: storeData.smartPlaceLink || "",
          status: storeData.status || "active",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "전문점 수정에 실패했습니다");
      }

      const result = await response.json();
      
      // 데이터 새로고침
      fetchStores();
      
      return result;
    } catch (error) {
      console.error("전문점 수정 실패:", error);
      throw error;
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      // 실제 API 호출로 전문점 삭제
      const response = await fetch(`/api/shops/${storeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "전문점 삭제에 실패했습니다");
      }

      const result = await response.json();
      
      // 데이터 새로고침
      fetchStores();
      
      return result;
    } catch (error) {
      console.error("전문점 삭제 실패:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold"></h1>
        </div>
        
        {/* 모바일 필터 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <Select>
                <SelectTrigger className="bg-white border-gray-300 font-medium text-gray-900">
                  <SelectValue placeholder="KOL 선택" className="text-gray-500 font-medium" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all" className="font-medium text-gray-900 hover:bg-gray-100">
                    전체 KOL
                  </SelectItem>
                  {kols.map((kol) => (
                    <SelectItem 
                      key={kol.id} 
                      value={kol.id}
                      className="font-medium text-gray-900 hover:bg-gray-100"
                    >
                      {kol.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              등록
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="전문점 검색..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 데스크톱 뷰 */}
      <div className="hidden md:block">
        <Card>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-[250px_1fr] gap-6">
              {/* KOL 사이드바 */}
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-medium text-sm text-gray-500 mb-2">KOL 목록</h3>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal mb-2"
                    onClick={() => {}}
                  >
                    모든 전문점 ({stores.length})
                  </Button>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {kols.map((kol) => {
                    const kolStores = stores.filter(store => store.kolId === kol.id);
                    return (
                      <AccordionItem key={kol.id} value={kol.id} className="border-none">
                        <AccordionTrigger className="hover:bg-gray-100 rounded-md px-3 py-2 text-sm">
                          <div className="flex items-center justify-between w-full">
                            <span>{kol.name}</span>
                            <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
                              {kolStores.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2">
                          <div className="space-y-1 pl-3">
                            {kolStores.map((store) => (
                              <Button
                                key={store.id}
                                variant="ghost"
                                className="w-full justify-start text-sm font-normal h-8"
                                onClick={() => {}}
                              >
                                {store.ownerName}
                              </Button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>

              {/* 메인 컨텐츠 */}
              <div className="border rounded-lg p-4">
                <SpecialtyStoreManagement 
                  initialStores={stores}
                  kols={kols}
                  isAdmin={true} 
                  onAddStore={handleAddStore}
                  onUpdateStore={handleUpdateStore}
                  onDeleteStore={handleDeleteStore}
                  isLoading={loading}
                  showAddModal={showAddModal}
                  onOpenChange={setShowAddModal}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 모바일 전문점 목록 */}
      <div className="md:hidden">
        {stores.map((store) => (
          <Card key={store.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-medium">{store.ownerName}</CardTitle>
                  <CardDescription>{store.kolName}</CardDescription>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    store.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {store.status === 'active' ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">
                {store.region}
              </div>
              {store.smartPlaceLink && (
                <a 
                  href={store.smartPlaceLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-1 block"
                >
                  스마트플레이스
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
} 