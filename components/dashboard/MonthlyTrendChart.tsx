/**
 * 월별 트렌드 차트 컴포넌트
 * 
 * 최근 12개월 매출 및 수당 추이 차트
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface MonthlyTrendChartProps {
  kolId: number;
  limit?: number; // 표시할 개월 수 (기본값: 12)
}

// API 응답 데이터 타입
interface MonthlySummaryItem {
  yearMonth: string; // YYYY-MM 형식
  monthlySales: number;
  monthlyCommission: number;
}

// 차트에 표시할 데이터 타입
interface ChartDataItem extends MonthlySummaryItem {
  month: string; // 표시용 월 (예: '23.01')
}

export default function MonthlyTrendChart({ kolId, limit = 12 }: MonthlyTrendChartProps) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sales/monthly-summary/list?kolId=${kolId}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
          // 데이터를 최근 월 기준으로 정렬 (오래된 월이 먼저 오도록)
          const sortedData = [...result.data].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
          
          // 표시용 월 형식 변환 (예: '2023-01' -> '23.01')
          const formattedData = sortedData.map(item => ({
            ...item,
            month: formatYearMonth(item.yearMonth)
          }));
          
          setData(formattedData);
        } else {
          throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('월별 추이 데이터 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [kolId, limit]);
  
  // 연월 형식 변환 (YYYY-MM -> YY.MM)
  const formatYearMonth = (yearMonth: string): string => {
    const [year, month] = yearMonth.split('-');
    return `${year.slice(2)}.${month}`;
  };
  
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>월별 매출/수당 추이</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] bg-gray-100 animate-pulse"></CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>월별 매출/수당 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>월별 매출/수당 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">매출 추이 데이터가 없습니다.</div>
        </CardContent>
      </Card>
    );
  }
  
  // 숫자 포맷 함수
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };
  
  // 툴팁 커스텀 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-blue-500">
            매출: ₩{formatNumber(payload[0].value)}
          </p>
          <p className="text-green-500">
            수당: ₩{formatNumber(payload[1].value)}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>월별 매출/수당 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="monthlySales"
                name="매출"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Bar
                yAxisId="right"
                dataKey="monthlyCommission"
                name="수당"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 