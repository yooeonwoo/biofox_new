'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('kol' | 'sales')[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles = ['kol', 'sales'],
  redirectTo = '/signin',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // 권한이 없는 경우 홈페이지로 리다이렉트
      if (user && !allowedRoles.includes(user.role)) {
        router.push('/');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // 로딩 중이거나 인증되지 않은 경우 로딩 스피너 표시
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">접근 권한이 없습니다</h2>
          <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
