'use client';

import { ReactNode, useState } from 'react';
import KolHeader from '@/app/components/layout/KolHeader';
import KolSidebar from '@/app/components/layout/KolSidebar';
import KolFooter from '@/app/components/layout/KolFooter';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  return (
    <ProtectedRoute allowedRoles={['kol']}>
      <KolNewLayoutContent>{children}</KolNewLayoutContent>
    </ProtectedRoute>
  );
}

function KolNewLayoutContent({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSimpleAuth();

  // 사용자 정보 준비
  const userData = {
    name: user?.name || '사용자',
    shopName: '매장명 미설정',
    userImage: undefined,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 영역 */}
      <div
        className={cn(
          // 모바일: 숨김
          'hidden',
          // 태블릿: 축소 너비
          'md:block md:w-20 md:flex-shrink-0',
          // 데스크탑: 전체 너비
          'lg:w-72'
        )}
      >
        <KolSidebar />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <KolHeader
          userName={userData.name}
          shopName={userData.shopName}
          userImage={userData.userImage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">{children}</main>
        <KolFooter />
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <KolSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className="md:hidden"
        />
      )}
    </div>
  );
}
