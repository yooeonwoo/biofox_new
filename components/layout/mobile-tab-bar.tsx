"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Store, 
  Users, 
  UserCircle 
} from "lucide-react";

interface ITabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: ITabItem[] = [
  {
    href: "/admin",
    label: "대시보드",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/admin/sales",
    label: "매출",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    href: "/admin/stores",
    label: "전문점",
    icon: <Store className="h-5 w-5" />,
  },
  {
    href: "/admin/kols",
    label: "KOL",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/admin/user-management",
    label: "회원",
    icon: <UserCircle className="h-5 w-5" />,
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden">
      <div className="grid h-full grid-cols-5">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-1",
              "text-xs font-medium",
              pathname === tab.href
                ? "text-primary"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {tab.icon}
            <span className="mt-1">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
} 