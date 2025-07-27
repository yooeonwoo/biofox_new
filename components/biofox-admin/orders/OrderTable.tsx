'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Receipt,
  TrendingUp,
  Building,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Order } from '@/types/biofox-admin';

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  selectedOrders: string[];
  onSelectionChange: (orders: string[]) => void;
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}

const statusConfig = {
  pending: { label: '대기중', variant: 'secondary' as const },
  completed: { label: '완료', variant: 'default' as const },
  cancelled: { label: '취소', variant: 'destructive' as const },
  refunded: { label: '반품', variant: 'outline' as const },
};

const commissionStatusConfig = {
  calculated: { label: '계산됨', variant: 'secondary' as const },
  adjusted: { label: '조정됨', variant: 'outline' as const },
  paid: { label: '지급됨', variant: 'default' as const },
  cancelled: { label: '취소됨', variant: 'destructive' as const },
};

export function OrderTable({
  orders,
  loading = false,
  selectedOrders,
  onSelectionChange,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
}: OrderTableProps) {
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(orders.map(order => order.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedOrders, orderId]);
    } else {
      onSelectionChange(selectedOrders.filter(id => id !== orderId));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="모두 선택"
              />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('order_date')}>
              주문일
            </TableHead>
            <TableHead>주문번호</TableHead>
            <TableHead>전문점</TableHead>
            <TableHead>소속</TableHead>
            <TableHead>상품</TableHead>
            <TableHead
              className="cursor-pointer text-right"
              onClick={() => handleSort('total_amount')}
            >
              주문금액
            </TableHead>
            <TableHead className="text-right">수수료</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={checked => handleSelectOrder(order.id, checked as boolean)}
                  aria-label={`주문 ${order.order_number || order.id} 선택`}
                />
              </TableCell>
              <TableCell>{format(new Date(order.order_date), 'yyyy.MM.dd')}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Receipt className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm">
                    {order.order_number || order.id.slice(0, 8)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{order.shop?.shop_name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{order.shop?.name}</p>
                </div>
              </TableCell>
              <TableCell>
                {order.shop?.parent ? (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{order.shop.parent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {order.shop.parent.role === 'kol' ? 'KOL' : 'OL'}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-sm">
                      {item.product_name} x{item.quantity}
                    </p>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <p className="text-sm text-gray-500">외 {order.items.length - 2}개</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                  {order.is_self_shop_order && (
                    <Badge variant="outline" className="text-xs">
                      본인샵
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {order.commission_amount && order.commission_rate ? (
                  <div className="space-y-1">
                    <p className="font-medium">{formatCurrency(order.commission_amount)}</p>
                    <p className="text-xs text-gray-500">{order.commission_rate}%</p>
                    <Badge
                      variant={
                        commissionStatusConfig[
                          order.commission_status as keyof typeof commissionStatusConfig
                        ]?.variant
                      }
                      className="text-xs"
                    >
                      {
                        commissionStatusConfig[
                          order.commission_status as keyof typeof commissionStatusConfig
                        ]?.label
                      }
                    </Badge>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusConfig[order.order_status as keyof typeof statusConfig]?.variant}
                >
                  {statusConfig[order.order_status as keyof typeof statusConfig]?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">메뉴 열기</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>작업</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewOrder(order)}>
                      <Eye className="mr-2 h-4 w-4" />
                      상세 보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditOrder(order)}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteOrder(order)}
                      className="text-red-600"
                      disabled={order.commission_status === 'paid'}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
