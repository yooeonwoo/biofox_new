'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import type { UserFilters } from '@/types/biofox-admin';

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function UserFilters({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
}: UserFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value === '') {
      onFiltersChange({ ...filters, search: value });
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key as keyof UserFilters] !== undefined
  ).length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="이름, 이메일, 샵명으로 검색..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button onClick={onSearch} disabled={loading}>
              검색
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filters.status || 'all'}
              onValueChange={value =>
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="승인 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">승인 대기</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거절됨</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.role || 'all'}
              onValueChange={value =>
                handleFilterChange('role', value === 'all' ? undefined : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 역할</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="kol">KOL</SelectItem>
                <SelectItem value="ol">OL</SelectItem>
                <SelectItem value="shop_owner">전문점 원장</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filters.hasRelationship === true
                  ? 'yes'
                  : filters.hasRelationship === false
                    ? 'no'
                    : 'all'
              }
              onValueChange={value =>
                handleFilterChange('hasRelationship', value === 'all' ? undefined : value === 'yes')
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="소속 여부" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="yes">소속 있음</SelectItem>
                <SelectItem value="no">소속 없음</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={filters.dateRange}
              onDateChange={range => handleFilterChange('dateRange', range)}
              placeholder="가입일 범위"
              disabled={loading}
            />
          </div>

          {/* Active filters display */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">활성 필터:</span>
              <Badge variant="secondary">{activeFilterCount}개</Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="mr-1 h-4 w-4" />
                초기화
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
