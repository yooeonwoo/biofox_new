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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DeviceSale {
  id: string
  shop: {
    id: string
    name: string
    shop_name: string
    email: string
    region: string
  }
  kol?: {
    id: string
    name: string
    role: string
  }
  sale_date: string
  device_name: string
  quantity: number
  tier_at_sale: string
  standard_commission: number
  actual_commission: number
  serial_numbers?: string[]
  notes?: string
  created_at: string
  created_by_user: {
    name: string
  }
}

interface DeviceTableProps {
  sales: DeviceSale[]
  loading?: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEdit?: (sale: DeviceSale) => void
  onDelete?: (sale: DeviceSale) => void
  onView?: (sale: DeviceSale) => void
}

export function DeviceTable({
  sales,
  loading,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onView
}: DeviceTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sales.map(s => s.id))
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
      currency: 'KRW'
    }).format(amount)
  }

  const getTierBadge = (tier: string) => {
    if (tier === 'tier_5_plus') {
      return <Badge className="bg-purple-500">5대 이상</Badge>
    }
    return <Badge variant="secondary">1-4대</Badge>
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
                checked={selectedIds.length === sales.length && sales.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>판매일</TableHead>
            <TableHead>샵</TableHead>
            <TableHead>KOL/OL</TableHead>
            <TableHead>기기명</TableHead>
            <TableHead className="text-center">수량</TableHead>
            <TableHead>티어</TableHead>
            <TableHead className="text-right">수수료</TableHead>
            <TableHead>시리얼</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(sale.id)}
                    onCheckedChange={(checked) => handleSelectOne(sale.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(sale.sale_date), 'yyyy-MM-dd', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{sale.shop.shop_name}</div>
                    <div className="text-sm text-muted-foreground">{sale.shop.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {sale.kol ? (
                    <div>
                      <div className="font-medium">{sale.kol.name}</div>
                      <Badge variant="outline" className="mt-1">
                        {sale.kol.role.toUpperCase()}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{sale.device_name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={sale.quantity > 0 ? 'default' : 'destructive'}>
                    {sale.quantity > 0 ? '+' : ''}{sale.quantity}
                  </Badge>
                </TableCell>
                <TableCell>{getTierBadge(sale.tier_at_sale)}</TableCell>
                <TableCell className="text-right">
                  <div className={sale.actual_commission < 0 ? 'text-red-600' : ''}>
                    {formatCurrency(sale.actual_commission)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    @{formatCurrency(sale.standard_commission / Math.abs(sale.quantity))}
                  </div>
                </TableCell>
                <TableCell>
                  {sale.serial_numbers?.length ? (
                    <Badge variant="outline">{sale.serial_numbers.length}개</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(sale)}>
                        <Eye className="mr-2 h-4 w-4" />
                        상세보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(sale)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(sale)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}