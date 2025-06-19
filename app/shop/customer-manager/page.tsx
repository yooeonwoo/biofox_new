import { auth } from "@clerk/nextjs/server";
import ShopCustomerList from "./components/ShopCustomerList";
import { ShopCustomerData } from "./lib/types";

export const revalidate = 0;

export default async function ShopCustomerManagerPage() {
  const { userId } = await auth();
  if (!userId) {
    return <div className="p-6 text-center">로그인이 필요합니다.</div>;
  }
  
  // 전문점샵(shop) 역할 사용자의 ID, 여기서는 kol의 user id를 임시로 사용
  const shopUserId = userId; 

  // 목업 데이터: docs/고객 관리 시스템 (전문점샵용)/App.tsx 참고
  const sampleCustomers: ShopCustomerData[] = [
    {
      name: '홍길동 원장',
      contractDate: '2024-01-15',
      manager: '이관리',
    },
    {
      name: '김고객 원장',
      contractDate: '2024-02-20',
      manager: '최관리',
    },
  ];

  // TODO: 추후 실제 API를 통해 해당 샵의 고객 목록을 가져오도록 수정
  const customers = sampleCustomers;

  return (
    <ShopCustomerList initialData={customers} />
  );
} 