/**
 * 제품별 매출 비율 차트 컴포넌트
 * 
 * 제품별 매출 비율을 파이 차트로 표시
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface ProductRatioChartProps {
  kolId?: number;
  shopId?: number;
  yearMonth: string;
}

// API 응답 데이터 타입
interface ProductRatio {
  productId: number;
  productName: string;
  salesAmount: number;
  salesRatio: string; // decimal 타입이므로 문자열
}

// 차트에 표시할 최대 제품 수
const MAX_PRODUCTS_TO_SHOW = 5;

// 차트 색상 배열
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#0891b2'];

export default function ProductRatioChart({ kolId, shopId, yearMonth }: ProductRatioChartProps) {
  const [data, setData] = useState<ProductRatio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 쿼리 파라미터 구성
        const params = new URLSearchParams();
        if (kolId) params.append('kolId', kolId.toString());
        if (shopId) params.append('shopId', shopId.toString());
        params.append('yearMonth', yearMonth);
        
        const response = await fetch(`/api/sales/product-ratios?${params.toString()}`);
        
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
    
    if (kolId || shopId) {
      fetchData();
    } else {
      setError('전문점 ID 또는 KOL ID가 필요합니다.');
      setLoading(false);
    }
  }, [kolId, shopId, yearMonth]);
  
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>제품별 매출 비율</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] bg-gray-100 animate-pulse"></CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>제품별 매출 비율</CardTitle>
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
          <CardTitle>제품별 매출 비율</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">제품 매출 데이터가 없습니다.</div>
        </CardContent>
      </Card>
    );
  }
  
  // 데이터 처리: 상위 N개 제품 + 기타
  const processChartData = () => {
    if (data.length <= MAX_PRODUCTS_TO_SHOW) {
      return data.map(item => ({
        ...item,
        salesRatio: Number(item.salesRatio) * 100 // 백분율로 변환
      }));
    }
    
    // 매출액 기준 정렬
    const sortedData = [...data].sort((a, b) => b.salesAmount - a.salesAmount);
    
    // 상위 N개 제품
    const topProducts = sortedData.slice(0, MAX_PRODUCTS_TO_SHOW - 1);
    
    // 나머지 제품들을 '기타'로 묶음
    const otherProducts = sortedData.slice(MAX_PRODUCTS_TO_SHOW - 1);
    const otherSalesAmount = otherProducts.reduce((sum, item) => sum + item.salesAmount, 0);
    const otherSalesRatio = otherProducts.reduce((sum, item) => sum + Number(item.salesRatio), 0);
    
    return [
      ...topProducts.map(item => ({
        ...item,
        salesRatio: Number(item.salesRatio) * 100 // 백분율로 변환
      })),
      {
        productId: 0,
        productName: '기타',
        salesAmount: otherSalesAmount,
        salesRatio: otherSalesRatio * 100 // 백분율로 변환
      }
    ];
  };
  
  const chartData = processChartData();
  
  // 차트 툴팁 커스텀 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{data.productName}</p>
          <p>
            매출액: {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(data.salesAmount)}
          </p>
          <p>
            비율: {data.salesRatio.toFixed(1)}%
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // 범례 커스텀 렌더러
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center">
            <span
              className="inline-block w-3 h-3 mr-1 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.payload.productName} ({entry.payload.salesRatio.toFixed(1)}%)</span>
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>제품별 매출 비율</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="salesAmount"
                nameKey="productName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 