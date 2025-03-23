/**
 * 수당 내역 페이지
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MonthSelector from '@/components/dashboard/MonthSelector';

// 수당 내역 페이지 인터페이스 정의
interface ICommissionHistoryItem {
  id: number;
  date: string;
  shopName: string;
  amount: number;
  status: 'completed' | 'pending';
  note?: string;
}

interface IMonthlySummary {
  yearMonth: string;
  totalCommission: number;
  settledCommission: number;
  pendingCommission: number;
}

export default function CommissionsPage() {
  // 현재 연월 (YYYY-MM 형식)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 정산 상태 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 수당 내역 데이터
  const [commissionHistory, setCommissionHistory] = useState<ICommissionHistoryItem[]>([]);
  
  // 월별 수당 요약 데이터
  const [monthlySummary, setMonthlySummary] = useState<IMonthlySummary[]>([]);
  
  // TODO: KOL ID는 세션/인증 정보에서 가져오도록 수정
  const kolId = 1; // 예시 KOL ID
  
  // 월 선택 처리
  const handleMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth);
  };
  
  // 정산 상태 필터 처리
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  // 데이터 로드
  useEffect(() => {
    // 데이터 로드 함수
    const fetchData = async () => {
      try {
        // 수당 내역 데이터 로드
        const historyResponse = await fetch(
          `/api/sales/commission-history?kolId=${kolId}&yearMonth=${yearMonth}&status=${statusFilter}`
        );
        
        if (historyResponse.ok) {
          const historyResult = await historyResponse.json();
          if (historyResult.success) {
            setCommissionHistory(historyResult.data);
          }
        }
        
        // 월별 수당 요약 데이터 로드
        const summaryResponse = await fetch(
          `/api/sales/commission-summary?kolId=${kolId}`
        );
        
        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json();
          if (summaryResult.success) {
            setMonthlySummary(summaryResult.data);
          }
        }
        
        /* 임시 데이터 (실제 API 연동으로 대체)
        const mockHistory: ICommissionHistoryItem[] = [
          {
            id: 1,
            date: "2023-08-15",
            shopName: "뷰티샵 A",
            amount: 150000,
            status: "completed"
          },
          {
            id: 2,
            date: "2023-08-10",
            shopName: "뷰티샵 B",
            amount: 90000,
            status: "pending"
          },
          {
            id: 3,
            date: "2023-08-05",
            shopName: "뷰티샵 C",
            amount: 120000,
            status: "completed"
          }
        ];
        
        // 필터링 적용
        if (statusFilter !== 'all') {
          const filteredHistory = mockHistory.filter(item => 
            statusFilter === 'completed' ? item.status === 'completed' : item.status === 'pending'
          );
          setCommissionHistory(filteredHistory);
        } else {
          setCommissionHistory(mockHistory);
        }
        
        // 임시 월별 수당 요약 데이터
        setMonthlySummary([
          {
            yearMonth: "2023-08",
            totalCommission: 1500000,
            settledCommission: 900000,
            pendingCommission: 600000
          },
          {
            yearMonth: "2023-07",
            totalCommission: 1200000,
            settledCommission: 1200000,
            pendingCommission: 0
          }
        ]);
        */
      } catch (error) {
        console.error('수당 내역 데이터 로딩 오류:', error);
      }
    };
    
    fetchData();
  }, [kolId, yearMonth, statusFilter]);
  
  // 금액 표시 포맷 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">수당 내역</h1>
        <div className="flex items-center gap-4">
          <MonthSelector value={yearMonth} onChange={handleMonthChange} />
          
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정산 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="completed">정산 완료</SelectItem>
              <SelectItem value="pending">정산 대기</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 수당 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>수당 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>발생일</TableHead>
                <TableHead>전문점</TableHead>
                <TableHead className="text-right">수당 금액</TableHead>
                <TableHead>정산 상태</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionHistory.length > 0 ? (
                commissionHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.shopName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.amount)}원
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {item.status === 'completed' ? '정산 완료' : '정산 대기'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.note || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    수당 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* 월별 수당 요약 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 수당 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>연월</TableHead>
                <TableHead className="text-right">발생 수당</TableHead>
                <TableHead className="text-right">정산 수당</TableHead>
                <TableHead className="text-right">미정산 수당</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySummary.map((item) => (
                <TableRow key={item.yearMonth}>
                  <TableCell>{item.yearMonth}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalCommission)}원
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.settledCommission)}원
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.pendingCommission)}원
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 