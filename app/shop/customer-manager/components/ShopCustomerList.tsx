"use client";

import ShopCustomerCard from "./ShopCustomerCard";
import { ShopCustomerData } from "../lib/types";
import { Card } from "@/components/ui/card";

interface Props {
  initialData: ShopCustomerData[];
}

export default function ShopCustomerList({ initialData }: Props) {

  if (!initialData || initialData.length === 0) {
    return (
        <Card className="text-center p-10 bg-gray-50 rounded-lg border-dashed">
            <p className="text-muted-foreground">등록된 고객이 없습니다.</p>
        </Card>
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