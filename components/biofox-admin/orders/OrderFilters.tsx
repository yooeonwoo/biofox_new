'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  DollarSign,
  Store
} from 'lucide-react';
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface OrderFilters {
  shop_id?: string;
  date_range?: DateRange;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  has_commission?: boolean;
  is_self_shop?: boolean;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onSearch: () => void;
  loading?: boolean;
  shops?: Array<{ id: string; name: string; shop_name: string }>;
}

export function OrderFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
  shops = []
}: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const setDatePreset = (preset: string) => {
    const today = new Date();
    let range: DateRange | undefined;

    switch (preset) {
      case 'today':
        range = { from: today, to: today };
        break;
      case 'yesterday':
        const yesterday = addDays(today, -1);
        range = { from: yesterday, to: yesterday };
        break;
      case 'thisWeek':
        range = { from: startOfWeek(today), to: endOfWeek(today) };
        break;
      case 'thisMonth':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'lastMonth':
        const lastMonth = addDays(startOfMonth(today), -1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case 'last30Days':
        range = { from: addDays(today, -30), to: today };
        break;
    }

    handleFilterChange('date_range', range);
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof OrderFilters];
    return value !== undefined && value !== '';
  }).length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 날짜 프리셋 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('today')}
              disabled={loading}
            >
              <Calendar className="mr-2 h-4 w-4" />
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('yesterday')}
              disabled={loading}
            >
              어제
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('thisWeek')}
              disabled={loading}
            >
              이번 주
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('thisMonth')}
              disabled={loading}
            >
              이번 달
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('lastMonth')}
              disabled={loading}
            >
              지난 달
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatePreset('last30Days')}
              disabled={loading}
            >
              최근 30일
            </Button>
            <DatePickerWithRange
              date={filters.date_range}
              onDateChange={(range) => handleFilterChange('date_range', range)}
              placeholder="사용자 정의"
              disabled={loading}
              className="w-auto"
            />
          </div>

          {/* 기본 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              value={filters.shop_id || 'all'}
              onValueChange={(value) => handleFilterChange('shop_id', value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="전문점 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 전문점</SelectItem>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name} ({shop.shop_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="주문 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
                <SelectItem value="refunded">반품</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={loading}
            >
              <Filter className="mr-2 h-4 w-4" />
              고급 필터
            </Button>
          </div>

          {/* 고급 필터 */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">금액 범위</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="최소"
                    value={filters.min_amount || ''}
                    onChange={(e) => handleFilterChange('min_amount', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={loading}
                  />
                  <span>~</span>
                  <Input
                    type="number"
                    placeholder="최대"
                    value={filters.max_amount || ''}
                    onChange={(e) => handleFilterChange('max_amount', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Select
                value={
                  filters.has_commission === true ? 'yes' : 
                  filters.has_commission === false ? 'no' : 'all'
                }
                onValueChange={(value) => handleFilterChange('has_commission', 
                  value === 'all' ? undefined : value === 'yes'
                )}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="수수료 여부" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="yes">수수료 있음</SelectItem>
                  <SelectItem value="no">수수료 없음</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={
                  filters.is_self_shop === true ? 'yes' : 
                  filters.is_self_shop === false ? 'no' : 'all'
                }
                onValueChange={(value) => handleFilterChange('is_self_shop', 
                  value === 'all' ? undefined : value === 'yes'
                )}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="본인샵 여부" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="yes">본인샵</SelectItem>
                  <SelectItem value="no">일반샵</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 필터 액션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <>
                  <span className="text-sm text-gray-500">활성 필터:</span>
                  <Badge variant="secondary">{activeFilterCount}개</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                </>
              )}
            </div>
            <Button onClick={onSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
