'use client';

import React, { useMemo } from 'react';
import { ArrowUpIcon } from 'lucide-react';

// Shop 데이터 타입 정의
interface ShopData {
  id: number;
  ownerName: string;
  region: string;
  status: string;
  createdAt: string;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
  };
}

// Props 타입 정의
interface StoreRankingTableProps {
  shops: ShopData[];
}

export default function StoreRankingTable({ shops = [] }: StoreRankingTableProps) {
  // 매출 기준 정렬된 상위 5개 전문점
  const topShops = useMemo(() => {
    return [...shops]
      .sort((a, b) => b.sales.total - a.sales.total)
      .slice(0, 5);
  }, [shops]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-6">
        <h2 className="text-lg font-medium">전문점 매출 순위</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="pb-2">전문점</th>
                <th className="pb-2">지역</th>
                <th className="pb-2 text-right">매출</th>
              </tr>
            </thead>
            <tbody>
              {topShops.length > 0 ? (
                topShops.map((shop, index) => (
                  <tr key={shop.id} className="border-b py-2 text-sm">
                    <td className="py-3">{shop.ownerName}</td>
                    <td>{shop.region || '-'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end">
                        <span>{(shop.sales.total || 0).toLocaleString()} 만</span>
                        {index === 0 && (
                          <ArrowUpIcon className="ml-1 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">
                    데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 