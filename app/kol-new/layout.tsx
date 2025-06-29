"use client";

import { ReactNode, useState } from "react";
import KolHeader from "@/app/components/layout/KolHeader";
import KolSidebar from "@/app/components/layout/KolSidebar";
import KolMobileMenu from "@/app/components/layout/KolMobileMenu";
import KolFooter from "@/app/components/layout/KolFooter";

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    name: "테스트 사용자",
    shopName: "테스트 샵",
    userImage: undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데스크톱 사이드바 */}
      <KolSidebar />
      
      {/* 헤더 - 사이드바가 있을 때 왼쪽 여백 추가 */}
      <div className="lg:pl-72">
        <KolHeader
          userName={tempUser.name}
          shopName={tempUser.shopName}
          userImage={tempUser.userImage}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          showMenuButton={true}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
      </div>
      
      {/* 모바일 메뉴 */}
      <KolMobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        userName={tempUser.name}
        shopName={tempUser.shopName}
        userImage={tempUser.userImage}
      />
      
      {/* 메인 콘텐츠 영역 - 사이드바가 있을 때 왼쪽 여백 추가 */}
      <div className="lg:pl-72">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        
        <KolFooter />
      </div>
    </div>
  );
}