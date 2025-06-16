"use client";

import { Customer, CustomerProgress } from "@/lib/types/customer";

interface Props {
  customer: Customer & { customer_progress?: CustomerProgress[] };
  progress?: CustomerProgress;
  cardNumber: number;
}

export default function CustomerCard({ customer, cardNumber }: Props) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold text-lg mb-1">
        {cardNumber}. {customer.name}
      </h3>
      {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
      {customer.region && <p className="text-sm text-gray-600">지역: {customer.region}</p>}
    </div>
  );
} 