/**
 * 매출/수당 요약 컴포넌트
 * 
 * 월별 매출 및 수당 요약 정보 표시
 */

"use client";

import { useState, useEffect } from 'react';
import SummaryCard from './SummaryCard';
import { BarChart, Coins, LineChart, TrendingUp } from 'lucide-react';

interface SalesSummaryProps {
  kolId: number;
  yearMonth: string;
}

// API 응답 데이터 타입
interface MonthlySummaryData {
  kolId: number;
  yearMonth: string;
  monthlySales: number;
  monthlyCommission: number;
  avgMonthlySales: string; // decimal 타입이므로 문자열
  cumulativeCommission: number;
  previousMonthSales: number;
  previousMonthCommission: number;
  activeShopsCount: number;
  totalShopsCount: number;
}

export default function SalesSummary({ kolId, yearMonth }: SalesSummaryProps) {
  const [data, setData] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 증감률 계산 함수
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sales/monthly-summary?kolId=${kolId}&yearMonth=${yearMonth}`);
        
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
        console.error('매출 요약 데이터 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [kolId, yearMonth]);
  
  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
      ))}
    </div>;
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (!data) {
    return <div className="text-gray-500">매출 데이터가 없습니다.</div>;
  }
  
  // 매출 증감률 계산
  const salesTrend = calculateTrend(data.monthlySales, data.previousMonthSales);
  
  // 수당 증감률 계산
  const commissionTrend = calculateTrend(data.monthlyCommission, data.previousMonthCommission);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SummaryCard
        title="당월 매출"
        value={data.monthlySales}
        valuePrefix="₩"
        trend={salesTrend}
        icon={<LineChart className="h-5 w-5 text-blue-500" />}
      />
      
      <SummaryCard
        title="당월 수당"
        value={data.monthlyCommission}
        valuePrefix="₩"
        trend={commissionTrend}
        icon={<Coins className="h-5 w-5 text-green-500" />}
      />
      
      <SummaryCard
        title="월평균 매출"
        value={Number(data.avgMonthlySales)}
        valuePrefix="₩"
        icon={<BarChart className="h-5 w-5 text-purple-500" />}
      />
      
      <SummaryCard
        title="누적 수당"
        value={data.cumulativeCommission}
        valuePrefix="₩"
        icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
      />
    </div>
  );
} 