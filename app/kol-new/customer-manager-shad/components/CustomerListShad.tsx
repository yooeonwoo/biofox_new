"use client";

import { useCustomers } from "@/lib/hooks/customers";
import CustomerCardShad from "./CustomerCardShad";
import { CustomerProgress, Customer } from "@/lib/types/customer";

interface Props {
  initialData: (Customer & { customer_progress?: CustomerProgress[] })[];
  kolId: number;
}

export default function CustomerListShad({ initialData, kolId }: Props) {
  const {
    data: customers = initialData,
    isLoading,
    isError,
  } = useCustomers(kolId, initialData);

  if (isLoading && customers.length === 0) {
    return <p>로딩 중...</p>;
  }

  if (isError) {
    return <p>데이터를 불러오는 데 실패했습니다.</p>;
  }

  if (!customers || customers.length === 0) {
    return <p>등록된 고객이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {customers.map((c: Customer & { customer_progress?: CustomerProgress[] }, idx: number) => (
        <CustomerCardShad key={c.id} customer={c} progress={c.customer_progress?.[0]} cardNumber={idx + 1} />
      ))}
    </div>
  );
} 