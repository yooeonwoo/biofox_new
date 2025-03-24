/**
 * 월별 트렌드 차트 컴포넌트
 * 
 * 매출 및 수당 월별 트렌드를 라인 차트로 표시
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface MonthlyTrendChartProps {
  kolId: number;
  months?: number; // 조회할 월의 수 (기본값: 6)
}

// 월별 트렌드 데이터 타입
interface TrendData {
  yearMonth: string;
  totalSales: number;
  productSales: number;
  deviceSales: number;
  totalCommission: number;
  activeKolsCount: number;
  totalKolsCount: number;
}

export default function MonthlyTrendChart({ kolId, months = 6 }: MonthlyTrendChartProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let apiUrl = `/api/admin/dashboard/trends?months=${months}`;
        
        // KOL ID가 0이 아닌 경우 (특정 KOL 조회)
        if (kolId !== 0) {
          apiUrl = `/api/kol/sales/trends?kolId=${kolId}&months=${months}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
          // 월 형식을 'YYYY-MM'에서 'YY년 MM월'로 변환
          const formattedData = result.data.map((item: TrendData) => {
            const [year, month] = item.yearMonth.split('-');
            return {
              ...item,
              display: `${year.slice(2)}년 ${month}월`
            };
          });
          
          setData(formattedData);
        } else {
          throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('월별 트렌드 데이터 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [kolId, months]);
  
  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {new Intl.NumberFormat('ko-KR').format(entry.value)}원
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">월별 매출/수당 트렌드</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-80 text-red-500">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-gray-500">
            월별 트렌드 데이터가 없습니다.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="display" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  name="전체 매출"
                  stroke="#2563eb"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCommission"
                  name="전체 수당"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                {kolId === 0 && (
                  <Line
                    type="monotone"
                    dataKey="productSales"
                    name="제품 매출"
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                  />
                )}
                {kolId === 0 && (
                  <Line
                    type="monotone"
                    dataKey="deviceSales"
                    name="기기 매출"
                    stroke="#8b5cf6"
                    strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 