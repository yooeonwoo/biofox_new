"use client";

import { ReactNode, useState } from "react";
import KolHeader from "@/app/components/layout/KolHeader";
import KolSidebar from "@/app/components/layout/KolSidebar";
import KolFooter from "@/app/components/layout/KolFooter";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    name: "테스트 사용자",
    shopName: "테스트 샵",
    userImage: undefined,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 영역 */}
      <div className={cn(
        // 모바일: 숨김
        "hidden",
        // 태블릿: 축소 너비
        "md:block md:w-20 md:flex-shrink-0",
        // 데스크탑: 전체 너비
        "lg:w-72"
      )}>
        <KolSidebar />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <KolHeader
          userName={tempUser.name}
          shopName={tempUser.shopName}
          userImage={tempUser.userImage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
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