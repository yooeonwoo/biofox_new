'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export default function DashboardPage() {
  const { user, isLoading } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // 역할에 따라 적절한 페이지로 리다이렉트
      if (user.role === 'kol') {
        router.push('/kol-new');
      } else if (user.role === 'sales') {
        router.push('/admin-new');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">환영합니다!</h1>
        <p className="text-gray-600">역할에 따른 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
