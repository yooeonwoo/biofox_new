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
  RefreshCw
} from 'lucide-react';
import { UserFiltersComponent } from '@/components/biofox-admin/users/UserFilters';
import { UserTable } from '@/components/biofox-admin/users/UserTable';
import { UserDetailModal } from '@/components/biofox-admin/users/UserDetailModal';
import { UserAddModal } from '@/components/biofox-admin/users/UserAddModal';
import type { User, UserFilters, PaginationState, BulkActionRequest } from '@/types/biofox-admin';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';

export default function UsersPage() {
  const { toast } = useToast();
  const supabase = createSupabaseClient();
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkActionRequest['action'] | null>(null);
  const [bulkActionData, setBulkActionData] = useState<any>({});

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      if (filters.hasRelationship !== undefined) {
        params.append('hasRelationship', filters.hasRelationship.toString());
      }
      if (filters.dateRange?.from) {
        params.append('createdFrom', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        params.append('createdTo', filters.dateRange.to.toISOString());
      }

      // Include access token in header for server-side auth
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const response = await fetch(`/api/users?${params}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        credentials: 'include'
      });
      
      if (!response.ok) {
        // 개발 환경에서는 401, 500 에러를 무시하고 더미 데이터 사용
        if (process.env.NODE_ENV === 'development' && (response.status === 401 || response.status === 500)) {
          console.warn('Development mode: Using dummy data due to API error', response.status);
          
          // 더미 데이터 설정
          const dummyUsers: User[] = [
            {
              id: 'mock-1',
              email: 'admin@test.com',
              name: '테스트 관리자',
              role: 'admin' as const,
              status: 'approved' as const,
              shop_name: '테스트 샵',
              region: '서울',
              naver_place_link: undefined,
              approved_at: new Date().toISOString(),
              approved_by: undefined,
              commission_rate: 10,
              total_subordinates: 0,
              active_subordinates: 0,
              current_relationship: undefined,
              stats: {
                total_sales_this_month: 0,
                total_commission_this_month: 0,
                total_clinical_cases: 0
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          setUsers(dummyUsers);
          setPagination({ page: 1, limit: 20, total: 1, totalPages: 1 });
          return;
        }
        
        // 프로덕션에서는 에러 throw
        const errorMessage = response.status === 500 
          ? 'API 서버 오류가 발생했습니다.' 
          : '사용자 목록을 불러오는데 실패했습니다.';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: '오류',
        description: '사용자 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user: User) => {
    // TODO: Implement edit functionality
    toast({
      title: '준비 중',
      description: '사용자 수정 기능은 준비 중입니다.',
    });
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`정말로 ${user.name}님을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '사용자 삭제에 실패했습니다.');
      }

      toast({
        title: '성공',
        description: '사용자가 삭제되었습니다.',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApproveUser = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) throw new Error('승인 처리에 실패했습니다.');

      toast({
        title: '성공',
        description: `${user.name}님이 승인되었습니다.`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: '승인 처리에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectUser = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) throw new Error('거절 처리에 실패했습니다.');

      toast({
        title: '성공',
        description: `${user.name}님이 거절되었습니다.`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: '거절 처리에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: selectedUsers,
          action: bulkAction,
          data: bulkActionData,
        }),
      });

      if (!response.ok) throw new Error('일괄 작업에 실패했습니다.');

      const result = await response.json();
      
      toast({
        title: '성공',
        description: `${result.affected}명의 사용자에 대한 작업이 완료되었습니다.`,
      });

      if (result.results.failed.length > 0) {
        console.error('Failed operations:', result.results.failed);
      }

      setSelectedUsers([]);
      setShowBulkActionDialog(false);
      setBulkAction(null);
      setBulkActionData({});
      fetchUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: '일괄 작업에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const prepareBulkAction = (action: BulkActionRequest['action']) => {
    if (selectedUsers.length === 0) {
      toast({
        title: '알림',
        description: '선택된 사용자가 없습니다.',
      });
      return;
    }

    setBulkAction(action);
    setShowBulkActionDialog(true);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      if (filters.hasRelationship !== undefined) {
        params.append('hasRelationship', filters.hasRelationship.toString());
      }
      if (filters.dateRange?.from) params.append('createdFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) params.append('createdTo', filters.dateRange.to.toISOString());

      const res = await fetch(`/api/users/export?${params.toString()}`);
      if (!res.ok) throw new Error('엑셀 내보내기에 실패했습니다.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '엑셀 내보내기에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleAddUserSuccess = () => {
    fetchUsers(); // 사용자 목록 새로고침
    toast({
      title: '성공',
      description: '새 사용자가 성공적으로 추가되었습니다.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">
            시스템 사용자를 관리하고 권한을 설정합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
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
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedUsers.length}명 선택됨
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBulkAction('approve')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  일괄 승인
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBulkAction('reject')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  일괄 거절
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBulkAction('change_role')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  역할 변경
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBulkAction('delete')}
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
            onSelectionChange={setSelectedUsers}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}명 중 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
      />

      {/* User Add Modal */}
      <UserAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddUserSuccess}
      />

      {/* Bulk Action Dialog */}
      <AlertDialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 작업 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'approve' && `${selectedUsers.length}명의 사용자를 승인하시겠습니까?`}
              {bulkAction === 'reject' && `${selectedUsers.length}명의 사용자를 거절하시겠습니까?`}
              {bulkAction === 'delete' && `${selectedUsers.length}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
              {bulkAction === 'change_role' && (
                <div className="space-y-4 mt-4">
                  <p>{selectedUsers.length}명의 사용자 역할을 변경합니다.</p>
                  <Select
                    value={bulkActionData.role}
                    onValueChange={(value) => setBulkActionData({ ...bulkActionData, role: value })}
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
