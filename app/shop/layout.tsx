"use client";

import { ReactNode, useState } from "react";
import KolHeader from "@/app/components/layout/KolHeader";
import ShopSidebar from "./components/ShopSidebar";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ShopLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // TODO: 실제 유저 데이터 연동 필요
  const userName = "전문점 관리자";
  const shopName = "테스트 전문점";
  
  return (
    <div className="flex flex-col min-h-screen">
      <KolHeader 
        userName={userName} 
        shopName={shopName} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1">
        <ShopSidebar />
        <main className="flex-1 p-6 bg-gray-50/50 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
} 