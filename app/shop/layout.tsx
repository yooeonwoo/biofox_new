"use client";

import { ReactNode, useState } from "react";
import ShopHeader from "./customer-manager/components/ShopHeader";
import ShopSidebar from "./customer-manager/components/ShopSidebar";
import { useRouter } from "next/navigation";

export default function ShopLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // TODO: 실제 유저 데이터 연동 필요
  const userName = "전문점 관리자";
  const shopName = "테스트 전문점";
  
  return (
    <div className="flex flex-col min-h-screen">
      <ShopHeader 
        userName={userName} 
        shopName={shopName} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1">
        <ShopSidebar />
        <main className="flex-1 p-4 sm:p-6 bg-gray-50/50 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
} 