'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/supabase-auth-provider';

type UserRole = 'kol' | 'sales' | 'admin' | 'ol' | 'shop_owner';

interface SupabaseProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
  fallbackUrl?: string;
}

export function SupabaseProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  requireAuth = true,
  fallbackUrl = '/signin',
}: SupabaseProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // TODO: Convex 프로필 조회 로직은 나중에 추가
  const profile = null;

  useEffect(() => {
    if (!loading) {
      // 인증이 필요한데 인증되지 않은 경우
      if (requireAuth && !user) {
        router.push(fallbackUrl);
        return;
      }

      // 권한 체크가 필요한 경우
      if (user && allowedRoles && profile) {
        if (!allowedRoles.includes(profile.role as UserRole)) {
          router.push(redirectTo || '/');
          return;
        }
      }
    }
  }, [loading, user, profile, allowedRoles, requireAuth, fallbackUrl, redirectTo, router]);

  // 로딩 중
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 인증이 필요한데 인증되지 않은 경우
  if (requireAuth && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // TODO: 권한 체크는 Convex 연동 후 구현
  // 현재는 로그인된 사용자는 모두 접근 가능

  return <>{children}</>;
}
