import { Metadata } from "next";
import { SalesRegistration } from "@/components/kols/SalesRegistration";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "매출 등록 - BIOFOX KOL",
  description: "KOL이 소속 전문점의 매출을 등록할 수 있는 페이지입니다.",
};

export default function SalesPage() {
  // 예시 데이터
  const demoStores = [
    { id: "store1", name: "서울 강남점" },
    { id: "store2", name: "서울 명동점" },
    { id: "store3", name: "부산 해운대점" },
    { id: "store4", name: "대구 동성로점" },
  ];

  const demoProducts = [
    { id: "prod1", name: "프리미엄 티셔츠", price: 29000 },
    { id: "prod2", name: "슬림핏 청바지", price: 59000 },
    { id: "prod3", name: "캐주얼 셔츠", price: 45000 },
    { id: "prod4", name: "가죽 자켓", price: 150000 },
    { id: "prod5", name: "니트 스웨터", price: 65000 },
  ];

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">매출 등록</h1>
          <SalesRegistration stores={demoStores} products={demoProducts} />
        </div>

        <div className="rounded-md border p-6 bg-white">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">최근 등록된 매출</h2>
            <p className="text-muted-foreground">
              아직 등록된 매출이 없습니다. 위의 '매출 등록' 버튼을 클릭하여 새로운 매출을 등록해보세요.
            </p>
          </div>
        </div>

        <div className="rounded-md border p-6 bg-white">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">매출 등록 방법</h2>
            <ol className="list-decimal ml-4 space-y-2">
              <li>오른쪽 상단의 '매출 등록' 버튼을 클릭합니다.</li>
              <li>전문점을 선택합니다.</li>
              <li>제품을 선택하고 수량을 조정합니다.</li>
              <li>모든 정보가 정확한지 확인 후 '매출 등록하기' 버튼을 클릭합니다.</li>
              <li>등록 완료 후 여기서 매출 현황을 확인할 수 있습니다.</li>
            </ol>
          </div>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
} 