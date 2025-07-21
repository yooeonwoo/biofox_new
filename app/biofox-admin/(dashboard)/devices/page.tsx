'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, RefreshCw, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DeviceFilters } from '@/components/biofox-admin/devices/DeviceFilters'
import { DeviceTable } from '@/components/biofox-admin/devices/DeviceTable'
import { DeviceSummaryCards } from '@/components/biofox-admin/devices/DeviceSummaryCards'
import { DeviceFormModal } from '@/components/biofox-admin/devices/DeviceFormModal'
import { DeviceTierDashboard } from '@/components/biofox-admin/devices/DeviceTierDashboard'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface DeviceFiltersState {
  shop_id?: string
  kol_id?: string
  dateRange?: DateRange
}

export default function DeviceManagementPage() {
  const [filters, setFilters] = useState<DeviceFiltersState>({})
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [summary, setSummary] = useState({
    total_sold: 0,
    total_returned: 0,
    net_devices: 0,
    total_commission: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSales()
  }, [filters, pagination.page])

  const fetchSales = async () => {
    setLoading(true)
    
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString()
    })

    if (filters.shop_id) params.append('shop_id', filters.shop_id)
    if (filters.kol_id) params.append('kol_id', filters.kol_id)
    if (filters.dateRange?.from) {
      params.append('date_from', format(filters.dateRange.from, 'yyyy-MM-dd'))
    }
    if (filters.dateRange?.to) {
      params.append('date_to', format(filters.dateRange.to, 'yyyy-MM-dd'))
    }

    const response = await fetch(`/api/devices?${params}`)
    
    if (response.ok) {
      const data = await response.json()
      setSales(data.data)
      setPagination(data.pagination)
      setSummary(data.summary)
    }
    
    setLoading(false)
  }

  const handleCreateSale = async (data: any) => {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      toast({
        title: '기기 판매 등록 완료',
        description: '새로운 기기 판매가 등록되었습니다.'
      })
      setFormModalOpen(false)
      fetchSales()
    } else {
      const error = await response.json()
      toast({
        title: '등록 실패',
        description: error.error || '기기 판매 등록에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateSale = async (data: any) => {
    const response = await fetch(`/api/devices/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      toast({
        title: '수정 완료',
        description: '기기 판매 정보가 수정되었습니다.'
      })
      setEditingSale(null)
      fetchSales()
    } else {
      toast({
        title: '수정 실패',
        description: '기기 판매 수정에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSale = async (sale: any) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const response = await fetch(`/api/devices/${sale.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      toast({
        title: '삭제 완료',
        description: '기기 판매가 삭제되었습니다.'
      })
      fetchSales()
    } else {
      toast({
        title: '삭제 실패',
        description: '기기 판매 삭제에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`선택한 ${selectedIds.length}개의 기기 판매를 삭제하시겠습니까?`)) return

    const promises = selectedIds.map(id =>
      fetch(`/api/devices/${id}`, { method: 'DELETE' })
    )

    const results = await Promise.allSettled(promises)
    const successCount = results.filter(r => r.status === 'fulfilled').length

    toast({
      title: '일괄 삭제 완료',
      description: `${successCount}개의 기기 판매가 삭제되었습니다.`
    })

    setSelectedIds([])
    fetchSales()
  }

  const handleExport = async () => {
    const params = new URLSearchParams({
      format: 'csv'
    })

    if (filters.dateRange?.from) {
      params.append('date_from', format(filters.dateRange.from, 'yyyy-MM-dd'))
    }
    if (filters.dateRange?.to) {
      params.append('date_to', format(filters.dateRange.to, 'yyyy-MM-dd'))
    }

    window.open(`/api/devices/export?${params}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">기기 판매 관리</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제 ({selectedIds.length})
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
            size="sm"
            onClick={() => setFormModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            판매 등록
          </Button>
        </div>
      </div>

      <DeviceSummaryCards summary={summary} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <DeviceFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          <DeviceTable
            sales={sales}
            loading={loading}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={(sale) => {
              setEditingSale(sale)
              setFormModalOpen(true)
            }}
            onDelete={handleDeleteSale}
            onView={(sale) => {
              // 상세보기 모달 구현 예정
              console.log('View sale:', sale)
            }}
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
        </div>

        <div className="lg:col-span-1">
          <DeviceTierDashboard />
        </div>
      </div>

      <DeviceFormModal
        sale={editingSale}
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingSale(null)
        }}
        onSubmit={editingSale ? handleUpdateSale : handleCreateSale}
      />
    </div>
  )
}