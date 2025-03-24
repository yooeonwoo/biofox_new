/**
 * 제품별 매출 비율 차트
 * 
 * 특정 KOL 또는 전체 KOL의 제품별 매출 비율을 파이 차트로 표시
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

// 파이 차트 색상
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

interface ProductRatioChartProps {
  kolId: number;
  yearMonth: string;
}

// 제품 매출 비율 데이터 타입
interface ProductRatioData {
  id: number;
  yearMonth: string;
  productId: number;
  totalSalesAmount: number;
  salesRatio: string;
  salesGrowthRate: string;
  productName: string;
  productCategory: string;
}

export default function ProductRatioChart({ kolId, yearMonth }: ProductRatioChartProps) {
  const [data, setData] = useState<ProductRatioData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 차트 데이터로 변환
  const chartData = data.map((item, index) => ({
    name: item.productName,
    value: item.totalSalesAmount,
    ratio: parseFloat(item.salesRatio) * 100, // 백분율로 변환
    color: COLORS[index % COLORS.length]
  }));
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let apiUrl = `/api/admin/dashboard/products?yearMonth=${yearMonth}`;
        
        // KOL ID가 0이 아닌 경우 (특정 KOL 조회)
        if (kolId !== 0) {
          apiUrl = `/api/kol/sales/product-ratio?kolId=${kolId}&yearMonth=${yearMonth}`;
        }
        
        const response = await fetch(apiUrl);
        
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
        console.error('제품별 매출 비율 데이터 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [kolId, yearMonth]);
  
  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{`매출액: ${new Intl.NumberFormat('ko-KR').format(data.value)}원`}</p>
          <p className="text-sm">{`비율: ${data.ratio.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  // 커스텀 레전드
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">제품별 매출 비율</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            제품별 매출 데이터가 없습니다.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={renderCustomizedLegend}
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {!loading && !error && data.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">상위 매출 제품</h4>
            <ul className="text-xs space-y-1">
              {data.slice(0, 3).map((product, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-700">{product.productName}</span>
                  <span className="font-semibold">{(parseFloat(product.salesRatio) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 