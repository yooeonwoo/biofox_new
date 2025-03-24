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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p className="font-bold">오류</p>
          <p>{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>전문점 관리</CardTitle>
          <CardDescription>KOL에 소속된 전문점을 등록하고 관리할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <SpecialtyStoreManagement 
            initialStores={stores}
            kols={kols}
            isAdmin={true} 
            onAddStore={handleAddStore}
            onUpdateStore={handleUpdateStore}
            onDeleteStore={handleDeleteStore}
            isLoading={loading}
          />
        </CardContent>
      </Card>
      <Toaster position="top-center" richColors />
    </div>
  );
} 