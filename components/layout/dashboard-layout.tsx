"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  Wallet,
  Store,
  Shield,
  BadgeCheck,
  DollarSign,
  User,
  Menu,
  X
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { FoxLogo } from '@/components/ui/fox-logo';
import { AuroraText } from '@/components/ui/aurora-gradient';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: string;
}

export default function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
  
  // 관리자 메뉴 아이템
  const adminMenuItems = [
    {
      label: '관리자 대시보드',
      url: '/admin',
      icon: <LayoutDashboard size={18} />,
      isActive: pathname === '/admin' || pathname === '/admin/',
    },
    {
      label: '사용자 관리',
      url: '/admin/user-management',
      icon: <Users size={18} />,
      isActive: pathname.startsWith('/admin/user-management'),
    },
    {
      label: 'KOL 관리',
      url: '/admin/kols',
      icon: <BadgeCheck size={18} />,
      isActive: pathname.startsWith('/admin/kols'),
    },
    {
      label: '전문점 관리',
      url: '/admin/stores',
      icon: <Store size={18} />,
      isActive: pathname.startsWith('/admin/stores'),
    },
    {
      label: '매출 관리',
      url: '/admin/sales',
      icon: <DollarSign size={18} />,
      isActive: pathname.startsWith('/admin/sales'),
    }
  ];

  // KOL 메뉴 아이템
  const kolMenuItems = [
    {
      label: '대시보드',
      url: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      isActive: pathname === '/dashboard' || pathname === '/dashboard/',
    },
    {
      label: '매출 대시보드',
      url: '/dashboard/sales',
      icon: <BarChart3 size={18} />,
      isActive: pathname.startsWith('/dashboard/sales'),
    },
    {
      label: '전문점 순위',
      url: '/dashboard/shops',
      icon: <Store size={18} />,
      isActive: pathname.startsWith('/dashboard/shops'),
    },
    {
      label: '수당 내역',
      url: '/dashboard/commissions',
      icon: <Wallet size={18} />,
      isActive: pathname.startsWith('/dashboard/commissions'),
    },
    {
      label: '제품',
      url: '/dashboard/products',
      icon: <ShoppingBag size={18} />,
      isActive: pathname.startsWith('/dashboard/products'),
    },
    {
      label: '사용자',
      url: '/dashboard/users',
      icon: <Users size={18} />,
      isActive: pathname.startsWith('/dashboard/users'),
    },
    {
      label: '설정',
      url: '/dashboard/settings',
      icon: <Settings size={18} />,
      isActive: pathname.startsWith('/dashboard/settings'),
    },
  ];

  // 현재 역할에 맞는 메뉴 선택
  const menuItems = role === "본사관리자" ? adminMenuItems : kolMenuItems;
  
  // 사용자 이름 표시 (실제로는 Clerk에서 가져와야 함)
  const displayName = role === "본사관리자" ? "관리자" : "KOL";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 모바일 메뉴 버튼 */}
      <div className="md:hidden fixed top-0 left-0 p-4 z-40">
        <button
          type="button"
          className="p-2 rounded-md text-gray-700 bg-white shadow"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 모바일 사이드바 */}
      <div className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FoxLogo className="h-8 w-8" />
              <span className="text-xl font-semibold">BIOFOX KOL</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">
              <X size={24} />
            </button>
          </div>
          <div className="px-4 py-4">
            <nav className="flex-1 space-y-1">
              <p className="px-2 pt-2 text-xs font-semibold text-gray-400 uppercase">
                {role === "본사관리자" ? "관리자 메뉴" : "대시보드"}
              </p>
              
              {menuItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.url} 
                  className={cn(
                    "flex items-center px-2 py-2 mt-1 text-sm rounded-md",
                    item.isActive 
                      ? "bg-gray-100 text-blue-600 font-medium" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={cn(
                    "w-5 h-5 mr-3",
                    item.isActive ? "text-blue-600" : "text-gray-500"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-10">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center justify-center h-14 border-b border-gray-200">
            <FoxLogo className="h-8 w-8 mr-2" />
            <span className="text-xl font-semibold">
              <AuroraText text="BIOFOX KOL" className="text-xl font-semibold" />
            </span>
          </div>
          <div className="flex flex-col flex-grow px-4 mt-5">
            <nav className="flex-1 space-y-1">
              {/* 메뉴 타이틀 */}
              <p className="px-2 pt-2 text-xs font-semibold text-gray-400 uppercase">
                {role === "본사관리자" ? "관리자 메뉴" : "대시보드"}
              </p>
              
              {/* 메뉴 아이템 */}
              {menuItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.url} 
                  className={cn(
                    "flex items-center px-2 py-2 mt-1 text-sm rounded-md",
                    item.isActive 
                      ? "bg-gray-100 text-blue-600 font-medium" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 mr-3",
                    item.isActive ? "text-blue-600" : "text-gray-500"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* 헤더 */}
        <header className="flex justify-between items-center bg-white border-b p-4 h-16 shadow-sm">
          <h1 className="text-2xl font-bold ml-12 md:ml-0">{dynamicTitle}</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700">
                {displayName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 