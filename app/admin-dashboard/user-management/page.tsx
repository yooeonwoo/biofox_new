'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, Pencil, Trash2, UserCheck, MailCheck, 
  AlertCircle, RefreshCw, Search 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddUserModal, EditRoleModal, DeleteUserModal } from '@/app/components/admin/UserModals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 사용자 타입 정의
type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt: string;
};

// 필터 상태 타입 정의
type FilterState = {
  search: string;
  role: string;
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
  });
  
  // 모달 상태 관리
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // 새 사용자 폼 상태
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'kol', // 기본값은 KOL
  });

  // 편집 사용자 폼 상태
  const [editRole, setEditRole] = useState('');
  
  // 사용자 데이터 불러오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 직접 Clerk API 호출 대신 Admin API 사용
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      console.error('사용자 목록 로딩 실패:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
      toast({
        title: '오류 발생',
        description: '사용자 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 필터링된 사용자 목록
  const filteredUsers = users.filter((user) => {
    const searchMatch = 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) || 
      (user.firstName && user.firstName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(filters.search.toLowerCase()));
      
    const roleMatch = !filters.role || user.role === filters.role;
    
    return searchMatch && roleMatch;
  });

  // 사용자 추가 핸들러
  const handleAddUser = async () => {
    try {
      // 폼 유효성 검사
      if (!newUser.email || !newUser.password || !newUser.role) {
        toast({
          title: '입력 오류',
          description: '이메일, 비밀번호, 역할은 필수 입력 항목입니다.',
          variant: 'destructive',
        });
        return;
      }
      
      // 서버 API 호출
      console.log('사용자 추가 요청:', newUser);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('사용자 추가 API 응답 오류:', responseData);
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || '사용자를 추가하는 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      console.log('사용자 추가 성공 응답:', responseData);
      
      // 성공 알림
      toast({
        title: '사용자 추가 성공',
        description: '새로운 사용자가 추가되었습니다.',
      });
      
      // 모달 닫고 폼 초기화
      setIsAddModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'kol',
      });
      
      // 사용자 목록 새로고침
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 추가 실패:', error);
      toast({
        title: '사용자 추가 실패',
        description: error.message || '사용자를 추가하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 사용자 역할 변경 핸들러
  const handleUpdateRole = async () => {
    if (!selectedUser || !editRole) return;

    try {
      // 서버 API 호출
      console.log('사용자 역할 변경 요청:', { userId: selectedUser.id, role: editRole });

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('사용자 역할 변경 API 응답 오류:', responseData);
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || '사용자 역할을 변경하는 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      console.log('사용자 역할 변경 성공 응답:', responseData);

      toast({
        title: '역할 변경 성공',
        description: '사용자 역할이 변경되었습니다.',
      });

      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      toast({
        title: '역할 변경 실패',
        description: error.message || '사용자 역할을 변경하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // 서버 API 호출
      console.log('사용자 삭제 요청:', selectedUser.id);

      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('사용자 삭제 API 응답 오류:', responseData);
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || '사용자를 삭제하는 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      console.log('사용자 삭제 성공 응답:', responseData);

      toast({
        title: '사용자 삭제 성공',
        description: '사용자가 삭제되었습니다.',
      });

      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      toast({
        title: '사용자 삭제 실패',
        description: error.message || '사용자를 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">시스템 사용자 및 권한을 관리합니다.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>
      
      {/* 필터링 영역 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이메일 또는 이름으로 검색"
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select
          value={filters.role}
          onValueChange={(role) => setFilters({ ...filters, role })}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="역할별 필터링" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 역할</SelectItem>
            <SelectItem value="admin">본사관리자</SelectItem>
            <SelectItem value="kol">KOL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 사용자 테이블 */}
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">사용자 정보를 불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <p className="text-lg font-medium text-gray-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchUsers}>
            다시 시도
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    <div className="flex flex-col items-center justify-center">
                      <p className="mb-2 text-muted-foreground">사용자가 없습니다.</p>
                      {filters.search || filters.role ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setFilters({ search: '', role: '' })}
                        >
                          필터 초기화
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            본사관리자
                          </span>
                        ) : user.role === 'kol' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            KOL
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.role || '미지정'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditRole(user.role || '');
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">역할 수정</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">사용자 삭제</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* 사용자 추가 모달 */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userForm={newUser}
        setUserForm={setNewUser}
        onSubmit={handleAddUser}
      />

      {/* 역할 수정 모달 */}
      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedUser={selectedUser}
        editRole={editRole}
        setEditRole={setEditRole}
        onSubmit={handleUpdateRole}
      />

      {/* 사용자 삭제 확인 모달 */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        selectedUser={selectedUser}
        onSubmit={handleDeleteUser}
      />
    </div>
  );
} 