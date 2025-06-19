"use client";

import ShopCustomerCard from "./components/ShopCustomerCard";

// As per the new requirement, we display a single card for the shop's self-growth system.
// This data is based on the sample from docs/고객 관리 시스템 (전문점샵용)/App.tsx
const sampleShopData = {
    name: '바이오포톤 강남점',
    contractDate: '2024-01-15',
    manager: '김대표',
};

export default function ShopCustomerManagerPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <ShopCustomerCard customer={sampleShopData} cardNumber={1} />
    </div>
  );
} 