"use client";

import { AlertCircle, Pencil, Trash2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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

// 추가 모달 인터페이스
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userForm: {
    email: string;
    name: string;
    shopName: string;
    role: string;
  };
  setUserForm: (form: {
    email: string;
    name: string;
    shopName: string;
    role: string;
  }) => void;
  onSubmit: () => void;
}

// 역할 수정 모달 인터페이스
interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  editRole: string;
  setEditRole: (role: string) => void;
  onSubmit: () => void;
}

// 삭제 확인 모달 인터페이스
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onSubmit: () => void;
}

export function AddUserModal({
  isOpen,
  onClose,
  userForm,
  setUserForm,
  onSubmit
}: AddUserModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          새 사용자 추가
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          이메일만 등록하면 사용자가 나중에 직접 가입하거나 로그인할 때 계정을 설정할 수 있습니다.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <Input
              id="email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 (선택)
            </label>
            <Input
              id="name"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="홍길동"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              역할 *
            </label>
            <Select
              value={userForm.role}
              onValueChange={(role) => setUserForm({ ...userForm, role })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-300 shadow-lg">
                <SelectItem value="admin">본사관리자</SelectItem>
                <SelectItem value="kol">KOL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {userForm.role === 'kol' && (
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                샵명 (선택)
              </label>
              <Input
                id="shopName"
                value={userForm.shopName}
                onChange={(e) => setUserForm({ ...userForm, shopName: e.target.value })}
                placeholder="홍길동의 매장"
              />
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EditRoleModal({
  isOpen,
  onClose,
  selectedUser,
  editRole,
  setEditRole,
  onSubmit
}: EditRoleModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          사용자 역할 변경
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {selectedUser?.email} 사용자의 역할을 변경합니다.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-300 shadow-lg">
                <SelectItem value="admin">본사관리자</SelectItem>
                <SelectItem value="kol">KOL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Pencil className="mr-2 h-4 w-4" />
            변경 저장
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DeleteUserModal({
  isOpen,
  onClose,
  selectedUser,
  onSubmit
}: DeleteModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-6 w-full max-w-md">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle size={24} className="mr-2" />
          <h3 className="text-lg font-medium">사용자 삭제 확인</h3>
        </div>
        <p className="mb-4 text-gray-700">
          정말 {selectedUser?.email} 사용자를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            사용자 삭제
          </Button>
        </div>
      </div>
    </div>
  );
}