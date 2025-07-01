"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  Store,
  Camera,
  Users,
  TrendingUp,
  Shield,
  ShoppingBag,
  Bell,

} from "lucide-react";

const ICONS = [
  { href: "/kol-new", label: "대시보드", Icon: LayoutDashboard },
  { href: "/kol-new/stores", label: "전문점 관리", Icon: Store },
  { href: "/kol-new/clinical-photos", label: "임상사진", Icon: Camera },
  { href: "/kol-new/customer-manager", label: "고객 관리", Icon: Users },
  { href: "/kol-new/notifications", label: "알림", Icon: Bell },
  { href: "https://biofoxpro.co.kr/", label: "전문가몰", Icon: ShoppingBag, external: true },
];

export default function KolHomePage() {
  return (
    <main className="p-6 flex flex-col items-center">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 text-center">KOL 홈</h1>
        <p className="text-sm text-gray-600 text-center mt-2">원하는 기능을 선택하세요</p>
      </div>
      
      <div className="grid grid-cols-3 gap-6 place-items-center w-full max-w-md">
        {ICONS.map(({ href, label, Icon, external }) => (
          external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-24 h-24 flex flex-col items-center justify-center
                         bg-white border rounded-lg shadow-sm hover:shadow-md
                         transition-shadow group"
            >
              <Icon className="size-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] xs:text-xs text-gray-700 text-center leading-tight px-1">
                {label}
              </span>
            </a>
          ) : (
            <Link
              key={href}
              href={href}
              className="w-24 h-24 flex flex-col items-center justify-center
                         bg-white border rounded-lg shadow-sm hover:shadow-md
                         transition-shadow group"
            >
              <Icon className="size-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] xs:text-xs text-gray-700 text-center leading-tight px-1">
                {label}
              </span>
            </Link>
          )
        ))}

        {/* 빈 칸 2개로 3×3 그리드 맞춤 */}
        <div className="w-24 h-24" />
        <div className="w-24 h-24" />
      </div>
    </main>
  );
} 