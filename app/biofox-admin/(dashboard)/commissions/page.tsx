'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CommissionTable } from '@/components/biofox-admin/commissions/CommissionTable';
import { CommissionFilters } from '@/components/biofox-admin/commissions/CommissionFilters';
import { CommissionSummaryCards } from '@/components/biofox-admin/commissions/CommissionSummaryCards';
import { CommissionDetailModal } from '@/components/biofox-admin/commissions/CommissionDetailModal';
import { ConvexQueryState, LoadingState, ErrorState } from '@/components/ui/loading';
import { usePaginatedConvexQuery, useCombinedConvexQueries } from '@/hooks/useConvexQuery';
import { Download, Calculator, TrendingUp } from 'lucide-react';

interface CommissionFiltersState {
  month?: string;
  kol_id?: string;
  status?: 'calculated' | 'adjusted' | 'paid' | 'cancelled';
}

export default function CommissionManagementPage() {
  const { toast } = useToast();

  // State
  const [filters, setFilters] = useState<CommissionFiltersState>({
    month: new Date().toISOString().substring(0, 7),
  });
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);

  // 표준화된 Convex queries
  const commissionsQuery = usePaginatedConvexQuery(api.commissions.listCommissions, {
    paginationOpts,
    month: filters.month,
    kolId: filters.kol_id as any,
    status: filters.status as any,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const summaryQuery = useQuery(api.commissions.getCommissionSummary, {
    month: filters.month,
    kolId: filters.kol_id as any,
  });

  // 복합 쿼리 상태 관리
  const combinedState = useCombinedConvexQueries([
    {
      data: commissionsQuery.data,
      isLoading: commissionsQuery.isLoading,
      isError: commissionsQuery.isError,
    },
    {
      data: summaryQuery,
      isLoading: summaryQuery === undefined,
      isError: false,
    },
  ]);

  // Mutations with optimistic updates
  const calculateCommissions = useMutation(
    api.commissions.calculateMonthlyCommissions
  ).withOptimisticUpdate((localStore, args) => {
    // Show loading state in summary during calculation
    const existingSummary = localStore.getQuery(api.commissions.getCommissionSummary, {
      month: filters.month,
      kolId: filters.kol_id as any,
    });

    if (existingSummary !== undefined) {
      const optimisticSummary = {
        ...existingSummary,
        calculationInProgress: true,
      };
      localStore.setQuery(
        api.commissions.getCommissionSummary,
        {
          month: filters.month,
          kolId: filters.kol_id as any,
        },
        optimisticSummary
      );
    }
  });

  const updateCommissionStatus = useMutation(
    api.commissions.updateCommissionStatus
  ).withOptimisticUpdate((localStore, args) => {
    const { orderIds, status } = args;
    const existingCommissions = localStore.getQuery(api.commissions.listCommissions, {
      paginationOpts,
      month: filters.month,
      kolId: filters.kol_id as any,
      status: filters.status as any,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    if (existingCommissions !== undefined) {
      const updatedCommissions = {
        ...existingCommissions,
        page: existingCommissions.page?.map((commission: any) =>
          orderIds.includes(commission.order_id)
            ? { ...commission, status, updated_at: Date.now() }
            : commission
        ),
      };
      localStore.setQuery(
        api.commissions.listCommissions,
        {
          paginationOpts,
          month: filters.month,
          kolId: filters.kol_id as any,
          status: filters.status as any,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        updatedCommissions
      );
    }
  });

  // Handlers
  const handleCalculate = async () => {
    try {
      await calculateCommissions({
        month: filters.month || new Date().toISOString().substring(0, 7),
      });
      toast({
        title: '성공',
        description: '커미션 계산이 완료되었습니다.',
      });
    } catch (error) {
      toast({
        title: '실패',
        description: '커미션 계산에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      // Export logic here
      toast({
        title: '성공',
        description: '커미션 데이터 내보내기가 시작됩니다.',
      });
    } catch (error) {
      toast({
        title: '실패',
        description: '데이터 내보내기에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (orderIds: string[], status: any) => {
    try {
      await updateCommissionStatus({ orderIds, status });
      setSelectedIds([]);
      toast({
        title: '성공',
        description: '커미션 상태가 업데이트되었습니다.',
      });
    } catch (error) {
      toast({
        title: '실패',
        description: '상태 업데이트에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">커미션 관리</h1>
          <p className="text-muted-foreground">KOL 커미션을 계산하고 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
          <Button onClick={handleCalculate} disabled={combinedState.isLoading}>
            <Calculator className="mr-2 h-4 w-4" />
            커미션 계산
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommissionFilters filters={filters} onFiltersChange={setFilters} />

      {/* Summary with Standardized State Handling */}
      <ConvexQueryState
        data={summaryQuery}
        title="커미션 요약을 불러오는 중..."
        errorComponent={
          <ErrorState
            title="요약 정보 로드 실패"
            description="커미션 요약 정보를 불러올 수 없습니다."
            variant="card"
          />
        }
      >
        {summary => <CommissionSummaryCards summary={summary} />}
      </ConvexQueryState>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selectedIds.length}건 선택됨</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleStatusUpdate(selectedIds, 'adjusted')}>
                  조정 완료
                </Button>
                <Button size="sm" onClick={() => handleStatusUpdate(selectedIds, 'paid')}>
                  지급 완료
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedIds, 'cancelled')}
                >
                  취소
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Table with Standardized State Handling */}
      <Card>
        <CardContent className="p-0">
          <ConvexQueryState
            data={commissionsQuery.items}
            title="커미션 목록을 불러오는 중..."
            emptyComponent={
              <div className="p-8 text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">커미션 데이터가 없습니다</h3>
                <p className="mb-4 text-muted-foreground">
                  선택한 기간에 대한 커미션 데이터가 없습니다. 먼저 커미션을 계산해보세요.
                </p>
                <Button onClick={handleCalculate}>
                  <Calculator className="mr-2 h-4 w-4" />
                  커미션 계산하기
                </Button>
              </div>
            }
          >
            {() => (
              <CommissionTable
                commissions={commissionsQuery.items || []}
                loading={commissionsQuery.isLoading}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onViewDetail={commission => {
                  setSelectedCommission(commission);
                  setDetailModalOpen(true);
                }}
                onAdjust={commission => {
                  setSelectedCommission(commission);
                  setAdjustModalOpen(true);
                }}
                onPay={commission => {
                  setSelectedCommission(commission);
                  setPayModalOpen(true);
                }}
              />
            )}
          </ConvexQueryState>
        </CardContent>
      </Card>

      {/* Pagination */}
      {commissionsQuery.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              setPaginationOpts(prev => ({
                ...prev,
                cursor: commissionsQuery.cursor,
              }))
            }
            disabled={commissionsQuery.isLoading}
          >
            더 보기
          </Button>
        </div>
      )}

      {/* Modals */}
      {detailModalOpen && selectedCommission && (
        <CommissionDetailModal
          commission={selectedCommission}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedCommission(null);
          }}
        />
      )}

      {/* 기타 모달들... */}
    </div>
  );
}
