"use client";

import { useCustomers } from "@/lib/hooks/customers";
import CustomerCard from "./CustomerCard";
import { CustomerProgress, Customer } from "@/lib/types/customer";
import { useState, useEffect } from "react";
import PageHeader from "./PageHeader";

// isNew와 같은 로컬 상태를 포함하는 확장된 고객 타입
type LocalCustomer = Customer & {
  customer_progress?: CustomerProgress[];
  isNew?: boolean;
};

interface Props {
  initialData: LocalCustomer[];
  kolId: number;
}

export default function CustomerList({ initialData, kolId }: Props) {
  const {
    data: customers, // useCustomers 훅의 원본 데이터 (캐시 관리용)
    isLoading,
    isError,
  } = useCustomers(kolId, initialData);

  const [localCustomers, setLocalCustomers] = useState<LocalCustomer[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // useCustomers 훅에서 데이터가 변경되면 로컬 상태도 업데이트
    // 단, 새 고객 추가 중일 때는 업데이트하지 않음
    if (customers && !isAdding) {
      setLocalCustomers(customers);
    }
  }, [customers, isAdding]);

  const handleAddCustomer = () => {
    if (isAdding) return;

    const newCustomer: LocalCustomer = {
      id: `new-${Date.now()}`,
      kol_id: kolId,
      name: "신규 고객",
      shopName: "",
      phone: "",
      region: "",
      placeAddress: "",
      assignee: "",
      manager: "",
      status: "new",
      created_at: new Date().toISOString(),
      customer_progress: [],
      isNew: true,
      // Customer 타입의 다른 필수 필드가 있다면 여기에 기본값 추가
      notes: "",
      completed_stages: 0,
      total_stages: 6,
    };
    setLocalCustomers((prev) => [newCustomer, ...prev]);
    setIsAdding(true);
  };

  const handleDeleteNewCustomer = (customerId: string | number) => {
    setLocalCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setIsAdding(false);
  };

  if (isLoading && localCustomers.length === 0) {
    return <p>로딩 중...</p>;
  }

  if (isError) {
    return <p>데이터를 불러오는 데 실패했습니다.</p>;
  }

  if (!localCustomers || localCustomers.length === 0) {
    return <p>등록된 고객이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-0 max-w-4xl mx-auto sm:p-0">
      <PageHeader 
        backPath="/kol-new"
        journalPath="/kol-new/sales-journal"
        onAddCustomer={handleAddCustomer}
        isAdding={isAdding}
      />
      <div className="p-4 sm:p-6 flex flex-col gap-6">
          {localCustomers.map((c, idx) => (
            <CustomerCard 
                key={c.id} 
                customer={c} 
                progress={c.customer_progress?.[0]} 
                cardNumber={idx + 1}
                isNew={c.isNew}
                onDelete={() => handleDeleteNewCustomer(c.id)}
            />
          ))}
      </div>
    </div>
  );
} 