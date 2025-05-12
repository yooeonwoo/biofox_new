'use client';

import { useState } from 'react';
import { 
  ArrowUpIcon, 
  MinusIcon,
  CrownIcon,
  TrendingUpIcon
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return "0원";
  
  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  
  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 510만 4740원)
      return `${man.toLocaleString()}만 ${rest}원`;
    }
    // 나머지가 없는 경우 (예: 500만원)
    return `${man.toLocaleString()}만원`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${value.toLocaleString()}원`;
  }
};

// Shop 데이터 타입 정의
interface ShopData {
  id: number;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_owner_kol?: boolean; // 직영점 여부 추가
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
  };
}

// Props 타입에서 limit 제거
interface StoreRankingTableProps {
  shops: ShopData[];
}

export default function StoreRankingTable({ shops }: StoreRankingTableProps) {
  // 복합 정렬 기준 적용: 매출 높은순 → KOL 직영점 우선 → 이름순
  const sortedShops = [...shops]
    .sort((a, b) => {
      // 1. 매출 높은순 (내림차순)
      if (b.sales.total !== a.sales.total) {
        return b.sales.total - a.sales.total;
      }
      
      // 2. KOL 직영점 우선 (true가 앞으로)
      if ((a.is_owner_kol || false) !== (b.is_owner_kol || false)) {
        return (b.is_owner_kol || false) ? 1 : -1;
      }
      
      // 3. 이름순 오름차순
      const aName = a.shop_name || a.ownerName || '';
      const bName = b.shop_name || b.ownerName || '';
      return aName.localeCompare(bName);
    })
    .map((shop, index) => ({ ...shop, rank: index + 1 }));

  // 배경색 결정 함수 (hover 색상 변경)
  const getRowColorClass = (rank: number, sales: number) => {
    // 매출 0 이하일 때 hover 효과 변경
    if (sales <= 0) return "hover:bg-gray-100"; 
    switch(rank) {
      case 1: return "bg-yellow-50 hover:bg-yellow-100"; 
      case 2: return "bg-blue-50 hover:bg-blue-100";
      case 3: return "bg-orange-50 hover:bg-orange-100"; 
      // 4위 이상일 때 hover 효과 변경
      default: return "hover:bg-gray-100";
    }
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="p-2 sm:p-4">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-[40px] sm:w-[60px] px-2 sm:px-4 py-2 sm:py-3 text-center"></TableHead>
              <TableHead className="w-[30px] px-0 py-2 sm:py-3"></TableHead>
              <TableHead className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 font-medium">전문점명</TableHead>
              <TableHead className="px-2 sm:px-4 pr-4 sm:pr-9 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-500 font-medium">당월 매출</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-16 sm:h-24 px-2 sm:px-4 py-2 sm:py-3 text-center">
                  <span className="font-bold text-xs sm:text-base">전문점 데이터가 없습니다.</span>
                </TableCell>
              </TableRow>
            ) : (
              sortedShops.map((shop, index) => (
                <TableRow 
                  key={shop.id}
                  className={`${getRowColorClass(shop.rank, shop.sales.total)} ${index === sortedShops.length - 1 ? 'border-b' : 'border-t'}`}
                >
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">
                    <div className="flex items-center justify-center">
                      {shop.rank <= 3 && shop.sales.total > 0 ? (
                        <div className={`
                          flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-bold
                          ${shop.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                            shop.rank === 2 ? 'bg-blue-100 text-blue-800' : 
                            'bg-orange-100 text-orange-800'}
                        `}>
                          {shop.rank}
                        </div>
                      ) : (
                        <span className="font-bold text-gray-500 text-xs sm:text-base">{shop.rank}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-0 py-2 sm:py-3 w-[30px] text-center">
                    {shop.is_owner_kol && (
                      <CrownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="font-bold text-xs sm:text-base">{shop.shop_name || shop.ownerName}</span>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="flex items-center justify-end">
                      <span className="font-bold text-xs sm:text-base">{formatToManUnit(shop.sales.total)}</span>
                      {shop.sales.total > 0 ? (
                        <TrendingUpIcon className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <MinusIcon className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 