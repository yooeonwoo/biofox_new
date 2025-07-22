'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Trash,
  Users,
  RefreshCw,
} from 'lucide-react';
import { UserFiltersComponent } from '@/components/biofox-admin/users/UserFilters';
import { UserTable } from '@/components/biofox-admin/users/UserTable';
import { UserDetailModal } from '@/components/biofox-admin/users/UserDetailModal';
import { UserAddModal } from '@/components/biofox-admin/users/UserAddModal';
import type { User, UserFilters, PaginationState, BulkActionRequest } from '@/types/biofox-admin';

// Convex imports
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function UsersPage() {
  const { toast } = useToast();

  // States
  const [filters, setFilters] = useState<UserFilters>({});
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    'approve' | 'reject' | 'delete' | 'activate' | 'deactivate' | null
  >(null);
  const [bulkActionData, setBulkActionData] = useState<any>({});

  // Convex queries and mutations
  const usersResult = useQuery(api.users.listUsers, {
    paginationOpts,
    search: filters.search,
    role: filters.role,
    status: filters.status,
    createdFrom: filters.dateRange?.from?.toISOString(),
    createdTo: filters.dateRange?.to?.toISOString(),
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const updateUser = useMutation(api.userMutations.updateUser);
  const bulkUserAction = useMutation(api.userMutations.bulkUserAction);
  const approveUser = useMutation(api.userMutations.approveUser);
  const rejectUser = useMutation(api.userMutations.rejectUser);

  // Extract users and loading state from Convex query
  const users =
    usersResult?.page?.map(user => ({
      ...user,
      stats: user.stats || {
        total_sales_this_month: 0,
        total_commission_this_month: 0,
        total_clinical_cases: 0,
      },
    })) || [];
  const loading = usersResult === undefined;
  const hasNextPage = usersResult ? !usersResult.isDone : false;

  // Handle pagination
  const handleNextPage = () => {
    if (usersResult && !usersResult.isDone && usersResult.continueCursor) {
      setPaginationOpts(prev => ({
        ...prev,
        cursor: usersResult.continueCursor,
      }));
    }
  };

  const handlePreviousPage = () => {
    // For simplicity, reset to first page (Convex doesn't have built-in prev page)
    setPaginationOpts(prev => ({
      ...prev,
      cursor: null,
    }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    // Reset pagination when filters change
    setPaginationOpts(prev => ({
      ...prev,
      cursor: null,
    }));
  };

  // Handle user actions
  const handleUserAction = async (action: string, user: User, data?: any) => {
    try {
      switch (action) {
        case 'approve':
          await approveUser({
            userId: user.id as any,
            commission_rate: data?.commission_rate,
          });
          toast({
            title: '성공',
            description: '사용자가 승인되었습니다.',
          });
          break;

        case 'reject':
          await rejectUser({
            userId: user.id as any,
            reason: data?.reason,
          });
          toast({
            title: '성공',
            description: '사용자가 거절되었습니다.',
          });
          break;

        case 'update':
          await updateUser({
            userId: user.id as any,
            updates: data,
          });
          toast({
            title: '성공',
            description: '사용자 정보가 업데이트되었습니다.',
          });
          break;

        default:
          console.warn('Unknown action:', action);
      }
    } catch (error: any) {
      console.error('User action error:', error);
      toast({
        title: '오류',
        description: error.message || '작업 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      const result = await bulkUserAction({
        userIds: selectedUsers as any[],
        action: bulkAction,
        reason: bulkActionData.reason,
      });

      if (result.success) {
        toast({
          title: '성공',
          description: `${result.processed}개 사용자에 대한 작업이 완료되었습니다.`,
        });
      } else {
        toast({
          title: '부분 완료',
          description: `${result.processed}개 성공, ${result.failed}개 실패`,
          variant: 'destructive',
        });
      }

      setSelectedUsers([]);
      setShowBulkActionDialog(false);
      setBulkAction(null);
      setBulkActionData({});
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: '오류',
        description: error.message || '일괄 작업 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Handle data export
  const handleExport = async () => {
    try {
      // Note: Export functionality would need to be implemented as a separate Convex action
      // For now, we'll show a placeholder message
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

  // User selection handlers
  const handleUserSelect = (userId: string, isSelected: boolean) => {
    setSelectedUsers(prev => (isSelected ? [...prev, userId] : prev.filter(id => id !== userId)));
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedUsers(isSelected ? users.map(user => user.id) : []);
  };

  // Modal handlers
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleBulkActionClick = (
    action: 'approve' | 'reject' | 'delete' | 'activate' | 'deactivate'
  ) => {
    if (selectedUsers.length === 0) {
      toast({
        title: '알림',
        description: '작업할 사용자를 선택해주세요.',
      });
      return;
    }
    setBulkAction(action);
    setShowBulkActionDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">시스템 사용자를 관리하고 권한을 설정합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPaginationOpts(prev => ({ ...prev, cursor: null }))}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={() => setPaginationOpts(prev => ({ ...prev, cursor: null }))}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selectedUsers.length}명 선택됨</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkActionClick('approve')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  일괄 승인
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkActionClick('reject')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  일괄 거절
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkActionClick('change_role')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  역할 변경
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkActionClick('delete')}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  일괄 삭제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <UserTable
            users={users}
            loading={loading}
            selectedUsers={selectedUsers}
            onSelectionChange={(userIds: string[]) => setSelectedUsers(userIds)}
            onSelectAll={handleSelectAll}
            onViewUser={handleUserClick}
            onEditUser={async user => handleUserAction('update', user, { role: 'kol' })}
            onDeleteUser={async user => handleUserAction('delete', user)}
            onApproveUser={async user => handleUserAction('approve', user)}
            onRejectUser={async user => handleUserAction('reject', user, { reason: '거절 사유' })}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {usersResult && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">현재 페이지: {users.length}명 표시</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!paginationOpts.cursor}
            >
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                {
                  length: Math.min(
                    5,
                    (usersResult.total || 0) / (paginationOpts.numItems || 20) || 1
                  ),
                },
                (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={
                        page ===
                        (paginationOpts.cursor ? usersResult.page.length : 0) /
                          (paginationOpts.numItems || 20) +
                          1
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => {
                        setPaginationOpts(prev => ({
                          ...prev,
                          cursor: null,
                        }));
                      }}
                    >
                      {page}
                    </Button>
                  );
                }
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
              다음
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />

      {/* User Add Modal */}
      <UserAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          setPaginationOpts(prev => ({ ...prev, cursor: null }));
        }}
      />

      {/* Bulk Action Dialog */}
      <AlertDialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 작업 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'approve' && `${selectedUsers.length}명의 사용자를 승인하시겠습니까?`}
              {bulkAction === 'reject' && `${selectedUsers.length}명의 사용자를 거절하시겠습니까?`}
              {bulkAction === 'delete' &&
                `${selectedUsers.length}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
              {bulkAction === 'change_role' && (
                <div className="mt-4 space-y-4">
                  <p>{selectedUsers.length}명의 사용자 역할을 변경합니다.</p>
                  <Select
                    value={bulkActionData.role}
                    onValueChange={value => setBulkActionData({ ...bulkActionData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kol">KOL</SelectItem>
                      <SelectItem value="ol">OL</SelectItem>
                      <SelectItem value="shop_owner">전문점 원장</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={bulkAction === 'change_role' && !bulkActionData.role}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
