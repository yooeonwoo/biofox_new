'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AddUserModal, DeleteUserModal } from '@/app/components/admin/UserModals';
import { EditableUserTable } from '@/app/components/admin/EditableUserTable';

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

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 모달 상태 관리
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // 새 사용자 폼 상태
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    shopName: '',
    role: 'kol', // 기본값은 KOL
  });
  
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

  // 사용자 추가 핸들러
  const handleAddUser = async () => {
    try {
      // 폼 유효성 검사
      if (!newUser.email || !newUser.role) {
        toast({
          title: '입력 오류',
          description: '이메일과 역할은 필수 입력 항목입니다.',
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
        title: '사용자 초대 성공',
        description: '이메일로 사용자가 등록되었습니다. 사용자는 첫 로그인 시 계정을 설정할 수 있습니다.',
      });
      
      // 모달 닫고 폼 초기화
      setIsAddModalOpen(false);
      setNewUser({
        email: '',
        name: '',
        shopName: '',
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


  // 사용자 삭제 핸들러
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // 서버 API 호출
      console.log('사용자 삭제 요청:', selectedUser.id);

      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('사용자 삭제 API 응답 오류:', responseData);
        let errorMessage = '사용자를 삭제하는 중 오류가 발생했습니다.';
        
        if (responseData.error) {
          errorMessage = responseData.error;
          
          // 상세 메시지가 있으면 포함
          if (responseData.details) {
            errorMessage += `\n${responseData.details}`;
          }
        }
        
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
      console.error('사용자 삭제 중 오류가 발생했습니다:', error);
      toast({
        title: '사용자 삭제 실패',
        description: error.message || '사용자를 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 인라인 편집 가능한 사용자 테이블 */}
      <EditableUserTable
        users={users}
        onRefresh={fetchUsers}
        onAddUser={() => setIsAddModalOpen(true)}
        onDeleteUser={(user) => {
          setSelectedUser(user);
          setIsDeleteModalOpen(true);
        }}
        loading={loading}
        error={error}
      />
      
      {/* 사용자 추가 모달 */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userForm={newUser}
        setUserForm={setNewUser}
        onSubmit={handleAddUser}
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