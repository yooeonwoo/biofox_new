'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Store,
  Users,
  BarChart3,
  Bell,
  ShoppingBag,
  Camera,
  X,
  LayoutDashboard,
  Bot,
  GraduationCap,
  MonitorPlay,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FoxLogo } from '@/components/ui/fox-logo';

interface KolSidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function KolSidebar({ className, isOpen = false, onClose }: KolSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    role: 'kol',
  };

  const isTestRole = tempUser.role === 'test';

  const navigation = [
    {
      name: '홈',
      href: '/kol-new/home',
      icon: Home,
      current: pathname === '/kol-new/home',
      show: !isTestRole,
    },
    {
      name: '대시보드',
      href: '/kol-new',
      icon: LayoutDashboard,
      current: pathname === '/kol-new',
      show: !isTestRole,
    },
    {
      name: '전문점 관리',
      href: '/kol-new/stores',
      icon: Store,
      current: pathname.startsWith('/kol-new/stores'),
      show: !isTestRole,
    },
    {
      name: '고객 관리',
      href: '/kol-new/customer-manager',
      icon: Users,
      current: pathname.startsWith('/kol-new/customer-manager'),
      show: !isTestRole,
    },
    {
      name: '임상사진',
      href: '/kol-new/clinical-photos',
      icon: Camera,
      current: pathname.startsWith('/kol-new/clinical-photos'),
      show: true,
    },

    {
      name: '알림',
      href: '/kol-new/notifications',
      icon: Bell,
      current: pathname.startsWith('/kol-new/notifications'),
      show: !isTestRole,
    },
  ];

  const externalLinks = [
    {
      name: '전문가몰',
      href: 'https://biofoxpro.co.kr/',
      icon: ShoppingBag,
      external: true,
    },
    {
      name: '폭시',
      href: 'https://ad.biofoxi.com/',
      icon: FoxLogo,
      external: true,
    },
    {
      name: '모두의 비서',
      href: 'https://foxyafinal.vercel.app/chat',
      icon: Bot,
      external: true,
    },
    {
      name: '폭스 과외선생님',
      href: 'https://foxyafinal.vercel.app/tutoring/ask',
      icon: GraduationCap,
      external: true,
    },
    {
      name: '인강 시스템',
      href: 'https://puce-sand-63033908.figma.site/',
      icon: MonitorPlay,
      external: true,
    },
  ];

  return (
    <>
      {/* 모바일 오버레이 배경 */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}

      {/* 사이드바 본체 */}
      <aside
        className={cn(
          // 모바일: 오버레이 (고정 위치)
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:hidden', // 태블릿 이상에서 숨김

          // 공통 스타일
          'flex flex-col border-r border-gray-200 bg-white shadow-lg',
          className
        )}
      >
        {/* 모바일 전용 콘텐츠 */}
        {/* 닫기 버튼 (모바일) */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul role="list" className="space-y-1">
            {navigation
              .filter(item => item.show)
              .map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-50',
                      item.current
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    )}
                    onClick={onClose} // 링크 클릭시 메뉴 닫기
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                      )}
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
          </ul>

          {/* 외부 링크 */}
          <div className="mt-8">
            <div className="mb-2 px-3 text-xs font-semibold leading-6 text-gray-400">외부 링크</div>
            <ul role="list" className="space-y-1">
              {externalLinks.map(item => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-50 hover:text-blue-600"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* 데스크탑/태블릿 사이드바 (일반 레이아웃용) */}
      <aside
        className={cn(
          'hidden h-full flex-col border-r border-gray-200 bg-white md:flex',
          // 태블릿: 축소/확장
          'md:transition-all md:duration-300',
          isExpanded ? 'md:w-72' : 'md:w-20',
          // 데스크탑: 전체 너비
          'lg:w-72'
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* 로고/브랜드 영역 */}
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <Link href="/kol-new" className="flex items-center gap-2">
            <img className="h-8 w-auto flex-shrink-0" src="/images/biofox-logo.png" alt="BIOFOX" />
            <span
              className={cn(
                'text-xl font-bold text-gray-900 transition-opacity duration-300',
                !isExpanded && 'md:opacity-0 lg:opacity-100'
              )}
            >
              BIOFOX
            </span>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul role="list" className="space-y-1">
            {navigation
              .filter(item => item.show)
              .map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-50',
                      item.current
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium transition-opacity duration-300',
                        !isExpanded && 'md:hidden lg:block'
                      )}
                    >
                      {item.name}
                    </span>

                    {/* 태블릿 툴팁 */}
                    {!isExpanded && (
                      <div className="absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-sm text-white md:group-hover:block lg:hidden">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
          </ul>

          {/* 외부 링크 섹션 */}
          <div className="mt-8">
            <div
              className={cn(
                'mb-2 px-3 text-xs font-semibold leading-6 text-gray-400 transition-opacity duration-300',
                !isExpanded && 'md:opacity-0 lg:opacity-100'
              )}
            >
              외부 링크
            </div>
            <ul role="list" className="space-y-1">
              {externalLinks.map(item => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-50 hover:text-blue-600"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
                    <span
                      className={cn(
                        'font-medium transition-opacity duration-300',
                        !isExpanded && 'md:hidden lg:block'
                      )}
                    >
                      {item.name}
                    </span>

                    {/* 태블릿 툴팁 */}
                    {!isExpanded && (
                      <div className="absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-sm text-white md:group-hover:block lg:hidden">
                        {item.name}
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}
