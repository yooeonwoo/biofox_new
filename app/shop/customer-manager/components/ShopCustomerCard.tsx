"use client";

import React from 'react';
import { ShopCustomerData } from '../lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
}

export default function ShopCustomerCard({ customer, cardNumber }: CustomerCardProps) {
  return (
    <Card className="border-2 border-black rounded-xl p-1.5 bg-transparent shadow-none">
        <CardContent className="bg-white rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">
                    {cardNumber}
                </div>
                <h3 className="text-lg font-semibold">{customer.name}</h3>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-700">담당자 : {customer.manager}</p>
                <p className="text-xs text-gray-500 mt-1">계약일 : {customer.contractDate}</p>
            </div>
        </CardContent>
    </Card>
  );
} 