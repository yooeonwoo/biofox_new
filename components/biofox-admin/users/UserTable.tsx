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
  CheckCircle, 
  XCircle,
  UserCheck,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { User } from '@/types/biofox-admin';

interface UserTableProps {
  users: User[];
  loading?: boolean;
  selectedUsers: string[];
  onSelectionChange: (users: string[]) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onApproveUser: (user: User) => void;
  onRejectUser: (user: User) => void;
}

const roleLabels = {
  admin: '관리자',
  kol: 'KOL',
  ol: 'OL',
  shop_owner: '전문점 원장',
};

const statusConfig = {
  pending: { label: '승인 대기', variant: 'secondary' as const },
  approved: { label: '승인됨', variant: 'default' as const },
  rejected: { label: '거절됨', variant: 'destructive' as const },
};

export function UserTable({
  users,
  loading = false,
  selectedUsers,
  onSelectionChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onApproveUser,
  onRejectUser,
}: UserTableProps) {
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users.map(user => user.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId]);
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="모두 선택"
              />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
              이름
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
              이메일
            </TableHead>
            <TableHead>역할</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('shop_name')}>
              샵명
            </TableHead>
            <TableHead>소속</TableHead>
            <TableHead className="text-right">이번 달 매출</TableHead>
            <TableHead className="text-right">이번 달 수수료</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
              가입일
            </TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  aria-label={`${user.name} 선택`}
                />
              </TableCell>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{roleLabels[user.role]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[user.status].variant}>
                  {statusConfig[user.status].label}
                </Badge>
              </TableCell>
              <TableCell>{user.shop_name}</TableCell>
              <TableCell>
                {user.current_relationship ? (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.current_relationship.parent_name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(user.stats?.total_sales_this_month || 0)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(user.stats?.total_commission_this_month || 0)}
              </TableCell>
              <TableCell>
                {format(new Date(user.created_at), 'PPP', { locale: ko })}
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
                    <DropdownMenuItem onClick={() => onViewUser(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      상세 보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.status === 'pending' && (
                      <>
                        <DropdownMenuItem onClick={() => onApproveUser(user)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          승인
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRejectUser(user)}>
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          거절
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)}
                      className="text-red-600"
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
