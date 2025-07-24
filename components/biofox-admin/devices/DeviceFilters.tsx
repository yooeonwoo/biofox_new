'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DeviceFilters {
  shop_id?: string;
  kol_id?: string;
  dateRange?: DateRange;
}

interface DeviceFiltersProps {
  filters: DeviceFilters;
  onFiltersChange: (filters: DeviceFilters) => void;
}

export function DeviceFilters({ filters, onFiltersChange }: DeviceFiltersProps) {
  const datePresets = [
    {
      label: '오늘',
      value: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: '이번 주',
      value: {
        from: startOfWeek(new Date()),
        to: new Date(),
      },
    },
    {
      label: '이번 달',
      value: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: '지난 달',
      value: {
        from: startOfMonth(addDays(new Date(), -30)),
        to: endOfMonth(addDays(new Date(), -30)),
      },
    },
    {
      label: '최근 30일',
      value: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
  ];

  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.shop_id || filters.kol_id || filters.dateRange;

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>판매 기간</Label>
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(range: DateRange | undefined) =>
              onFiltersChange({ ...filters, dateRange: range })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>샵 검색</Label>
          <Input
            placeholder="샵명 또는 원장님 이름"
            value={filters.shop_id || ''}
            onChange={e => onFiltersChange({ ...filters, shop_id: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>KOL 검색</Label>
          <Input
            placeholder="KOL 이름"
            value={filters.kol_id || ''}
            onChange={e => onFiltersChange({ ...filters, kol_id: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
}
