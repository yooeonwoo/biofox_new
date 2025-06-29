'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, Users, BarChart3, Bell, FileText, ShoppingBag, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoxLogo } from "@/components/ui/fox-logo";

interface KolSidebarProps {
  className?: string;
}

export default function KolSidebar({ className }: KolSidebarProps) {
  const pathname = usePathname();
  
  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    role: "kol"
  };
  
  const isTestRole = tempUser.role === "test";

  const navigation = [
    {
      name: '대시보드',
      href: '/kol-new',
      icon: Home,
      current: pathname === '/kol-new',
      show: !isTestRole
    },
    {
      name: '전문점 관리',
      href: '/kol-new/stores',
      icon: Store,
      current: pathname.startsWith('/kol-new/stores'),
      show: !isTestRole
    },
    {
      name: '고객 관리',
      href: '/kol-new/customer-manager',
      icon: Users,
      current: pathname.startsWith('/kol-new/customer-manager'),
      show: !isTestRole
    },
    {
      name: '임상사진',
      href: '/kol-new/clinical-photos',
      icon: Camera,
      current: pathname.startsWith('/kol-new/clinical-photos'),
      show: true
    },
    {
      name: '영업일지',
      href: '/kol-new/sales-journal',
      icon: FileText,
      current: pathname.startsWith('/kol-new/sales-journal'),
      show: !isTestRole
    },
    {
      name: '알림',
      href: '/kol-new/notifications',
      icon: Bell,
      current: pathname.startsWith('/kol-new/notifications'),
      show: !isTestRole
    }
  ];

  const externalLinks = [
    {
      name: '전문가몰',
      href: 'https://biofoxpro.co.kr/',
      icon: ShoppingBag,
      external: true
    },
    {
      name: '폭시',
      href: 'https://ad.biofoxi.com/',
      icon: FoxLogo,
      external: true
    }
  ];

  return (
    <div className={cn(
      "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col",
      className
    )}>
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
        <div className="flex h-16 shrink-0 items-center">
          <img 
            className="h-8 w-auto" 
            src="/images/biofox-logo.png" 
            alt="BIOFOX" 
          />
          <span className="ml-2 text-xl font-bold text-gray-900">BIOFOX</span>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.filter(item => item.show).map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        item.current
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <item.icon
                        className={cn(
                          item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">
                외부 링크
              </div>
              <ul role="list" className="-mx-2 space-y-1">
                {externalLinks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                    >
                      <item.icon
                        className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
} 