'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface CommissionFilters {
  month?: string;
  kol_id?: string;
  status?: 'calculated' | 'adjusted' | 'paid' | 'cancelled';
}

interface CommissionFiltersProps {
  filters: CommissionFilters;
  onFiltersChange: (filters: CommissionFilters) => void;
}

export function CommissionFilters({ filters, onFiltersChange }: CommissionFiltersProps) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  // 최근 12개월 생성
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().substring(0, 7);
  });

  const handleReset = () => {
    onFiltersChange({ month: currentMonth });
  };

  const hasActiveFilters =
    filters.kol_id || filters.status || (filters.month && filters.month !== currentMonth);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">필터</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2 text-xs">
            <X className="mr-1 h-3 w-3" />
            초기화
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>정산월</Label>
          <Select
            value={filters.month || currentMonth}
            onValueChange={value => onFiltersChange({ ...filters, month: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>KOL/OL 검색</Label>
          <Input
            placeholder="이름으로 검색"
            value={filters.kol_id || ''}
            onChange={e => onFiltersChange({ ...filters, kol_id: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>상태</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={value =>
              onFiltersChange({
                ...filters,
                status:
                  value === 'all'
                    ? undefined
                    : (value as 'calculated' | 'adjusted' | 'paid' | 'cancelled'),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="calculated">계산완료</SelectItem>
              <SelectItem value="adjusted">조정됨</SelectItem>
              <SelectItem value="paid">지급완료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
