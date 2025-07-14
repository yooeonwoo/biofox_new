'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
// TODO: Supabase 인증으로 교체 예정
import Link from 'next/link';
import { 
  CoinsIcon,
  TrendingUp,
  TrendingDown,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  AlertTriangle
} from "lucide-react";
import SalesChart from "../../components/sales-chart";
import StoreRankingTable from "../../components/store-ranking-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";

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

// 대시보드 데이터 타입 정의
interface DashboardData {
  kol: {
    id: number;
    name: string;
    shopName: string;
  };
  sales: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  allowance: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  shops: {
    total: number;
    ordering: number;
    notOrdering: number;
    lastAddedDate?: string;
  };
}

// 전문점 데이터 타입 정의
interface ShopData {
  id: number;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_self_shop?: boolean;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
    commission?: number;
  };
}

// 태스크 데이터 타입 정의
interface ActivityData {
  id: number;
  shopId?: number;
  shopName?: string;
  activityDate: string;
  content: string;
  createdAt: string;
  timeAgo: string;
  icon: React.ReactNode;
}

export default function KolNewPage() {
  // TODO: Supabase 인증으로 교체 예정
  const [isKol, setIsKol] = useState<boolean | null>(true); // 임시로 KOL로 설정
  
  const { 
    data: dashboardCompleteData, 
    isLoading: loading, 
    error, 
    refetch 
  } = useDashboardData();

  useEffect(() => {
    // TODO: Supabase 인증 로직 구현
    setIsKol(true); // 임시로 KOL로 설정
  }, []);

  const dashboardData = dashboardCompleteData?.dashboard;
  const shopsData = dashboardCompleteData?.shops?.shops || [];

  const handleRetry = () => {
    refetch();
  };

  if (isKol === null || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">데이터 로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">대시보드 정보를 불러오는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isKol) {
    return redirect('/');
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center items-center text-destructive mb-2">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <CardTitle className="text-center text-destructive">에러 발생</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{errorMessage}</p>
          </CardContent>
          <CardFooter>
            <Button variant="default" onClick={handleRetry} className="w-full">
              다시 시도
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{dashboardData?.kol?.shopName || "..."} - {dashboardData?.kol?.name || "..."} KOL</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 w-full overflow-hidden">
                <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap">당월 매출:</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                  {dashboardData?.sales?.currentMonth !== undefined 
                    ? formatToManUnit(dashboardData.sales.currentMonth)
                    : "0원"}
                </span>
              </div>
              <div className="rounded-full bg-yellow-100 p-1 sm:p-1.5 text-yellow-700 flex-shrink-0">
                 <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1 invisible h-[21px] sm:h-[24px]">
              <div className="flex items-center text-[10px] sm:text-xs">
                <span>&nbsp;</span>
              </div>
            </div>
            <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 w-full overflow-hidden">
                <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap">당월 수당:</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                  {dashboardData?.allowance?.currentMonth !== undefined 
                    ? formatToManUnit(dashboardData.allowance.currentMonth)
                    : "0원"}
                </span>
              </div>
              <div className="rounded-full bg-purple-100 p-1 sm:p-1.5 text-purple-700 flex-shrink-0">
                 <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            {dashboardData?.allowance?.growth !== undefined && (
              <div className={`mt-1 flex items-center text-[10px] sm:text-xs ${dashboardData.allowance.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.allowance.growth >= 0 ? (
                  <TrendingUp className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span>전월 대비 {Math.abs(dashboardData.allowance.growth) >= 10000 
                  ? formatToManUnit(Math.abs(dashboardData.allowance.growth)) 
                  : Math.abs(dashboardData.allowance.growth).toLocaleString() + '원'} {dashboardData.allowance.growth >= 0 ? '증가' : '감소'}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
               <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-lg md:text-xl font-bold">전문점 현황:</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold">
                   {dashboardData?.shops?.total || 0}곳
                </span>
              </div>
              <div className="rounded-full bg-blue-100 p-1 sm:p-1.5 text-blue-700">
                 <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1 text-[10px] sm:text-xs text-orange-500">
              전문점 관리 현황
            </div>
            <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />
             <div className="flex items-center justify-between">
               <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-lg md:text-xl font-bold">당월 주문 전문점:</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold">
                  {dashboardData?.shops?.ordering || 0}곳
                </span>
              </div>
              <div className="rounded-full bg-green-100 p-1 sm:p-1.5 text-green-700">
                 <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1 text-[10px] sm:text-xs text-red-500">
              {dashboardData?.shops?.notOrdering || 0}곳이 아직 주문하지 않았습니다.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card className="flex flex-col h-full"> 
          <CardContent className="flex flex-1 flex-col p-0 overflow-auto">
            <StoreRankingTable shops={shopsData} />
          </CardContent>
          <CardFooter className="mt-auto border-t px-6 py-3">
            <div className="ml-auto">
              <Button asChild variant="ghost" size="sm">
                <Link href="/kol-new/stores"> 
                  모든 전문점 보기
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base md:text-lg">나의 월별 수당</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <SalesChart kolId={dashboardData?.kol?.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}