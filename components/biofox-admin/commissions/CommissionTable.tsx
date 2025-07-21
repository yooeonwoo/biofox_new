'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, CreditCard, FileText } from 'lucide-react'

interface Commission {
  id: string
  kol: {
    id: string
    name: string
    email: string
    shop_name: string
    bank_info?: any
  }
  calculation_month: string
  subordinate_shop_commission: number
  self_shop_commission: number
  device_commission: number
  total_commission: number
  status: string
  adjustments?: any[]
  payment_info?: any
}

interface CommissionTableProps {
  commissions: Commission[]
  loading?: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onView?: (commission: Commission) => void
  onAdjust?: (commission: Commission) => void
  onPay?: (commission: Commission) => void
  onPrint?: (commission: Commission) => void
}

export function CommissionTable({
  commissions,
  loading,
  selectedIds,
  onSelectionChange,
  onView,
  onAdjust,
  onPay,
  onPrint
}: CommissionTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(commissions.map(c => c.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(sid => sid !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'calculated':
        return <Badge>계산완료</Badge>
      case 'adjusted':
        return <Badge variant="secondary">조정됨</Badge>
      case 'paid':
        return <Badge className="bg-green-500">지급완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === commissions.length && commissions.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>KOL/OL</TableHead>
            <TableHead>정산월</TableHead>
            <TableHead className="text-right">소속샵</TableHead>
            <TableHead className="text-right">본인샵</TableHead>
            <TableHead className="text-right">기기</TableHead>
            <TableHead className="text-right">조정</TableHead>
            <TableHead className="text-right">총 수수료</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            commissions.map((commission) => {
              const adjustmentTotal = (commission.adjustments || [])
                .reduce((sum, adj) => sum + adj.amount, 0)
              
              return (
                <TableRow key={commission.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(commission.id)}
                      onCheckedChange={(checked) => handleSelectOne(commission.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{commission.kol.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {commission.kol.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(commission.calculation_month + '-01').toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(commission.subordinate_shop_commission)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(commission.self_shop_commission)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(commission.device_commission)}
                  </TableCell>
                  <TableCell className="text-right">
                    {adjustmentTotal !== 0 && (
                      <span className={adjustmentTotal > 0 ? 'text-green-600' : 'text-red-600'}>
                        {adjustmentTotal > 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(commission.total_commission)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(commission.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(commission)}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세보기
                        </DropdownMenuItem>
                        {commission.status !== 'paid' && (
                          <>
                            <DropdownMenuItem onClick={() => onAdjust?.(commission)}>
                              <Edit className="mr-2 h-4 w-4" />
                              수수료 조정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPay?.(commission)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              지급 처리
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => onPrint?.(commission)}>
                          <FileText className="mr-2 h-4 w-4" />
                          정산서 출력
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}