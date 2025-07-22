'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'kol' | 'ol' | 'shop_owner';
  fallbackUrl?: string;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  fallbackUrl = '/signin',
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // 현재 경로를 리다이렉트 URL로 저장
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [isLoading, isAuthenticated, requireAuth, fallbackUrl, router]);

  // 로딩 중일 때
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // 인증이 필요하지만 로그인하지 않은 경우
  if (requireAuth && !isAuthenticated) {
    // useEffect가 리다이렉트를 처리하므로 여기서는 로딩 화면 표시
    return (
      loadingComponent || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // 특정 역할이 필요한 경우 권한 확인
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      unauthorizedComponent || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">접근 권한이 없습니다</h1>
            <p className="mb-4 text-gray-600">
              이 페이지에 접근하려면 {getRoleLabel(requiredRole)} 권한이 필요합니다.
            </p>
            <p className="text-sm text-gray-500">
              현재 권한: {profile?.role ? getRoleLabel(profile.role) : '없음'}
            </p>
          </div>
        </div>
      )
    );
  }

  // 모든 조건을 통과한 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

function getRoleLabel(role: string): string {
  const roleLabels = {
    admin: '관리자',
    kol: 'KOL',
    ol: 'OL',
    shop_owner: '매장 관리자',
  };

  return roleLabels[role as keyof typeof roleLabels] || role;
}
