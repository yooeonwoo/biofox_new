'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
// TODO: Supabase 인증으로 교체 예정

// 아이콘 컴포넌트
import { 
  LayoutDashboard, Users, 
  LogOut, Menu, X, UserPlus, FileInput, BarChart, ChevronLeft, ChevronRight, Settings, FileEdit
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // TODO: Supabase 인증으로 교체 예정
  
  // 사이드바 상태를 localStorage에서 로드
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  useEffect(() => {
    // TODO: Supabase 관리자 인증 로직 구현
    async function checkAdmin() {
      try {
        // 임시로 관리자 권한 부여
        setIsAdmin(true);
        setIsLoading(false);
      } catch (error) {
        console.error('권한 확인 중 오류 발생:', error);
        setIsLoading(false);
      }
    }
    
    checkAdmin();
  }, []);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newCollapsedState));
  };
  
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
    { name: 'KOL 데이터 입력', href: '/admin-dashboard/kol-data-entry', icon: <FileInput size={20} /> },
    { name: 'KOL 현황', href: '/admin-dashboard/kol-dashboard', icon: <BarChart size={20} /> },
    { name: 'KOL 메트릭스 관리', href: '/admin-dashboard/kol-metrics-management', icon: <Settings size={20} /> },
    { name: '수기 실적 입력', href: '/admin-dashboard/manual-metrics', icon: <FileEdit size={20} /> },
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
      <aside className={`hidden md:flex md:flex-col md:bg-white md:border-r border-gray-200 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
      }`}>
        <div className={`border-b border-gray-200 flex items-center ${
          isSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-4'
        }`}>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">BIOFOX 관리자</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
            title={isSidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center text-gray-700 rounded-lg hover:bg-gray-100 group relative ${
                isSidebarCollapsed ? 'p-3 justify-center' : 'p-2'
              }`}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              <span className="text-gray-500 group-hover:text-gray-700 flex-shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="ml-3">{item.name}</span>
              )}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>
        <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center text-gray-700 rounded-lg hover:bg-gray-100 group w-full text-left relative ${
              isSidebarCollapsed ? 'p-3 justify-center' : 'p-2'
            }`}
            title={isSidebarCollapsed ? "로그아웃" : undefined}
          >
            <LogOut size={20} className="text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="ml-3">로그아웃</span>
            )}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                로그아웃
              </div>
            )}
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
        {/* 데스크톱 헤더 */}
        <header className="hidden md:flex bg-white border-b border-gray-200 py-3 px-6 items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 mr-4"
              title={isSidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
            >
              <Menu size={20} />
            </button>
            <div className="text-sm text-gray-600">
              관리자 대시보드
            </div>
          </div>
        </header>

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