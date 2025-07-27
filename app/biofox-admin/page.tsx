'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BiofoxAdminPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    } else if (profile && profile.role !== 'admin') {
      // admin이 아닌 경우 권한 없음 페이지로 리다이렉트
      router.push('/unauthorized');
    } else if (profile) {
      // admin인 경우 사용자 관리 페이지로 리다이렉트
      router.replace('/biofox-admin/users');
    }
  }, [authUser, authLoading, profile, router]);

  // 로딩 상태
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">관리자 페이지를 준비하고 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
