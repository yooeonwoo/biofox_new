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
      return `${man}만`;
    }
    // 나머지가 없는 경우 (예: 500만원)
    return `${man}만`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${value}`;
  }
};

// 툴팁에서 사용할 상세 포맷팅 함수
const formatDetailedAmount = (value: number): string => {
  if (value === 0) return "0원";
  
  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  
  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 2100만 4302원)
      return `${man.toLocaleString()}만 ${rest}원`;
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
  allowance: number;
}

export default function SalesChart({ kolId }: SalesChartProps) {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // KOL 월별 수당 데이터 가져오기
  useEffect(() => {
    const fetchMonthlySales = async () => {
      if (!kolId) return;

      setLoading(true);
      setError(null);

      try {
        // 최근 6개월 데이터 가져오기
        const response = await fetch(`/api/kol-new/monthly-sales?kolId=${kolId}`);
        if (!response.ok) {
          throw new Error('월별 수당 데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        // 매출 데이터를 제외하고 수당 데이터만 사용
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

  // 차트가 준비되지 않았거나 kolId가 없는 경우 데이터 없음 표시
  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">데이터가 존재하지 않습니다.</div>;
  }

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
          <p className="text-xs text-purple-500">
            수당: {formatDetailedAmount(payload[0].value)}
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
          data={chartData}
          margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
        >
          <defs>
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
            tickFormatter={(value) => formatToManUnit(value)}
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
            width={50}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-xs font-medium">{value}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="allowance" 
            name="수당" 
            stroke="#8b5cf6" 
            fillOpacity={1} 
            fill="url(#colorAllowance)" 
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 