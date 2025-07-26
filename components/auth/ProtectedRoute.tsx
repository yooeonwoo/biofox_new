'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'kol' | 'sales' | 'admin' | 'ol' | 'shop_owner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  requireAuth = true,
  fallbackUrl = '/signin',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 인증이 필요한데 인증되지 않은 경우
      if (requireAuth && !isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // 권한 체크가 필요한 경우
      if (isAuthenticated && allowedRoles && profile?.role) {
        if (!allowedRoles.includes(profile.role as UserRole)) {
          router.push(redirectTo || '/');
          return;
        }
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    profile,
    allowedRoles,
    requireAuth,
    fallbackUrl,
    redirectTo,
    router,
  ]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 인증이 필요한데 인증되지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (
    isAuthenticated &&
    allowedRoles &&
    profile?.role &&
    !allowedRoles.includes(profile.role as UserRole)
  ) {
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
