'use client';

import { ReactNode, useState } from 'react';
import KolHeader from '@/app/components/layout/KolHeader';
import KolSidebar from '@/app/components/layout/KolSidebar';
import KolFooter from '@/app/components/layout/KolFooter';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  return (
    <ProtectedRoute allowedRoles={['kol', 'admin', 'ol', 'shop_owner']}>
      <KolNewLayoutContent>{children}</KolNewLayoutContent>
    </ProtectedRoute>
  );
}

function KolNewLayoutContent({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile } = useAuth();

  const userData = {
    name: profile?.name || user?.email || '사용자',
    shopName: profile?.shop_name || '매장명 미설정',
    userImage: profile?.image || user?.user_metadata?.avatar_url,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 데스크탑 사이드바 (md 이상에서 보임) */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0">
        <KolSidebar {...userData} />
      </div>

      {/* 모바일 사이드바 (Sheet 컴포넌트 사용) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <KolSidebar {...userData} onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <KolHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">{children}</main>
        <KolFooter />
      </div>
    </div>
  );
}
