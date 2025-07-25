'use client';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  Camera,
  Users,
  TrendingUp,
  Shield,
  ShoppingBag,
  Bell,
  Bot,
  GraduationCap,
  MonitorPlay,
} from 'lucide-react';

const ICONS = [
  { href: '/kol-new', label: '대시보드', Icon: LayoutDashboard },
  { href: '/kol-new/stores', label: '전문점 관리', Icon: Store },
  { href: '/kol-new/clinical-photos', label: '임상사진', Icon: Camera },
  { href: '/kol-new/customer-manager', label: '고객 관리', Icon: Users },
  { href: '/kol-new/notifications', label: '알림', Icon: Bell },
  { href: 'https://biofoxpro.co.kr/', label: '전문가몰', Icon: ShoppingBag, external: true },
  { href: 'https://foxyafinal.vercel.app/chat', label: '모두의 비서', Icon: Bot, external: true },
  {
    href: 'https://foxyafinal.vercel.app/tutoring/ask',
    label: '폭스 과외선생님',
    Icon: GraduationCap,
    external: true,
  },
  {
    href: 'https://puce-sand-63033908.figma.site/',
    label: '인강 시스템',
    Icon: MonitorPlay,
    external: true,
  },
];

export default function KolHomePage() {
  return (
    <main className="flex flex-col items-center p-6">
      <div className="mb-8">
        <h1 className="text-center text-xl font-bold text-gray-900">KOL 홈</h1>
        <p className="mt-2 text-center text-sm text-gray-600">원하는 기능을 선택하세요</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 place-items-center gap-6">
        {ICONS.map(({ href, label, Icon, external }) =>
          external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <Icon className="mb-2 size-6 text-blue-600 transition-transform group-hover:scale-110" />
              <span className="px-1 text-center text-[11px] leading-tight text-gray-700 xs:text-xs">
                {label}
              </span>
            </a>
          ) : (
            <Link
              key={href}
              href={href}
              className="group flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <Icon className="mb-2 size-6 text-blue-600 transition-transform group-hover:scale-110" />
              <span className="px-1 text-center text-[11px] leading-tight text-gray-700 xs:text-xs">
                {label}
              </span>
            </Link>
          )
        )}
      </div>
    </main>
  );
}
