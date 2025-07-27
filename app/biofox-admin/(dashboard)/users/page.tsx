'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserTable } from '@/components/biofox-admin/users/UserTable';
import { UserDetailModal } from '@/components/biofox-admin/users/UserDetailModal';
import { UserAddModal } from '@/components/biofox-admin/users/UserAddModal';
import { UserFilters } from '@/components/biofox-admin/users/UserFilters';
import { BulkActionButton } from '@/components/biofox-admin/users/BulkActionButton';
import { ConvexQueryState, LoadingState, ErrorState } from '@/components/ui/loading';
import { usePaginatedConvexQuery } from '@/hooks/useConvexQuery';
import { Download, UserPlus } from 'lucide-react';
import type { User, UserFilters as UserFiltersType } from '@/types/biofox-admin';

// Convex imports

export default function UsersPage() {
  const { toast } = useToast();

  // States
  const [filters, setFilters] = useState<UserFiltersType>({});
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
    'approve' | 'reject' | 'delete' | 'activate' | 'deactivate' | 'change_role' | null
  >(null);
  const [bulkActionData, setBulkActionData] = useState<any>({});

  // 표준화된 Convex queries
  const usersQuery = usePaginatedConvexQuery(api.users.listUsers, {
    paginationOpts,
    search: filters.search,
    role: filters.role,
    status: filters.status,
    createdFrom: filters.dateRange?.from?.toISOString(),
    createdTo: filters.dateRange?.to?.toISOString(),
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Mutations with optimistic updates
  const updateUser = useMutation(api.userMutations.updateUser).withOptimisticUpdate(
    (localStore, args) => {
      const { userId, updates } = args;
      const existingUsers = localStore.getQuery(api.users.listUsers, {
        paginationOpts,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        createdFrom: filters.dateRange?.from?.toISOString(),
        createdTo: filters.dateRange?.to?.toISOString(),
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (existingUsers !== undefined) {
        const updatedUsers = {
          ...existingUsers,
          page: existingUsers.page?.map((user: any) =>
            user._id === userId ? { ...user, ...updates } : user
          ),
        };
        localStore.setQuery(
          api.users.listUsers,
          {
            paginationOpts,
            search: filters.search,
            role: filters.role,
            status: filters.status,
            createdFrom: filters.dateRange?.from?.toISOString(),
            createdTo: filters.dateRange?.to?.toISOString(),
            sortBy: 'created_at',
            sortOrder: 'desc',
          },
          updatedUsers
        );
      }
    }
  );

  const approveUser = useMutation(api.userMutations.approveUser);
  const rejectUser = useMutation(api.userMutations.rejectUser);
  const bulkUserAction = useMutation(api.userMutations.bulkUserAction);

  // Extract processed data
  const users =
    usersQuery.items?.map((user: any) => ({
      ...user,
      id: user._id,
      stats: {
        total_sales_this_month: 0,
        total_commission_this_month: 0,
        total_clinical_cases: 0,
      },
    })) || [];

  // Handle pagination
  const handleNextPage = () => {
    if (usersQuery.hasNextPage && usersQuery.cursor) {
      setPaginationOpts(prev => ({
        ...prev,
        cursor: usersQuery.cursor,
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
  const handleFiltersChange = (newFilters: UserFiltersType) => {
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
        role: bulkActionData.role,
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
      // Export logic here
      toast({
        title: '성공',
        description: '엑셀 파일 다운로드가 시작됩니다.',
      });
    } catch (error) {
      toast({
        title: '실패',
        description: '엑셀 다운로드에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // User selection handlers
  const handleUserSelect = (userId: string, isSelected: boolean) => {
    setSelectedUsers(prev => (isSelected ? [...prev, userId] : prev.filter(id => id !== userId)));
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedUsers(isSelected ? users.map((user: any) => user.id) : []);
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
    action: 'approve' | 'reject' | 'delete' | 'activate' | 'deactivate' | 'change_role'
  ) => {
    if (selectedUsers.length === 0) {
      toast({
        title: '알림',
        description: '작업할 사용자를 선택해주세요.',
      });
      return;
    }
    setBulkAction(action as any);
    setShowBulkActionDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground">시스템 사용자들을 관리하고 권한을 설정합니다.</p>
        </div>
        <div className="flex gap-2">
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
      <UserFilters filters={filters} onFiltersChange={handleFiltersChange} onSearch={() => {}} />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex gap-2">
          <BulkActionButton
            action="approve"
            count={selectedUsers.length}
            onClick={() => handleBulkActionClick('approve')}
          />
          <BulkActionButton
            action="reject"
            count={selectedUsers.length}
            onClick={() => handleBulkActionClick('reject')}
          />
        </div>
      )}

      {/* User Table with Standardized State Handling */}
      <Card>
        <CardContent className="p-0">
          <ConvexQueryState
            data={usersQuery.items}
            title="사용자 목록을 불러오는 중..."
            emptyComponent={
              <div className="p-8 text-center">
                <UserPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">등록된 사용자가 없습니다</h3>
                <p className="mb-4 text-muted-foreground">새로운 사용자를 추가하여 시작하세요.</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />첫 번째 사용자 추가
                </Button>
              </div>
            }
          >
            {() => (
              <UserTable
                users={users}
                loading={usersQuery.isLoading}
                selectedUsers={selectedUsers}
                onSelectionChange={(userIds: string[]) => setSelectedUsers(userIds)}
                onViewUser={handleUserClick}
                onEditUser={async (user: User) => {
                  try {
                    await updateUser({ userId: user.id as any, updates: user });
                    toast({
                      title: '성공',
                      description: '사용자 정보가 업데이트되었습니다.',
                    });
                  } catch (error) {
                    toast({
                      title: '실패',
                      description: '사용자 정보 업데이트에 실패했습니다.',
                      variant: 'destructive',
                    });
                  }
                }}
                onDeleteUser={async (user: User) => {
                  try {
                    await bulkUserAction({ userIds: [user.id] as any[], action: 'delete' });
                    toast({
                      title: '성공',
                      description: '사용자가 삭제되었습니다.',
                    });
                  } catch (error) {
                    toast({
                      title: '실패',
                      description: '사용자 삭제에 실패했습니다.',
                      variant: 'destructive',
                    });
                  }
                }}
                onApproveUser={async (user: User) => {
                  try {
                    await approveUser({ userId: user.id as any });
                    toast({
                      title: '성공',
                      description: '사용자가 승인되었습니다.',
                    });
                  } catch (error) {
                    toast({
                      title: '실패',
                      description: '사용자 승인에 실패했습니다.',
                      variant: 'destructive',
                    });
                  }
                }}
                onRejectUser={async (user: User) => {
                  try {
                    await rejectUser({ userId: user.id as any, reason: '관리자 거절' });
                    toast({
                      title: '성공',
                      description: '사용자가 거절되었습니다.',
                    });
                  } catch (error) {
                    toast({
                      title: '실패',
                      description: '사용자 거절에 실패했습니다.',
                      variant: 'destructive',
                    });
                  }
                }}
              />
            )}
          </ConvexQueryState>
        </CardContent>
      </Card>

      {/* Pagination */}
      {usersQuery.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              setPaginationOpts(prev => ({
                ...prev,
                cursor: usersQuery.cursor,
              }))
            }
            disabled={usersQuery.isLoading}
          >
            더 보기
          </Button>
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
