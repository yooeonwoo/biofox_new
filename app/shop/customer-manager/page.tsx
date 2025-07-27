'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShopCustomerCard from './components/ShopCustomerCard';
import { PageHeader } from '@/components/clinical/PageHeader';
import { ShopCustomerData } from './lib/types';

export default function ShopCustomerManagerPage() {
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
    }
  }, [authUser, authLoading, router]);

  // 로딩 상태
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              셀프 성장 관리 페이지를 준비하고 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 실제 프로필 데이터 사용
  // profile이 존재하면 created_at도 필수 필드이므로 반드시 존재
  const contractDate = new Date(profile.created_at!).toISOString().split('T')[0] as string;

  // profile은 이미 null 체크를 통과했고, schema에서 name은 필수 필드
  const shopData: ShopCustomerData = {
    name: profile.shop_name || profile.name || '전문점',
    contractDate: contractDate,
    manager: profile.name || '담당자',
  };

  return (
    <div>
      {/* 헤더 */}
      <PageHeader title="셀프 성장 관리" backPath="/shop" showAddButton={false} />

      {/* 메인 컨테이너 */}
      <main className="mx-auto w-full max-w-none xs:max-w-full sm:max-w-2xl">
        <div className="space-y-4 p-2 xs:space-y-5 xs:p-3 md:px-0 md:py-6">
          <ShopCustomerCard customer={shopData} cardNumber={1} shopId={profile._id} />
        </div>
      </main>
    </div>
  );
}
