'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from 'next-themes';

// Props 타입 정의
interface SalesChartProps {
  kolId?: number;
}

// 월별 매출 데이터 타입
interface MonthlyData {
  month: string;
  sales: number;
  allowance: number;
}

export default function SalesChart({ kolId }: SalesChartProps) {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // KOL 월별 매출 및 수당 데이터 가져오기
  useEffect(() => {
    const fetchMonthlySales = async () => {
      if (!kolId) return;

      setLoading(true);
      setError(null);

      try {
        // 최근 6개월 데이터 가져오기
        const response = await fetch(`/api/kol-new/monthly-sales?kolId=${kolId}`);
        if (!response.ok) {
          throw new Error('월별 매출 데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error('차트 데이터 로드 에러:', err);
        setError('차트 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, [kolId]);

  // 차트가 준비되지 않았거나 kolId가 없는 경우 목업 데이터 사용
  const formattedData = chartData.length > 0 
    ? chartData
    : [
        { month: '11월', sales: 1500, allowance: 800 },
        { month: '12월', sales: 1800, allowance: 900 },
        { month: '01월', sales: 2000, allowance: 1000 },
        { month: '02월', sales: 2300, allowance: 1200 },
        { month: '03월', sales: 2000, allowance: 1100 },
        { month: '04월', sales: 4000, allowance: 2000 },
      ];

  // recharts의 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-2 shadow-md z-50">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-blue-500">
            매출: {payload[0].value.toLocaleString()}만원
          </p>
          <p className="text-xs text-purple-500">
            수당: {payload[1].value.toLocaleString()}만원
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">데이터 로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-destructive">
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorAllowance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="month" 
            className="text-xs" 
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            tickFormatter={(value) => `${value}만`}
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-xs font-medium">{value}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            name="매출" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorSales)" 
            activeDot={{ r: 6 }}
          />
          <Area 
            type="monotone" 
            dataKey="allowance" 
            name="수당" 
            stroke="#8b5cf6" 
            fillOpacity={1} 
            fill="url(#colorAllowance)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}