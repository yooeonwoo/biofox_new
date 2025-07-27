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
  name: string;
  shopName: string;
  userImage?: string | null;
  onClose?: () => void;
  className?: string;
}

export default function KolSidebar({
  name,
  shopName,
  userImage,
  onClose,
  className,
}: KolSidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true); // 항상 확장된 상태로 시작

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
      name: '영업 관리',
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
    <div className={cn('flex h-full flex-col border-r border-gray-200 bg-white', className)}>
      {/* 로고 및 닫기 버튼 */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <Link href="/kol-new" className="flex items-center gap-2" onClick={onClose}>
          <img className="h-8 w-auto" src="/images/biofox-logo.png" alt="BIOFOX" />
          <span className="text-xl font-bold text-gray-900">BIOFOX</span>
        </Link>
        {/* 모바일에서만 닫기 버튼 표시 (onClose가 있을 경우) */}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* 사용자 프로필 */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-full"
            src={userImage || `https://ui-avatars.com/api/?name=${name}&background=random`}
            alt={name}
          />
          <div>
            <div className="font-semibold text-gray-800">{name}</div>
            <div className="text-sm text-gray-500">{shopName}</div>
          </div>
        </div>
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-50',
                    item.current ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:text-blue-600'
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

        {/* 외부 링크 섹션 */}
        <div className="mt-auto p-4">
          <div className="mb-2 px-3 text-xs font-semibold leading-6 text-gray-400">외부 링크</div>
          <ul role="list" className="space-y-1">
            {externalLinks.map(item => (
              <li key={item.name}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-50 hover:text-blue-600"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
                  <span className="font-medium">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
