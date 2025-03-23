/**
 * 전문점 순위 페이지
 */

"use client";

import { useState } from 'react';
import MonthSelector from '@/components/dashboard/MonthSelector';
import ShopRankingTable from '@/components/dashboard/ShopRankingTable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ShopsRankingPage() {
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 정렬 기준 (당월매출, 월평균매출, 누적매출)
  const [sortBy, setSortBy] = useState<'current' | 'average' | 'cumulative'>('current');
  
  // TODO: 실제 구현 시 KOL ID를 세션/인증 정보에서 가져오거나 props로 전달받아야 함
  const kolId = 1; // 예시 KOL ID
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };
  
  // 정렬 기준 변경 처리
  const handleSortByChange = (newSortBy: 'current' | 'average' | 'cumulative') => {
    setSortBy(newSortBy);
  };
  
  // 엑셀 다운로드 처리 (실제 구현 시 API 호출로 대체)
  const handleDownloadExcel = () => {
    alert('엑셀 다운로드 기능은 현재 개발 중입니다.');
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">전문점 순위</h1>
        <MonthSelector value={yearMonth} onChange={handleMonthChange} />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={sortBy === 'current' ? 'default' : 'outline'}
            onClick={() => handleSortByChange('current')}
          >
            당월 매출
          </Button>
          <Button
            variant={sortBy === 'average' ? 'default' : 'outline'}
            onClick={() => handleSortByChange('average')}
          >
            월평균 매출
          </Button>
          <Button
            variant={sortBy === 'cumulative' ? 'default' : 'outline'}
            onClick={() => handleSortByChange('cumulative')}
          >
            누적 매출
          </Button>
        </div>
        
        <Button variant="outline" onClick={handleDownloadExcel}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>
      
      <ShopRankingTable
        kolId={kolId}
        yearMonth={yearMonth}
        sortBy={sortBy}
      />
      
      <div className="text-sm text-gray-500">
        * 당월 매출: {yearMonth} 기준 전문점 매출액<br />
        * 월평균 매출: 최근 3개월 간 월평균 매출액<br />
        * 누적 매출: 전체 기간 누적 매출액
      </div>
    </div>
  );
} 