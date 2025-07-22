'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return '0';

  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;

  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 510만 4740원)
      return `${man}만`;
    }
    // 나머지가 없는 경우 (예: 500만원)
    return `${man}만`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${(value / 1000).toFixed(0)}천`;
  }
};

// 툴팁에서 사용할 상세 포맷팅 함수
const formatDetailedAmount = (value: number): string => {
  if (value === 0) return '0원';

  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;

  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 2100만 4302원)
      return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`;
    }
    // 나머지가 없는 경우 (예: 2000만원)
    return `${man.toLocaleString()}만원`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${value.toLocaleString()}원`;
  }
};

// Props 타입 정의
interface SalesChartProps {
  kolId?: number;
}

// 월별 데이터 타입
interface MonthlyData {
  month: string;
  sales: number;
  allowance: number;
}

// 차트 설정 - 수당만 표시
const chartConfig = {
  allowance: {
    label: '수당',
    color: '#8b5cf6', // 보라색
  },
} satisfies Record<string, any>;

export default function SalesChart({ kolId }: SalesChartProps) {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // KOL 월별 수당 데이터 가져오기
  const salesData = useQuery(
    api.orders.getMonthlySales,
    kolId
      ? {
          shop_id: kolId as any,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }
      : 'skip'
  );

  // 데이터가 로드되면 차트 데이터 설정
  useEffect(() => {
    if (salesData && kolId) {
      // 최근 6개월 데이터 생성 (실제로는 여러 월의 데이터를 조합해야 함)
      const chartData = generateChartDataFromSales(salesData);
      setChartData(chartData);
      setLoading(false);
      setError(null);
    } else if (salesData === undefined && kolId) {
      setLoading(true);
    }
  }, [salesData, kolId]);

  // 차트가 준비되지 않았거나 kolId가 없는 경우
  if (chartData.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="flex h-[350px] items-center justify-center">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">수당 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-[350px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">데이터 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-[350px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#94a3b8"
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{
                  fill: '#64748b',
                  fontSize: 12,
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={value => formatToManUnit(value)}
                tick={{
                  fill: '#64748b',
                  fontSize: 12,
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    className="border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm"
                    formatter={(value, name) => [formatDetailedAmount(value as number), '']}
                  />
                }
              />
              <defs>
                <linearGradient id="fillAllowance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="allowance"
                type="natural"
                fill="url(#fillAllowance)"
                fillOpacity={0.4}
                stroke="#8b5cf6"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 헬퍼 함수: Convex 데이터를 차트 형식으로 변환
function generateChartDataFromSales(salesData: any): MonthlyData[] {
  // 임시로 현재 월 데이터를 기반으로 6개월 차트 데이터 생성
  const months: MonthlyData[] = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push({
      month: month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
      sales: i === 0 ? salesData.totalSales : Math.random() * salesData.totalSales, // TODO: 실제 월별 데이터로 교체
      allowance: i === 0 ? salesData.totalCommission : Math.random() * salesData.totalCommission,
    });
  }

  return months;
}
