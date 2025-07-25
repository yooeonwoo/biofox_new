'use client';

import { ReactNode, useState } from 'react';
import KolHeader from '@/app/components/layout/KolHeader';
import KolSidebar from '@/app/components/layout/KolSidebar';
import KolFooter from '@/app/components/layout/KolFooter';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  // 인증 우회: ProtectedRoute 제거
  return <KolNewLayoutContent>{children}</KolNewLayoutContent>;
}

function KolNewLayoutContent({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile } = useAuth();

  // 사용자 정보 준비
  const userData = {
    name: profile?.display_name || user?.name || '사용자',
    shopName: profile?.shop_name || '매장명 미설정',
    userImage: profile?.profile_image_url || user?.image,
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
