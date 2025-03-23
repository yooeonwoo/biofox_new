import { Metadata } from "next";
import { SalesRegistration } from "@/components/kols/SalesRegistration";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "매출 관리 - BIOFOX 관리자",
  description: "관리자가 전문점의 매출을 등록하고 관리할 수 있는 페이지입니다.",
};

export default function AdminSalesPage() {
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

  // 예시 매출 데이터
  const demoSales = [
    {
      id: "sale1",
      date: "2023-04-10",
      store: "서울 강남점",
      amount: 350000,
      products: ["프리미엄 티셔츠 x2", "슬림핏 청바지 x1"]
    },
    {
      id: "sale2",
      date: "2023-04-08",
      store: "서울 명동점",
      amount: 650000,
      products: ["가죽 자켓 x1", "슬림핏 청바지 x2", "니트 스웨터 x3"]
    },
    {
      id: "sale3",
      date: "2023-04-05",
      store: "부산 해운대점",
      amount: 158000,
      products: ["캐주얼 셔츠 x2", "니트 스웨터 x1"]
    }
  ];

  // 관리자용 매출 등록 핸들러
  const handleSubmitOrder = async (order: any) => {
    console.log("새 매출 등록:", order);
    // 실제 구현 시에는 서버에 데이터 전송하는 로직 필요
    return Promise.resolve();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">매출 관리</h1>
          <SalesRegistration 
            stores={demoStores} 
            products={demoProducts} 
            isAdmin={true}
            onSubmitOrder={handleSubmitOrder}
            buttonLabel="매출 등록"
          />
        </div>

        {/* 매출 현황 테이블 */}
        <div className="rounded-md border p-6 bg-white">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">매출 현황</h2>
            {demoSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">날짜</th>
                      <th className="py-2 px-4 text-left">전문점</th>
                      <th className="py-2 px-4 text-left">상품</th>
                      <th className="py-2 px-4 text-right">금액</th>
                      <th className="py-2 px-4 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoSales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{sale.date}</td>
                        <td className="py-2 px-4">{sale.store}</td>
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
                      <td colSpan={3} className="py-2 px-4 text-right">총 매출액</td>
                      <td className="py-2 px-4 text-right">
                        ₩{demoSales.reduce((total, sale) => total + sale.amount, 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">
                등록된 매출 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-md border p-6 bg-white">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">관리자 매출 등록 안내</h2>
            <p className="text-muted-foreground">
              관리자는 모든 전문점의 매출을 등록하고 관리할 수 있습니다.
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>오른쪽 상단의 '매출 등록' 버튼을 클릭하여 새로운 매출을 등록할 수 있습니다.</li>
              <li>매출 등록 시 전문점을 선택하고, 제품 및 수량을 입력하세요.</li>
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