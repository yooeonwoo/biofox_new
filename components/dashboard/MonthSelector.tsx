/**
 * 월 선택기 컴포넌트
 * 
 * 매출 및 수당 대시보드에서 특정 연월 선택을 위한 컴포넌트
 */

"use client";

import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  value: string; // YYYY-MM 형식
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}

export default function MonthSelector({ 
  value, 
  onChange, 
  minYear = 2020, 
  maxYear = new Date().getFullYear() 
}: MonthSelectorProps) {
  // 현재 선택된 연월 파싱
  const [year, month] = value.split('-').map(Number);
  
  // 이전 월로 이동
  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    // 최소 연도 제한
    if (newYear < minYear) return;
    
    onChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };
  
  // 다음 월로 이동
  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    // 최대 연도 제한
    if (newYear > maxYear) return;
    
    onChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };
  
  // 년도 변경 처리
  const handleYearChange = (newYear: string) => {
    onChange(`${newYear}-${String(month).padStart(2, '0')}`);
  };
  
  // 월 변경 처리
  const handleMonthChange = (newMonth: string) => {
    onChange(`${year}-${newMonth}`);
  };
  
  // 년도 목록 생성
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => String(maxYear - i)
  );
  
  // 월 목록 생성
  const months = [
    { value: '01', label: '1월' },
    { value: '02', label: '2월' },
    { value: '03', label: '3월' },
    { value: '04', label: '4월' },
    { value: '05', label: '5월' },
    { value: '06', label: '6월' },
    { value: '07', label: '7월' },
    { value: '08', label: '8월' },
    { value: '09', label: '9월' },
    { value: '10', label: '10월' },
    { value: '11', label: '11월' },
    { value: '12', label: '12월' }
  ];
  
  return (
    <div className="flex items-center space-x-2 bg-white rounded-md p-1 border">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        disabled={year === minYear && month === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-1">
        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[6rem]">
            <SelectValue placeholder="년도 선택" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}년</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={String(month).padStart(2, '0')} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[5rem]">
            <SelectValue placeholder="월 선택" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        disabled={year === maxYear && month === 12}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 