'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// 아이콘 컴포넌트
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  UserPlus,
  FileInput,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileEdit,
} from 'lucide-react';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requiredRole="admin" fallbackUrl="/signin">
      <AdminDashboardContent>{children}</AdminDashboardContent>
    </ProtectedRoute>
  );
}

function AdminDashboardContent({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();

  // 사이드바 상태를 localStorage에서 로드
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newCollapsedState));
  };

  // 사이드바 메뉴 아이템
  const menuItems = [
    { name: '대시보드', href: '/admin-dashboard/main', icon: <LayoutDashboard size={20} /> },
    { name: '사용자 관리', href: '/admin-dashboard/user-management', icon: <UserPlus size={20} /> },
    { name: 'KOL 및 전문점 관리', href: '/admin-dashboard/entities', icon: <Users size={20} /> },
    {
      name: 'KOL 데이터 입력',
      href: '/admin-dashboard/kol-data-entry',
      icon: <FileInput size={20} />,
    },
    { name: 'KOL 현황', href: '/admin-dashboard/kol-dashboard', icon: <BarChart size={20} /> },
    {
      name: 'KOL 메트릭스 관리',
      href: '/admin-dashboard/kol-metrics-management',
      icon: <Settings size={20} />,
    },
    {
      name: '수기 실적 입력',
      href: '/admin-dashboard/manual-metrics',
      icon: <FileEdit size={20} />,
    },
  ];

  // TODO: Supabase 로그아웃 함수 구현
  const handleLogout = () => {
    // TODO: Supabase 로그아웃 로직 구현
    console.log('로그아웃 시도');
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 사이드바 - 데스크톱 */}
      <aside
        className={`hidden border-gray-200 transition-all duration-300 md:flex md:flex-col md:border-r md:bg-white ${
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
        }`}
      >
        <div
          className={`flex items-center border-b border-gray-200 ${
            isSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-4'
          }`}
        >
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
            title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {menuItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center rounded-lg text-gray-700 hover:bg-gray-100 ${
                isSidebarCollapsed ? 'justify-center p-3' : 'p-2'
              }`}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              <span className="flex-shrink-0 text-gray-500 group-hover:text-gray-700">
                {item.icon}
              </span>
              {!isSidebarCollapsed && <span className="ml-3">{item.name}</span>}
              {isSidebarCollapsed && (
                <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>
        <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`group relative flex w-full items-center rounded-lg text-left text-gray-700 hover:bg-gray-100 ${
              isSidebarCollapsed ? 'justify-center p-3' : 'p-2'
            }`}
            title={isSidebarCollapsed ? '로그아웃' : undefined}
          >
            <LogOut size={20} className="flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            {!isSidebarCollapsed && <span className="ml-3">로그아웃</span>}
            {isSidebarCollapsed && (
              <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                로그아웃
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* 모바일 사이드바 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
              <button
                type="button"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {menuItems.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center rounded-lg p-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3 text-gray-500 group-hover:text-gray-700">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="group flex w-full items-center rounded-lg p-2 text-left text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={20} className="mr-3 text-gray-500 group-hover:text-gray-700" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 데스크톱 헤더 */}
        <header className="hidden items-center justify-between border-b border-gray-200 bg-white px-6 py-3 md:flex">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
              title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              <Menu size={20} />
            </button>
            <div className="text-sm text-gray-600">관리자 대시보드</div>
          </div>
        </header>

        {/* 모바일 헤더 */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:hidden">
          <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
