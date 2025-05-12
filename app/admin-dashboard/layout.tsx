'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

// 아이콘 컴포넌트
import { 
  LayoutDashboard, Users, Store, BarChart3, 
  PieChart, LogOut, Menu, X, UserPlus 
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  
  useEffect(() => {
    async function checkAdmin() {
      try {
        // Clerk이 로드되었고 사용자가 로그인했는지 확인
        if (!isLoaded) return;
        
        if (!isSignedIn || !user) {
          window.location.href = '/signin';
          return;
        }
        
        // 사용자 역할 확인 (메타데이터에서 역할 정보 가져오기)
        const userRole = user.publicMetadata?.role as string;
        
        if (userRole !== 'admin') {
          window.location.href = '/';
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('권한 확인 중 오류 발생:', error);
        window.location.href = '/';
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdmin();
  }, [isLoaded, isSignedIn, user]);
  
  // 로딩 중이거나 관리자가 아닌 경우 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // 리다이렉트 중이므로 아무것도 표시하지 않음
  }
  
  // 사이드바 메뉴 아이템
  const menuItems = [
    { name: '대시보드', href: '/admin-dashboard/main', icon: <LayoutDashboard size={20} /> },
    { name: '사용자 관리', href: '/admin-dashboard/user-management', icon: <UserPlus size={20} /> },
    { name: 'KOL 및 전문점 관리', href: '/admin-dashboard/entities', icon: <Users size={20} /> },
    { name: 'KOL 월별 지표', href: '/admin-dashboard/kol-metrics', icon: <BarChart3 size={20} /> },
    { name: '전문점 매출 관리', href: '/admin-dashboard/shop-sales', icon: <Store size={20} /> },
    { name: '제품 매출 비율', href: '/admin-dashboard/product-sales', icon: <PieChart size={20} /> },
  ];

  // 로그아웃 함수
  const handleLogout = () => {
    signOut(() => {
      window.location.href = '/';
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 사이드바 - 데스크톱 */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
            >
              <span className="mr-3 text-gray-500 group-hover:text-gray-700">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group w-full text-left"
          >
            <LogOut size={20} className="mr-3 text-gray-500 group-hover:text-gray-700" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 모바일 사이드바 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex flex-col z-40 w-64 bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
              <button
                type="button"
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3 text-gray-500 group-hover:text-gray-700">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group w-full text-left"
              >
                <LogOut size={20} className="mr-3 text-gray-500 group-hover:text-gray-700" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="md:hidden bg-white border-b border-gray-200 py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>
        
        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 