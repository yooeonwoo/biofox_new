'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, RefreshCw, Calculator, CreditCard } from 'lucide-react'
import { CommissionFilters } from '@/components/biofox-admin/commissions/CommissionFilters'
import { CommissionTable } from '@/components/biofox-admin/commissions/CommissionTable'
import { CommissionSummaryCards } from '@/components/biofox-admin/commissions/CommissionSummaryCards'
import { CommissionDetailModal } from '@/components/biofox-admin/commissions/CommissionDetailModal'
import { CommissionAdjustModal } from '@/components/biofox-admin/commissions/CommissionAdjustModal'
import { CommissionPayModal } from '@/components/biofox-admin/commissions/CommissionPayModal'
import { useToast } from '@/components/ui/use-toast'

interface CommissionFiltersState {
  month?: string
  kol_id?: string
  status?: string
}

export default function CommissionManagementPage() {
  const [filters, setFilters] = useState<CommissionFiltersState>({
    month: new Date().toISOString().substring(0, 7)
  })
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [summary, setSummary] = useState({
    total_amount: 0,
    calculated_amount: 0,
    paid_amount: 0,
    pending_amount: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCommissions()
  }, [filters, pagination.page])

  const fetchCommissions = async () => {
    setLoading(true)
    
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString()
    })

    if (filters.month) params.append('month', filters.month)
    if (filters.kol_id) params.append('kol_id', filters.kol_id)
    if (filters.status) params.append('status', filters.status)

    const response = await fetch(`/api/commissions?${params}`)
    
    if (response.ok) {
      const data = await response.json()
      setCommissions(data.data)
      setPagination(data.pagination)
      setSummary(data.summary)
    }
    
    setLoading(false)
  }

  const handleCalculate = async () => {
    if (!filters.month) {
      toast({
        title: '정산월을 선택해주세요',
        variant: 'destructive'
      })
      return
    }

    const response = await fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: filters.month })
    })

    if (response.ok) {
      const data = await response.json()
      toast({
        title: '정산 계산 완료',
        description: data.message
      })
      fetchCommissions()
    } else {
      toast({
        title: '정산 계산 실패',
        description: '정산 계산 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleAdjust = async (data: any) => {
    const response = await fetch(`/api/commissions/${selectedCommission.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      toast({
        title: '수수료 조정 완료',
        description: '수수료가 조정되었습니다.'
      })
      setAdjustModalOpen(false)
      setSelectedCommission(null)
      fetchCommissions()
    } else {
      toast({
        title: '조정 실패',
        description: '수수료 조정에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handlePay = async (data: any) => {
    const response = await fetch(`/api/commissions/${selectedCommission.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_info: data })
    })

    if (response.ok) {
      toast({
        title: '지급 처리 완료',
        description: '수수료가 지급 처리되었습니다.'
      })
      setPayModalOpen(false)
      setSelectedCommission(null)
      fetchCommissions()
    } else {
      toast({
        title: '지급 처리 실패',
        description: '지급 처리에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleBulkPay = () => {
    if (selectedIds.length === 0) {
      toast({
        title: '선택된 항목이 없습니다',
        description: '지급할 항목을 선택해주세요.',
        variant: 'destructive'
      })
      return
    }

    // 일괄 지급 처리 로직 구현
    toast({
      title: '일괄 지급 준비 중',
      description: `${selectedIds.length}건의 수수료를 처리합니다.`
    })
  }

  const handleExport = async () => {
    const params = new URLSearchParams({
      format: 'csv',
      month: filters.month || new Date().toISOString().substring(0, 7)
    })

    window.open(`/api/commissions/export?${params}`, '_blank')
  }

  const handlePrint = (commission: any) => {
    // 정산서 출력 로직
    window.open(`/api/commissions/${commission.id}/print`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">수수료 정산 관리</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkPay}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              일괄 지급 ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculate}
          >
            <Calculator className="h-4 w-4 mr-2" />
            정산 계산
          </Button>
        </div>
      </div>

      <CommissionSummaryCards summary={summary} />

      <CommissionFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <CommissionTable
        commissions={commissions}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onView={(commission) => {
          setSelectedCommission(commission)
          setDetailModalOpen(true)
        }}
        onAdjust={(commission) => {
          setSelectedCommission(commission)
          setAdjustModalOpen(true)
        }}
        onPay={(commission) => {
          setSelectedCommission(commission)
          setPayModalOpen(true)
        }}
        onPrint={handlePrint}
      />

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      <CommissionDetailModal
        commissionId={selectedCommission?.id}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedCommission(null)
        }}
      />

      <CommissionAdjustModal
        commission={selectedCommission}
        open={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false)
          setSelectedCommission(null)
        }}
        onSubmit={handleAdjust}
      />

      <CommissionPayModal
        commission={selectedCommission}
        open={payModalOpen}
        onClose={() => {
          setPayModalOpen(false)
          setSelectedCommission(null)
        }}
        onSubmit={handlePay}
      />
    </div>
  )
}