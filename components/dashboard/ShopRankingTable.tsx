/**
 * 전문점 순위 테이블 컴포넌트
 * 
 * 전문점 순위 목록을 테이블 형태로 표시
 */

"use client";

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Crown, 
  Medal, 
  Award
} from "lucide-react";
import Link from 'next/link';

interface ShopRankingTableProps {
  kolId: number;
  yearMonth: string;
  sortBy: 'current' | 'average' | 'cumulative';
  limit?: number;
}

// API 응답 데이터 타입
interface ShopRanking {
  rank: number;
  shopId: number;
  shopName: string;
  ownerName: string;
  currentSales: number;
  averageSales: number;
  cumulativeSales: number;
}

export default function ShopRankingTable({ 
  kolId, 
  yearMonth, 
  sortBy, 
  limit = 10 
}: ShopRankingTableProps) {
  const [data, setData] = useState<ShopRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/sales/shop-ranking?kolId=${kolId}&yearMonth=${yearMonth}&sortBy=${sortBy}&limit=${limit}`
        );
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('전문점 순위 데이터 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [kolId, yearMonth, sortBy, limit]);
  
  // 순위 아이콘 렌더링
  const renderRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="font-medium">{rank}</span>;
    }
  };
  
  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="rounded-md border animate-pulse">
        <div className="h-10 bg-gray-200"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 border-t"></div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (data.length === 0) {
    return <div className="text-gray-500">전문점 순위 데이터가 없습니다.</div>;
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">순위</TableHead>
            <TableHead>전문점명</TableHead>
            <TableHead>점주명</TableHead>
            <TableHead className="text-right">당월 매출</TableHead>
            <TableHead className="text-right">월평균 매출</TableHead>
            <TableHead className="text-right">누적 매출</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((shop) => (
            <TableRow 
              key={shop.shopId}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell className="text-center">
                {renderRankIcon(shop.rank)}
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/dashboard/shops/${shop.shopId}`} className="hover:underline">
                  {shop.shopName}
                </Link>
              </TableCell>
              <TableCell>{shop.ownerName}</TableCell>
              <TableCell className="text-right">
                <div className={`font-medium ${
                  sortBy === 'current' ? 'text-blue-600' : ''
                }`}>
                  {formatCurrency(shop.currentSales)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className={`font-medium ${
                  sortBy === 'average' ? 'text-blue-600' : ''
                }`}>
                  {formatCurrency(shop.averageSales)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className={`font-medium ${
                  sortBy === 'cumulative' ? 'text-blue-600' : ''
                }`}>
                  {formatCurrency(shop.cumulativeSales)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 