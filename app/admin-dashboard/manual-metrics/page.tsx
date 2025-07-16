'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminNewKols } from '@/lib/hooks/adminNewKols'; // 이 훅의 경로가 admin-dashboard에서도 유효한지 확인 필요
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// 데이터 타입 정의
interface KolMetrics {
  monthly_sales: number;
  monthly_commission: number;
  total_shops_count: number;
  active_shops_count: number;
}

interface ShopMetric {
  shop_id: number;
  shop_name: string;
  total_sales: number;
}

interface FormValues {
  kolMetrics: KolMetrics;
  shopMetrics: ShopMetric[];
}

// API 응답 데이터 타입
interface MetricsData {
  kolMetrics: KolMetrics | null;
  shopMetrics: ShopMetric[];
}

// 년도와 월을 생성하는 헬퍼 함수
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
};

const months = Array.from({ length: 12 }, (_, i) => i + 1);

// API 호출 함수 (경로 수정 필요 가능성 있음)
const fetchMetrics = async (kolId: number, yearMonth: string): Promise<MetricsData> => {
  const response = await fetch(`/api/admin-dashboard/manual-metrics?kolId=${kolId}&yearMonth=${yearMonth}`);
  if (!response.ok) {
    throw new Error('데이터 조회에 실패했습니다.');
  }
  return response.json();
};

const upsertMetrics = async (data: { kolMetrics: any; shopMetrics: any[] }) => {
  const response = await fetch('/api/admin-dashboard/manual-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '데이터 저장에 실패했습니다.');
  }
  return response.json();
};

export default function ManualMetricsPage() {
  // Remove search state and custom filtering, let Command handle it
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [queryEnabled, setQueryEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  // Add state for manual editing mode and auto-calculated value
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const [autoCalculatedSales, setAutoCalculatedSales] = useState(0);

  const queryClient = useQueryClient();
  const { data: kols = [], isLoading: kolsLoading } = useAdminNewKols(); // 경로 확인!

  const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const { data: metricsData, isLoading, isFetching, isError, error } = useQuery<MetricsData, Error>({
    queryKey: ['manualMetrics', selectedKolId, yearMonth],
    queryFn: () => fetchMetrics(selectedKolId!, yearMonth),
    enabled: queryEnabled && !!selectedKolId,
  });

  useEffect(() => {
    if (!isFetching && queryEnabled) {
      setQueryEnabled(false);
    }
  }, [isFetching, queryEnabled]);

  const mutation = useMutation({
    mutationFn: upsertMetrics,
    onSuccess: () => {
      toast.success('데이터가 성공적으로 저장되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['manualMetrics', selectedKolId, yearMonth] });
    },
    onError: (err: Error) => {
      toast.error(`저장 실패: ${err.message}`);
    },
  });

  const { control, handleSubmit, reset, register, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      kolMetrics: { monthly_sales: 0, monthly_commission: 0, total_shops_count: 0, active_shops_count: 0 },
      shopMetrics: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'shopMetrics',
  });

  // Watch shop metrics for auto-calculation
  const watchedShopMetrics = useWatch({
    control,
    name: 'shopMetrics',
  });

  // Auto-calculate total and active shops count, and monthly sales
  useEffect(() => {
    if (watchedShopMetrics && watchedShopMetrics.length > 0) {
      const totalShops = watchedShopMetrics.length;
      const activeShops = watchedShopMetrics.filter(shop => 
        shop.total_sales && Number(shop.total_sales) > 0
      ).length;
      
      // Calculate total monthly sales from all shops
      const totalMonthlySales = watchedShopMetrics.reduce((sum, shop) => {
        return sum + (Number(shop.total_sales) || 0);
      }, 0);
      
      // Store auto-calculated value
      setAutoCalculatedSales(totalMonthlySales);
      
      // Update form value only if not manually editing
      if (!isManuallyEditing) {
        setValue('kolMetrics.monthly_sales', totalMonthlySales);
      }

      setValue('kolMetrics.total_shops_count', totalShops);
      setValue('kolMetrics.active_shops_count', activeShops);
    }
  }, [watchedShopMetrics, setValue, isManuallyEditing]);

  useEffect(() => {
    if (metricsData) {
      // Sort shopMetrics by shop_name in Korean alphabetical order
      const sortedShopMetrics = (metricsData.shopMetrics || []).sort((a, b) =>
        a.shop_name.localeCompare(b.shop_name, 'ko')
      );
      
      reset({
        kolMetrics: metricsData.kolMetrics || { monthly_sales: 0, monthly_commission: 0, total_shops_count: 0, active_shops_count: 0 },
        shopMetrics: sortedShopMetrics,
      });
    }
  }, [metricsData, reset]);

  const handleSearch = () => {
    if (selectedKolId) {
      setQueryEnabled(true);
    } else {
      toast.warning('KOL을 먼저 선택해주세요.');
    }
  };

  const onSubmit = (data: FormValues) => {
    if (!selectedKolId) {
      toast.error('KOL이 선택되지 않았습니다.');
      return;
    }
    const payload = {
      kolMetrics: {
        kol_id: selectedKolId,
        year_month: yearMonth,
        monthly_sales: Number(data.kolMetrics.monthly_sales),
        monthly_commission: Number(data.kolMetrics.monthly_commission),
        total_shops_count: Number(data.kolMetrics.total_shops_count),
        active_shops_count: Number(data.kolMetrics.active_shops_count),
      },
      shopMetrics: data.shopMetrics.map((shop) => ({
        shop_id: shop.shop_id,
        year_month: yearMonth,
        total_sales: Number(shop.total_sales),
      })),
    };
    mutation.mutate(payload);
  };

  // 파생 데이터: KOL별 묶음
  const kolMap = kols.reduce(
    (
      acc: Record<
        number,
        {
          kolName: string; // KOL 이름 (사용 안 하더라도 보존)
          kolShopName: string; // KOL의 대표 샵명
          shops: typeof kols;
        }
      >,
      cur
    ) => {
      if (!acc[cur.kol_id]) {
        acc[cur.kol_id] = {
          kolName: cur.name,
          kolShopName: cur.kol_shop_name,
          shops: [],
        };
      }
      acc[cur.kol_id]!.shops.push(cur);
      return acc;
    },
    {}
  );

  const kolOptions = Object.entries(kolMap).map(([kolId, { kolShopName }]) => ({ kolId: Number(kolId), label: kolShopName }));
  let shopOptions: typeof kols = [];
  if (selectedKolId !== null && kolMap[selectedKolId]) {
    shopOptions = kolMap[selectedKolId].shops;
  }

  // Sort kolOptions alphabetically by label (Korean order)
  const sortedKolOptions = [...kolOptions].sort((a, b) =>
    a.label.localeCompare(b.label, 'ko')
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">수기 실적 입력 (Admin Dashboard)</h1>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          {/* KOL 선택 */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[180px] justify-between"
              >
                {selectedKolId
                  ? kolOptions.find((k) => k.kolId === selectedKolId)?.label
                  : 'KOL 선택'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0">
              <Command>
                <CommandInput
                  placeholder="KOL 검색..."
                />
                <CommandList>
                  <CommandEmpty>검색 결과 없음</CommandEmpty>
                  <CommandGroup>
                    {sortedKolOptions.map((k) => (
                      <CommandItem
                        key={k.kolId}
                        value={k.label}
                        onSelect={(currentValue: string) => {
                          // Find the KOL by label since currentValue is now the label
                          const selectedKol = sortedKolOptions.find(kol => kol.label === currentValue);
                          if (selectedKol) {
                            setSelectedKolId(selectedKol.kolId);
                            setSelectedShopId(null);
                          }
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedKolId === k.kolId ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {k.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* 전문점 선택 */}
          <Select
            onValueChange={(v) => setSelectedShopId(Number(v))}
            disabled={!selectedKolId || shopOptions.length === 0}
            value={selectedShopId ? String(selectedShopId) : undefined}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="전문점 선택" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {shopOptions.map((s) => (
                <SelectItem key={s.shop_id} value={String(s.shop_id)}>
                  {s.shop_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 년, 월 Select들은 그대로 */}

          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateYears().map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={String(month)}>
                  {month}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} disabled={(isLoading && queryEnabled) || !selectedKolId}>
            {isLoading && queryEnabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            조회
          </Button>
        </CardContent>
      </Card>

      {isError && <p className="text-red-500">데이터 조회 중 오류 발생: {error.message}</p>}

      {(isLoading && queryEnabled) ||
        (mutation.isPending && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ))}

      {metricsData && !isFetching && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KOL 실적</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kol-sales" className="block text-sm font-medium text-gray-700 mb-1">
                  월 매출 <span className="text-xs text-gray-500">(자동 계산)</span>
                </label>
                <Input
                  id="kol-sales"
                  type="number"
                  onFocus={(e) => {
                    setIsManuallyEditing(true);
                    // Clear the field only if it contains 0 (default value)
                    const currentValue = Number(e.target.value);
                    if (currentValue === 0) {
                      e.target.value = '';
                      e.target.select(); // Select all text for easy replacement
                    }
                  }}
                  {...register('kolMetrics.monthly_sales', { 
                    valueAsNumber: true,
                    onBlur: (e) => {
                      setIsManuallyEditing(false);
                      // If field is empty, restore auto-calculated value
                      if (!e.target.value || e.target.value === '') {
                        setValue('kolMetrics.monthly_sales', autoCalculatedSales);
                      }
                    }
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">전문점 매출 합계 (직접 수정 가능)</p>
              </div>
              <div>
                <label htmlFor="kol-commission" className="block text-sm font-medium text-gray-700 mb-1">월 수당</label>
                <Input
                  id="kol-commission"
                  type="number"
                  {...register('kolMetrics.monthly_commission', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="kol-total-shops" className="block text-sm font-medium text-gray-700 mb-1">
                  전체 전문점 수 <span className="text-xs text-gray-500">(자동 계산)</span>
                </label>
                <Input
                  id="kol-total-shops"
                  type="number"
                  readOnly
                  className="bg-gray-50"
                  {...register('kolMetrics.total_shops_count', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="kol-active-shops" className="block text-sm font-medium text-gray-700 mb-1">
                  활성 전문점 수 <span className="text-xs text-gray-500">(자동 계산)</span>
                </label>
                <Input
                  id="kol-active-shops"
                  type="number"
                  readOnly
                  className="bg-gray-50"
                  {...register('kolMetrics.active_shops_count', { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500 mt-1">매출이 0보다 큰 전문점 수</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>전문점별 매출</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>전문점명</TableHead>
                    <TableHead className="w-[200px]">월 매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.shop_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...register(`shopMetrics.${index}.total_sales`, { valueAsNumber: true })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
