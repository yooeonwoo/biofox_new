'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface ClinicalFilters {
  shop_id?: string;
  consent_status?: string;
  status?: string;
  subject_type?: string;
  search?: string;
  dateRange?: DateRange;
}

interface ClinicalFiltersProps {
  filters: ClinicalFilters;
  onFiltersChange: (filters: ClinicalFilters) => void;
  showConsentFilter?: boolean; // 관리자용
}

export function ClinicalFilters({
  filters,
  onFiltersChange,
  showConsentFilter = false,
}: ClinicalFiltersProps) {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.shop_id ||
    filters.consent_status ||
    filters.status ||
    filters.subject_type ||
    filters.search ||
    filters.dateRange;

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
          <Label>검색</Label>
          <Input
            placeholder="이름 또는 치료 항목"
            value={filters.search || ''}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>진행 상태</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={value =>
              onFiltersChange({
                ...filters,
                status: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="paused">일시중단</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>대상 구분</Label>
          <Select
            value={filters.subject_type || 'all'}
            onValueChange={value =>
              onFiltersChange({
                ...filters,
                subject_type: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="self">본인</SelectItem>
              <SelectItem value="customer">고객</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showConsentFilter && (
          <div className="space-y-2">
            <Label>동의 상태</Label>
            <Select
              value={filters.consent_status || 'consented'}
              onValueChange={value =>
                onFiltersChange({
                  ...filters,
                  consent_status: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consented">동의</SelectItem>
                <SelectItem value="no_consent">미동의</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>시작일</Label>
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(range: DateRange | undefined) =>
              onFiltersChange({ ...filters, dateRange: range })
            }
          />
        </div>

        {showConsentFilter && (
          <div className="space-y-2">
            <Label>샵 검색</Label>
            <Input
              placeholder="샵명 또는 원장님 이름"
              value={filters.shop_id || ''}
              onChange={e => onFiltersChange({ ...filters, shop_id: e.target.value })}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
