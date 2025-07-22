'use client';

import { ReactNode, useState } from 'react';
import ShopHeader from './customer-manager/components/ShopHeader';
import ShopSidebar from './customer-manager/components/ShopSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requiredRole="shop_owner" fallbackUrl="/signin">
      <ShopLayoutContent>{children}</ShopLayoutContent>
    </ProtectedRoute>
  );
}

function ShopLayoutContent({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(); // Convex Auth 로그아웃 사용
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 사용자 정보 준비
  const userName = profile?.display_name || user?.name || '전문점 관리자';
  const shopName = profile?.shop_name || '매장명 미설정';

  return (
    <div className="flex min-h-screen flex-col">
      <ShopHeader
        userName={userName}
        shopName={shopName}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1">
        <ShopSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
