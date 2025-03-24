"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import MonthSelector from '@/components/dashboard/MonthSelector';
import SalesSummary from '@/components/dashboard/SalesSummary';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import ProductRatioChart from '@/components/dashboard/ProductRatioChart';
import ShopStatusWidget from '@/components/dashboard/ShopStatusWidget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

// 대시보드 데이터 인터페이스
interface AdminDashboardData {
  yearMonth: string;
  totalKolsCount: number;
  totalShopsCount: number;
  activeKolsCount: number;
  activeShopsCount: number;
  totalSales: number;
  productSales: number;
  deviceSales: number;
  totalCommission: number;
  previousMonthSales: number;
  previousMonthCommission: number;
  salesGrowthRate: string;
  commissionGrowthRate: string;
}

export default function AdminDashboardPage() {
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 로딩 상태 관리
  const [loading, setLoading] = useState<boolean>(true);
  
  // 대시보드 데이터
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  
  // 토스트 메시지
  const { toast } = useToast();
  
  // 전체 KOL ID (관리자는 전체 KOL의 데이터를 볼 수 있음)
  const allKolId = 0; // 0은 전체 KOL을 의미하는 특수 ID로 가정
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };

  // 대시보드 데이터 로드
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/dashboard?yearMonth=${yearMonth}`);
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error("대시보드 데이터 로드 오류:", error);
        toast({
          title: "데이터 로드 실패",
          description: error instanceof Error ? error.message : "대시보드 데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [yearMonth, toast]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 대시보드 컨트롤 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">매출 및 수당 현황</h1>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>

      {/* 요약 카드 섹션 */}
      <SalesSummary kolId={allKolId} yearMonth={yearMonth} />
      
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">월별 추이</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <MonthlyTrendChart kolId={allKolId} />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 grid grid-cols-1 gap-4 md:gap-6">
          {/* 제품별 매출 비율 차트 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <ProductRatioChart kolId={allKolId} yearMonth={yearMonth} />
            </CardContent>
          </Card>
          
          {/* 전문점 활성 현황 위젯 */}
          {dashboardData && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base md:text-lg">전문점 활성 현황</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <ShopStatusWidget
                  activeShops={dashboardData.activeShopsCount}
                  totalShops={dashboardData.totalShopsCount}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* KOL 활성 현황 위젯 */}
      {dashboardData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">KOL 활성 현황</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">활성 KOL</p>
                <p className="text-lg md:text-2xl font-bold">{dashboardData.activeKolsCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">전체 KOL</p>
                <p className="text-lg md:text-2xl font-bold">{dashboardData.totalKolsCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">활성 비율</p>
                <p className="text-lg md:text-2xl font-bold">
                  {dashboardData.totalKolsCount > 0
                    ? `${Math.round((dashboardData.activeKolsCount / dashboardData.totalKolsCount) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 