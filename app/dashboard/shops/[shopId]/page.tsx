/**
 * 전문점 상세 정보 페이지
 */

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MonthSelector from '@/components/dashboard/MonthSelector';
import ProductRatioChart from '@/components/dashboard/ProductRatioChart';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  MapPin, 
  User, 
  BarChart4,
  Phone
} from 'lucide-react';
import SummaryCard from '@/components/dashboard/SummaryCard';

// API 응답 데이터 타입
interface ShopDetailData {
  shopInfo: {
    id: number;
    name: string;
    ownerName: string;
    region: string;
  };
  salesInfo: {
    yearMonth: string;
    productSales: number;
    deviceSales: number;
    totalSales: number;
    commission: number;
  };
  productRatios: Array<{
    productId: number;
    productName: string;
    salesAmount: number;
    salesRatio: string;
  }>;
  monthlySales: Array<{
    yearMonth: string;
    productSales: number;
    commission: number;
  }>;
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [data, setData] = useState<ShopDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sales/shop-details/${shopId}?yearMonth=${yearMonth}`);
        
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
        console.error('전문점 상세 정보 조회 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [shopId, yearMonth]);
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };
  
  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // 월별 매출 추이 차트 데이터 가공
  const getMonthlyChartData = () => {
    if (!data?.monthlySales) return [];
    
    return data.monthlySales.map(item => {
      const [year, month] = item.yearMonth.split('-');
      return {
        month: `${year.slice(2)}.${month}`,
        매출: item.productSales,
        수당: item.commission
      };
    }).reverse(); // 최근 월이 오른쪽에 오도록 역순 정렬
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-red-500">{error}</div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/shops">
            <ChevronLeft className="h-4 w-4 mr-2" />
            전문점 목록으로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-gray-500">전문점 정보를 찾을 수 없습니다.</div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/shops">
            <ChevronLeft className="h-4 w-4 mr-2" />
            전문점 목록으로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/shops">
            <ChevronLeft className="h-4 w-4 mr-2" />
            전문점 목록
          </Link>
        </Button>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>
      
      {/* 전문점 기본 정보 카드 */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{data.shopInfo.name}</h1>
              <div className="space-y-1 text-gray-500">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>점주: {data.shopInfo.ownerName}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>지역: {data.shopInfo.region || '정보 없음'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                연락처 보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="제품 매출"
          value={data.salesInfo.productSales}
          valuePrefix="₩"
          icon={<BarChart4 className="h-5 w-5 text-blue-500" />}
        />
        
        <SummaryCard
          title="기기 매출"
          value={data.salesInfo.deviceSales}
          valuePrefix="₩"
          icon={<BarChart4 className="h-5 w-5 text-purple-500" />}
        />
        
        <SummaryCard
          title="총 매출"
          value={data.salesInfo.totalSales}
          valuePrefix="₩"
          icon={<BarChart4 className="h-5 w-5 text-green-500" />}
        />
        
        <SummaryCard
          title="수당"
          value={data.salesInfo.commission}
          valuePrefix="₩"
          icon={<BarChart4 className="h-5 w-5 text-orange-500" />}
        />
      </div>
      
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 제품별 매출 비율 차트 */}
        <div>
          <ProductRatioChart
            shopId={parseInt(shopId)}
            yearMonth={yearMonth}
          />
        </div>
        
        {/* 월별 매출/수당 추이 차트 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>월별 매출/수당 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 실제 차트 구현 */}
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">월별 매출/수당 차트는 기본 구현 완료 후 추가될 예정입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 월별 매출/수당 테이블 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>월별 매출/수당 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연월
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매출
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수당
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전월 대비
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.monthlySales.map((item, index) => {
                  const prevMonth = index < data.monthlySales.length - 1 ? data.monthlySales[index + 1] : null;
                  const salesChange = prevMonth ? ((item.productSales - prevMonth.productSales) / prevMonth.productSales) * 100 : 0;
                  
                  return (
                    <tr key={item.yearMonth}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.yearMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(item.productSales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(item.commission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {prevMonth ? (
                          <span className={`font-medium ${
                            salesChange > 0 ? 'text-green-600' : salesChange < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {salesChange > 0 ? '+' : ''}
                            {salesChange.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 