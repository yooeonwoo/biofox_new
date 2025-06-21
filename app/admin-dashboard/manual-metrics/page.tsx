'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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

// 데이터 타입 정의
interface KolMetrics {
  monthly_sales: number;
  monthly_commission: number;
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
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [queryEnabled, setQueryEnabled] = useState(false);

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

  const { control, handleSubmit, reset, register } = useForm<FormValues>({
    defaultValues: {
      kolMetrics: { monthly_sales: 0, monthly_commission: 0 },
      shopMetrics: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'shopMetrics',
  });

  useEffect(() => {
    if (metricsData) {
      reset({
        kolMetrics: metricsData.kolMetrics || { monthly_sales: 0, monthly_commission: 0 },
        shopMetrics: metricsData.shopMetrics || [],
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
      },
      shopMetrics: data.shopMetrics.map((shop) => ({
        shop_id: shop.shop_id,
        year_month: yearMonth,
        total_sales: Number(shop.total_sales),
      })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">수기 실적 입력 (Admin Dashboard)</h1>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Select onValueChange={(v) => setSelectedKolId(Number(v))} disabled={kolsLoading}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="KOL 선택" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-y-auto">
              {kols.map((kol: { id: number; kol_id: number; name: string; shop_name: string; shop_id: number }) => (
                <SelectItem key={kol.id} value={String(kol.kol_id)}>
                  <span className="font-medium">{kol.name} / {kol.shop_name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                <label htmlFor="kol-sales" className="block text-sm font-medium text-gray-700 mb-1">월 매출</label>
                <Input
                  id="kol-sales"
                  type="number"
                  {...register('kolMetrics.monthly_sales', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="kol-commission" className="block text-sm font-medium text-gray-700 mb-1">월 수당</label>
                <Input
                  id="kol-commission"
                  type="number"
                  {...register('kolMetrics.monthly_commission', { valueAsNumber: true })}
                />
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
