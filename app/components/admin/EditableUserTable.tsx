'use client';

import { useState } from 'react';
import { 
  Plus, Trash2, RefreshCw, Search 
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditableCell } from './EditableCell';

// 사용자 타입 정의
type User = {
  id: string;
  email: string;
  role?: string;
  name?: string;
  createdAt: string;
  // KOL 정보 추가
  kolId?: number | null;
  kolName?: string | null;
  shopName?: string | null;
  kolStatus?: string | null;
  region?: string | null;
};

// 필터 상태 타입 정의
type FilterState = {
  search: string;
  role: string;
};

interface EditableUserTableProps {
  users: User[];
  onRefresh: () => void;
  onAddUser: () => void;
  onDeleteUser: (user: User) => void;
  loading: boolean;
  error: string | null;
}

export function EditableUserTable({
  users,
  onRefresh,
  onAddUser,
  onDeleteUser,
  loading,
  error
}: EditableUserTableProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
  });

  // 필터링된 사용자 목록
  const filteredUsers = users.filter((user) => {
    const searchMatch = 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) || 
      (user.name && user.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.kolName && user.kolName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.shopName && user.shopName.toLowerCase().includes(filters.search.toLowerCase()));
      
    const roleMatch = !filters.role || user.role === filters.role;
    
    return searchMatch && roleMatch;
  });

  // 필드 업데이트 함수
  const updateField = async (
    userId: string, 
    field: string, 
    value: string, 
    table: 'users' | 'kols'
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/field`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value, table }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업데이트에 실패했습니다.');
      }

      const result = await response.json();
      console.log('필드 업데이트 성공:', result);

      toast({
        title: '업데이트 성공',
        description: `${field} 필드가 성공적으로 업데이트되었습니다.`,
      });

      // 데이터 새로고침
      onRefresh();
      
    } catch (error) {
      console.error('필드 업데이트 실패:', error);
      toast({
        title: '업데이트 실패',
        description: error instanceof Error ? error.message : '업데이트에 실패했습니다.',
        variant: 'destructive',
      });
      throw error; // EditableCell에서 에러 상태를 표시하기 위해 다시 throw
    }
  };

  // 역할 옵션
  const roleOptions = [
    { value: 'admin', label: '본사관리자' },
    { value: 'kol', label: 'KOL' },
  ];

  // 상태 옵션
  const statusOptions = [
    { value: 'active', label: '활성' },
    { value: 'pending', label: '대기중' },
    { value: 'inactive', label: '비활성' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">사용자 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center">
        <span className="text-red-500 text-lg font-medium">{error}</span>
        <Button variant="outline" className="mt-4" onClick={onRefresh}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">테이블에서 직접 편집 가능합니다. 셀을 클릭하여 수정하세요.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onAddUser}>
            <Plus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
          <Button variant="outline" onClick={onRefresh}>
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
          <SelectContent className="bg-white border-2 border-gray-300 shadow-lg">
            <SelectItem value="">전체 역할</SelectItem>
            <SelectItem value="admin">본사관리자</SelectItem>
            <SelectItem value="kol">KOL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 사용자 테이블 */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>샵명</TableHead>
              <TableHead>지역</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32">
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
                  <TableCell className="font-medium">
                    <EditableCell
                      value={user.email}
                      type="email"
                      onSave={(value) => updateField(user.id, 'email', value, 'users')}
                      placeholder="이메일 주소"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={user.name || user.kolName}
                      onSave={(value) => {
                        // KOL인 경우 kols 테이블의 name도 업데이트
                        if (user.role === 'kol') {
                          return Promise.all([
                            updateField(user.id, 'name', value, 'users'),
                            updateField(user.id, 'name', value, 'kols')
                          ]).then(() => {});
                        } else {
                          return updateField(user.id, 'name', value, 'users');
                        }
                      }}
                      placeholder="이름"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={user.shopName}
                      onSave={(value) => updateField(user.id, 'shop_name', value, 'kols')}
                      placeholder="샵명"
                      disabled={user.role !== 'kol'}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={user.region}
                      onSave={(value) => updateField(user.id, 'region', value, 'kols')}
                      placeholder="지역"
                      disabled={user.role !== 'kol'}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={user.role}
                      type="select"
                      options={roleOptions}
                      onSave={(value) => updateField(user.id, 'role', value, 'users')}
                    />
                  </TableCell>
                  <TableCell>
                    {user.role === 'kol' ? (
                      <EditableCell
                        value={user.kolStatus}
                        type="select"
                        options={statusOptions}
                        onSave={(value) => updateField(user.id, 'status', value, 'kols')}
                      />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteUser(user)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">사용자 삭제</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}