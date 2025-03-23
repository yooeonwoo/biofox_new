"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import MonthSelector from '@/components/dashboard/MonthSelector';
import SalesSummary from '@/components/dashboard/SalesSummary';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import ProductRatioChart from '@/components/dashboard/ProductRatioChart';
import ShopStatusWidget from '@/components/dashboard/ShopStatusWidget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KolDashboardPage() {
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 예시 KOL ID (실제로는 로그인한 KOL의 ID를 가져와야 함)
  const kolId = 1;
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };

  // 활성 상점 데이터 (예시)
  const [shopData, setShopData] = useState<{ activeShopsCount: number; totalShopsCount: number } | null>(null);
  
  // 활성 상점 데이터 로드
  useEffect(() => {
    async function fetchShopData() {
      try {
        // 실제 구현시는 API 호출로 변경
        // 예시 데이터
        setShopData({
          activeShopsCount: 8,
          totalShopsCount: 10
        });
      } catch (error) {
        console.error("상점 데이터 로드 오류:", error);
      }
    }
    
    fetchShopData();
  }, [yearMonth]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 섹션 */}
      <div className="card-gradient p-6 mb-2 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">KOL 대시보드</h2>
        <p className="text-gray-700">
          소속 전문점의 매출 및 수당 현황을 확인할 수 있습니다. 이 페이지는 'kol' 역할을 가진 사용자만 접근할 수 있습니다.
        </p>
      </div>
      
      {/* 대시보드 컨트롤 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">매출 및 수당 현황</h1>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>

      {/* 요약 카드 섹션 */}
      <SalesSummary kolId={kolId} yearMonth={yearMonth} />
      
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart kolId={kolId} />
        </div>
        
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {/* 제품별 매출 비율 차트 */}
          <ProductRatioChart kolId={kolId} yearMonth={yearMonth} />
          
          {/* 전문점 활성 현황 위젯 */}
          {shopData && (
            <ShopStatusWidget
              activeShops={shopData.activeShopsCount}
              totalShops={shopData.totalShopsCount}
            />
          )}
        </div>
      </div>
      
      {/* 바로가기 카드 섹션 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
        <Card className="shadow-sm bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">내 프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">KOL 프로필 정보 및 수정</p>
            <button className="btn-primary w-full">프로필 관리</button>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">소속 전문점</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">나와 연결된 전문점 정보 조회</p>
            <Link href="/kol/stores" className="btn-primary w-full block text-center">전문점 목록</Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">상세 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">소속 전문점의 상세 매출 현황 확인</p>
            <Link href="/kol/sales" className="btn-primary w-full block text-center">매출 조회</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 