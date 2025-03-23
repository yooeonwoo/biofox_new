/**
 * 요약 카드 컴포넌트
 * 
 * 대시보드에서 주요 지표를 카드 형태로 표시
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number; // 증감률 (%)
  valuePrefix?: string; // 값 앞에 표시할 문자 (예: ₩)
  valueSuffix?: string; // 값 뒤에 표시할 문자 (예: 원, %)
  className?: string;
  formatter?: (value: number | string) => string; // 값 포맷팅 함수
}

export default function SummaryCard({
  title,
  value,
  icon,
  trend,
  valuePrefix = "",
  valueSuffix = "",
  className = "",
  formatter = (val) => typeof val === 'number' ? val.toLocaleString() : val
}: SummaryCardProps) {
  // 증감률 표시 처리
  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;
    
    const formattedTrend = Math.abs(trend).toFixed(1);
    
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{formattedTrend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>-{formattedTrend}%</span>
        </div>
      );
    } else {
      return <div className="text-gray-500 text-sm">변동 없음</div>;
    }
  };
  
  return (
    <Card className={`shadow-sm overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <div className="text-2xl font-bold">
              {valuePrefix}{formatter(value)}{valueSuffix}
            </div>
            {renderTrend()}
          </div>
          {icon && (
            <div className="rounded-full p-2 bg-blue-50">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 