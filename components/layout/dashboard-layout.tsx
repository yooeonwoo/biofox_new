"use client";

import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: string;
}

export default function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // 경로에 따라 동적으로 제목 설정
  let dynamicTitle = title;
  if (pathname.includes('/dashboard')) {
    dynamicTitle = "대시보드";
  } else if (pathname.includes('/stores')) {
    dynamicTitle = "전문점 관리";
  } else if (pathname.includes('/sales')) {
    dynamicTitle = "매출 현황";
  } else if (pathname.includes('/profile')) {
    dynamicTitle = "프로필";
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={dynamicTitle} />
        
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 