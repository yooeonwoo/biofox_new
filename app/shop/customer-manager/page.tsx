"use client";

import ShopCustomerCard from "./components/ShopCustomerCard";
import { PageHeader } from "@/components/clinical/PageHeader";

// As per the new requirement, we display a single card for the shop's self-growth system.
// This data is based on the sample from docs/고객 관리 시스템 (전문점샵용)/App.tsx
const sampleShopData = {
    name: '바이오포톤 강남점',
    contractDate: '2024-01-15',
    manager: '김대표',
};

// TODO: 실제 인증된 Shop의 ID를 가져오는 로직으로 교체 예정
const TEMP_SHOP_ID = "550e8400-e29b-41d4-a716-446655440001"; // UUID 형태의 임시 shopId

export default function ShopCustomerManagerPage() {
  return (
    <div>
      {/* 헤더 */}
      <PageHeader
        title="셀프 성장 관리"
        backPath="/shop"
        showAddButton={false}
      />
      
      {/* 메인 컨테이너 */}
      <main className="mx-auto w-full max-w-none xs:max-w-full sm:max-w-2xl">
        <div className="space-y-4 xs:space-y-5 p-2 xs:p-3 md:px-0 md:py-6">
          <ShopCustomerCard 
            customer={sampleShopData} 
            cardNumber={1} 
            shopId={TEMP_SHOP_ID}
          />
        </div>
      </main>
    </div>
  );
} 