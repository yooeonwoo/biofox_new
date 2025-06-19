"use client";

import ShopCustomerCard from "./ShopCustomerCard";
import { ShopCustomerData } from "../lib/types";

interface Props {
  initialData: ShopCustomerData[];
}

export default function ShopCustomerList({ initialData }: Props) {

  if (!initialData || initialData.length === 0) {
    return (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">등록된 고객이 없습니다.</p>
        </div>
    );
  }

  return (
    <div className="space-y-5">
        {initialData.map((customer, idx) => (
            <ShopCustomerCard 
                key={idx} 
                customer={customer} 
                cardNumber={idx + 1}
            />
        ))}
    </div>
  );
} 