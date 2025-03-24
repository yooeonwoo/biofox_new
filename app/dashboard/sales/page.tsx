/**
 * 매출 및 수당 대시보드 페이지
 */

"use client";

import { useState, useEffect } from 'react';
import MonthSelector from '@/components/dashboard/MonthSelector';
import SalesSummary from '@/components/dashboard/SalesSummary';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import ProductRatioChart from '@/components/dashboard/ProductRatioChart';
import ShopStatusWidget from '@/components/dashboard/ShopStatusWidget';

export default function SalesDashboard() {
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // TODO: 실제 구현 시 KOL ID를 세션/인증 정보에서 가져오거나 props로 전달받아야 함
  const kolId = 1; // 예시 KOL ID
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">매출 및 수당 현황</h1>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>
      
      {/* 요약 카드 섹션 */}
      <SalesSummary kolId={kolId} yearMonth={yearMonth} />
      
      {/* 월별 추이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart kolId={kolId} />
        </div>
        
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {/* 제품별 매출 비율 차트 */}
          <ProductRatioChart kolId={kolId} yearMonth={yearMonth} />
          
          {/* 전문점 활성 현황 위젯 */}
          <ActiveShopsWidget kolId={kolId} yearMonth={yearMonth} />
        </div>
      </div>
    </div>
  );
}

// 전문점 활성 현황 위젯 래퍼 컴포넌트
function ActiveShopsWidget({ kolId, yearMonth }: { kolId: number; yearMonth: string }) {
  const [data, setData] = useState<{ activeShopsCount: number; totalShopsCount: number } | null>(null);
  
  // useEffect로 데이터 로드
  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/sales/monthly-summary?kolId=${kolId}&yearMonth=${yearMonth}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData({
            activeShopsCount: result.data.activeShopsCount,
            totalShopsCount: result.data.totalShopsCount
          });
        }
      }
    }
    
    fetchData();
  }, [kolId, yearMonth]);
  
  if (!data) {
    return <div className="h-full w-full bg-gray-100 animate-pulse"></div>;
  }
  
  return (
    <ShopStatusWidget
      activeShops={data.activeShopsCount}
      totalShops={data.totalShopsCount}
    />
  );
} 