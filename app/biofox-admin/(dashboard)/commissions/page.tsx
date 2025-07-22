'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw, Calculator, CreditCard } from 'lucide-react';
import { CommissionFilters } from '@/components/biofox-admin/commissions/CommissionFilters';
import { CommissionTable } from '@/components/biofox-admin/commissions/CommissionTable';
import { CommissionSummaryCards } from '@/components/biofox-admin/commissions/CommissionSummaryCards';
import { CommissionDetailModal } from '@/components/biofox-admin/commissions/CommissionDetailModal';
import { CommissionAdjustModal } from '@/components/biofox-admin/commissions/CommissionAdjustModal';
import { CommissionPayModal } from '@/components/biofox-admin/commissions/CommissionPayModal';
import { useToast } from '@/components/ui/use-toast';

// Convex imports
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface CommissionFiltersState {
  month?: string;
  kol_id?: string;
  status?: string;
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

  // Convex queries and mutations
  const commissionsResult = useQuery(api.commissions.listCommissions, {
    paginationOpts,
    month: filters.month,
    kolId: filters.kol_id as any,
    status: filters.status as any,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const summaryResult = useQuery(api.commissions.getCommissionSummary, {
    month: filters.month,
    kolId: filters.kol_id as any,
  });

  const calculateCommissions = useMutation(api.commissions.calculateMonthlyCommissions);
  const updateCommissionStatus = useMutation(api.commissions.updateCommissionStatus);

  // Extract data from Convex queries
  const commissions = commissionsResult?.page || [];
  const summary = summaryResult || null;
  const loading = commissionsResult === undefined;
  const hasNextPage = commissionsResult ? !commissionsResult.isDone : false;

  // Handle pagination
  const handleNextPage = () => {
    if (commissionsResult && !commissionsResult.isDone && commissionsResult.continueCursor) {
      setPaginationOpts(prev => ({
        ...prev,
        cursor: commissionsResult.continueCursor,
      }));
    }
  };

  const handlePreviousPage = () => {
    // Reset to first page (Convex doesn't have built-in prev page)
    setPaginationOpts(prev => ({
      ...prev,
      cursor: null,
    }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: CommissionFiltersState) => {
    setFilters(newFilters);
    // Reset pagination when filters change
    setPaginationOpts(prev => ({
      ...prev,
      cursor: null,
    }));
  };

  // Handle commission calculation
  const handleCalculate = async () => {
    if (!filters.month) {
      toast({
        title: '정산월을 선택해주세요',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await calculateCommissions({
        month: filters.month,
        forceRecalculate: false,
      });

      if (result.success) {
        toast({
          title: '커미션 계산 완료',
          description: `${result.processed}개 주문의 커미션이 계산되었습니다.`,
        });
      } else {
        toast({
          title: '부분 완료',
          description: `${result.processed}개 성공, ${result.failed}개 실패`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Commission calculation error:', error);
      toast({
        title: '오류',
        description: error.message || '커미션 계산 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (
    orderIds: string[],
    status: 'calculated' | 'adjusted' | 'paid' | 'cancelled',
    adjustmentAmount?: number,
    reason?: string
  ) => {
    try {
      const result = await updateCommissionStatus({
        orderIds: orderIds as any[],
        status,
        adjustmentAmount,
        reason,
      });

      if (result.success) {
        toast({
          title: '상태 업데이트 완료',
          description: `${result.processed}개 커미션의 상태가 업데이트되었습니다.`,
        });
      } else {
        toast({
          title: '부분 완료',
          description: `${result.processed}개 성공, ${result.failed}개 실패`,
          variant: 'destructive',
        });
      }

      // Close modals and reset selection
      setDetailModalOpen(false);
      setAdjustModalOpen(false);
      setPayModalOpen(false);
      setSelectedIds([]);
      setSelectedCommission(null);
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: '오류',
        description: error.message || '상태 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk payments
  const handleBulkPay = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: '알림',
        description: '지급할 커미션을 선택해주세요.',
      });
      return;
    }

    await handleStatusUpdate(selectedIds, 'paid', undefined, '일괄 지급');
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Note: Export functionality would need to be implemented as a separate Convex action
      toast({
        title: '알림',
        description: '데이터 내보내기 기능은 준비 중입니다.',
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: '오류',
        description: '데이터 내보내기 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle commission detail view
  const handleViewDetail = (commission: any) => {
    setSelectedCommission(commission);
    setDetailModalOpen(true);
  };

  // Handle commission adjustment
  const handleAdjust = (commission: any) => {
    setSelectedCommission(commission);
    setAdjustModalOpen(true);
  };

  // Handle commission payment
  const handlePay = (commission: any) => {
    setSelectedCommission(commission);
    setPayModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">커미션 관리</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPaginationOpts(prev => ({ ...prev, cursor: null }))}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
          <Button onClick={handleCalculate} disabled={loading}>
            <Calculator className="mr-2 h-4 w-4" />
            커미션 계산
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && <CommissionSummaryCards summary={summary} loading={loading} />}

      {/* Filters */}
      <CommissionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-4">
          <span className="text-sm text-gray-600">{selectedIds.length}개 선택됨</span>
          <Button size="sm" variant="outline" onClick={handleBulkPay}>
            <CreditCard className="mr-2 h-4 w-4" />
            일괄 지급
          </Button>
        </div>
      )}

      {/* Commission Table */}
      <CommissionTable
        commissions={commissions}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onViewDetail={handleViewDetail}
        onAdjust={handleAdjust}
        onPay={handlePay}
      />

      {/* Pagination */}
      {commissionsResult && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{commissions.length}개 항목 표시</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!paginationOpts.cursor}
            >
              이전
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CommissionDetailModal
        commission={selectedCommission}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCommission(null);
        }}
      />

      <CommissionAdjustModal
        commission={selectedCommission}
        open={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedCommission(null);
        }}
        onAdjust={async (adjustmentAmount, reason) => {
          if (selectedCommission) {
            await handleStatusUpdate([selectedCommission.id], 'adjusted', adjustmentAmount, reason);
          }
        }}
      />

      <CommissionPayModal
        commission={selectedCommission}
        open={payModalOpen}
        onClose={() => {
          setPayModalOpen(false);
          setSelectedCommission(null);
        }}
        onPay={async reason => {
          if (selectedCommission) {
            await handleStatusUpdate([selectedCommission.id], 'paid', undefined, reason);
          }
        }}
      />
    </div>
  );
}
