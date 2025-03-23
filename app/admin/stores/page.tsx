import { Metadata } from "next";
import { SpecialtyStoreManagement } from "@/components/kols/SpecialtyStoreManagement";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "전문점 관리 - BIOFOX 관리자",
  description: "관리자가 KOL에 소속된 전문점을 등록하고 관리할 수 있는 페이지입니다.",
};

// 실제 구현 시에는 서버 컴포넌트에서 데이터를 불러오는 로직이 추가되어야 함
export default function AdminStoresPage() {
  // 예시 데이터
  const demoStores = [
    {
      id: "1",
      name: "서울 강남점",
      address: "서울특별시 강남구 테헤란로 123",
      phone: "02-1234-5678",
      ownerName: "김관리",
      status: "active" as const,
      businessNumber: "123-45-67890",
      description: "강남 지역 대표 전문점",
    },
    {
      id: "2",
      name: "부산 해운대점",
      address: "부산광역시 해운대구 해운대로 456",
      phone: "051-987-6543",
      ownerName: "이담당",
      status: "active" as const,
      businessNumber: "234-56-78901",
      description: "부산 해운대 지역 전문점",
    },
    {
      id: "3",
      name: "대구 중앙점",
      address: "대구광역시 중구 중앙대로 789",
      phone: "053-321-7654",
      ownerName: "박매니저",
      status: "inactive" as const,
      businessNumber: "345-67-89012",
      description: "대구 중앙 지역 전문점",
    },
  ];

  // 관리자는 새 전문점 등록, 기존 전문점 수정/삭제 등의 기능 사용 가능
  const handleAddStore = async (storeData: any) => {
    console.log("새 전문점 추가:", storeData);
    // 실제 구현 시에는 서버에 데이터 전송하는 로직 필요
    return Promise.resolve();
  };

  const handleUpdateStore = async (storeData: any) => {
    console.log("전문점 정보 수정:", storeData);
    // 실제 구현 시에는 서버에 데이터 전송하는 로직 필요
    return Promise.resolve();
  };

  const handleDeleteStore = async (storeId: string) => {
    console.log("전문점 삭제:", storeId);
    // 실제 구현 시에는 서버에 데이터 전송하는 로직 필요
    return Promise.resolve();
  };

  return (
    <div className="container py-8">
      <SpecialtyStoreManagement 
        initialStores={demoStores} 
        isAdmin={true} 
        title="전문점 관리" 
        onAddStore={handleAddStore}
        onUpdateStore={handleUpdateStore}
        onDeleteStore={handleDeleteStore}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
} 