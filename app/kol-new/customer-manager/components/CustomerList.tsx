"use client";

import { useCustomers } from "@/lib/hooks/customers";
import CustomerCard from "./CustomerCard";
import { CustomerProgress, Customer } from "@/lib/types/customer";
import { useState } from "react";
import PageHeader from "./PageHeader";

interface Props {
  initialData: (Customer & { customer_progress?: CustomerProgress[] })[];
  kolId: number;
}

export default function CustomerList({ initialData, kolId }: Props) {
  const {
    data: customers = initialData,
    isLoading,
    isError,
  } = useCustomers(kolId, initialData);

  const [localCustomers, setLocalCustomers] = useState(customers);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCustomer = () => {
    if (isAdding) return;

    const newCustomer: Customer & { customer_progress?: CustomerProgress[]; isNew?: boolean } = {
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
    };
    setLocalCustomers(prev => [newCustomer, ...prev]);
    setIsAdding(true);
  }

  const handleDeleteNewCustomer = (customerId: string | number) => {
    setLocalCustomers(prev => prev.filter(c => c.id !== customerId));
    setIsAdding(false);
  }

  if (isLoading && localCustomers.length === 0) {
    return <p>로딩 중...</p>;
  }

  if (isError) {
    return <p>데이터를 불러오는 데 실패했습니다.</p>;
  }

  if (!customers || customers.length === 0) {
    return <p>등록된 고객이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-0">
      <PageHeader 
        backPath="/kol-new"
        journalPath="/kol-new/sales-journal"
        onAddCustomer={handleAddCustomer}
        isAdding={isAdding}
      />
      <div className="p-6 flex flex-col gap-6">
        {localCustomers.map((c: any, idx: number) => (
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