'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/supabase-auth-provider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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

  // Supabase 사용자가 있으면 Convex 프로필 조회
  const profile = useQuery(
    api.supabaseAuth.getProfileBySupabaseId,
    user ? { supabaseUserId: user.id } : 'skip'
  );

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
  if (loading || (user && profile === undefined)) {
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

  // 권한이 없는 경우
  if (user && allowedRoles && profile && !allowedRoles.includes(profile.role as UserRole)) {
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
