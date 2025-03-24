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
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 섹션 */}
      <div className="card-gradient p-6 mb-2 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">관리자 대시보드</h2>
        <p className="text-gray-700">
          전체 매출 및 KOL 수당 현황을 확인할 수 있습니다. 이 페이지는 '본사관리자' 역할을 가진 사용자만 접근할 수 있습니다.
        </p>
      </div>
      
      {/* 대시보드 컨트롤 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">매출 및 수당 현황</h1>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>

      {/* 요약 카드 섹션 */}
      <SalesSummary kolId={allKolId} yearMonth={yearMonth} />
      
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart kolId={allKolId} />
        </div>
        
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {/* 제품별 매출 비율 차트 */}
          <ProductRatioChart kolId={allKolId} yearMonth={yearMonth} />
          
          {/* 전문점 활성 현황 위젯 */}
          {dashboardData && (
            <ShopStatusWidget
              activeShops={dashboardData.activeShopsCount}
              totalShops={dashboardData.totalShopsCount}
            />
          )}
        </div>
      </div>
      
      {/* KOL 활성 현황 위젯 */}
      {dashboardData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">KOL 활성 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">활성 KOL</p>
                <p className="text-2xl font-bold">{dashboardData.activeKolsCount}</p>
              </div>
              <div>
                <p className="text-gray-600">전체 KOL</p>
                <p className="text-2xl font-bold">{dashboardData.totalKolsCount}</p>
              </div>
              <div>
                <p className="text-gray-600">활성 비율</p>
                <p className="text-2xl font-bold">
                  {dashboardData.totalKolsCount > 0
                    ? `${Math.round((dashboardData.activeKolsCount / dashboardData.totalKolsCount) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 관리 바로가기 카드 섹션 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">KOL 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">등록된 KOL 현황 및 관리 기능</p>
            <Link href="/admin/kols" className="btn-primary w-full block text-center">KOL 목록 보기</Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">전문점 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">전문점 정보 및 업데이트 관리</p>
            <Link href="/admin/stores" className="btn-primary w-full block text-center">전문점 관리</Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">판매 실적 및 상세 통계 데이터</p>
            <Link href="/admin/sales" className="btn-primary w-full block text-center">통계 보기</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 