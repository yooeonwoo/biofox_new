'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DevUser {
  id: number;
  name: string;
  email: string;
  role: string;
  description: string;
}

const DEV_USERS: DevUser[] = [
  {
    id: 56,
    name: '정광원',
    email: 'jkw6746@naver.com',
    role: 'kol',
    description: 'KOL 사용자 (엑스날 평내호평) - KOL ID: 65'
  },
  {
    id: 10,
    name: '이은혜',
    email: 'melierskin@gmail.com',
    role: 'kol',
    description: 'KOL 사용자 (믈리에스킨) - KOL ID: 6'
  },
  {
    id: 26,
    name: '양서우',
    email: 'buzzya@naver.com',
    role: 'kol',
    description: 'KOL 사용자 (아비에 대전) - KOL ID: 22'
  },
  {
    id: 41,
    name: '여지윤',
    email: '74yjy5100@naver.com',
    role: 'kol',
    description: 'KOL 사용자 (KOL 데이터 없음)'
  },
  {
    id: 6,
    name: 'reflance88',
    email: 'reflance88@gmail.com',
    role: 'admin',
    description: '관리자'
  }
];

export default function DevLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);
  const router = useRouter();

  // 프로덕션 환경에서는 접근 불가
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 불가</h1>
          <p className="text-gray-600">개발 환경에서만 사용할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (user: DevUser) => {
    setIsLoading(true);
    setSelectedUser(user);

    try {
      // 개발 환경용 임시 로그인 처리
      const userData = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      // localStorage에 사용자 정보 저장
      localStorage.setItem('dev-user', JSON.stringify(userData));

      // 쿠키에도 사용자 정보 저장 (서버사이드에서 사용)
      document.cookie = `dev-user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

      // 역할에 따라 적절한 페이지로 리다이렉트
      if (user.role === 'admin') {
        router.push('/admin-new');
      } else if (user.role === 'kol') {
        router.push('/kol-new');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('로그인 처리 중 오류:', error);
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            개발 환경 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            테스트용 계정을 선택하세요
          </p>
          <div className="mt-2 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              개발 환경 전용
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {DEV_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              disabled={isLoading}
              className={`
                group relative w-full flex justify-between items-center py-4 px-4 border rounded-lg text-left transition-colors
                ${selectedUser?.id === user.id 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'}
                ${isLoading && selectedUser?.id !== user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'}
                    `}>
                      {user.role === 'admin' ? '관리자' : 'KOL'}
                    </span>
                  </div>
                </div>
              </div>

              {isLoading && selectedUser?.id === user.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                개발 환경 전용 기능
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>이 페이지는 개발환경에서만 동작하며, 프로덕션에서는 접근할 수 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}