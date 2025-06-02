'use client';

import Link from 'next/link';
import { Home, Store, FileText, Bell, ShoppingBag } from "lucide-react";
import { Separator } from "../../../components/ui/separator";
import { FoxLogo } from "../../../components/ui/fox-logo";

export default function KolSidebar() {
  return (
    <aside className="hidden border-r bg-white shadow-sm md:block md:w-52">
      <div className="flex h-full flex-col p-3 md:p-4">
        <div className="mb-5">
          <p className="px-2 text-xs font-medium text-muted-foreground">메뉴</p>
          <nav className="mt-2 space-y-1">
            <Link href="/kol-new" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <Home className="mr-2 h-4 w-4 text-primary" />
              <span>대시보드</span>
            </Link>
            <Link href="/kol-new/stores" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <Store className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>전문점 관리</span>
            </Link>
            <Link href="/kol-new/activities" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>영업 일지</span>
            </Link>
            <a href="https://biofoxpro.co.kr/" target="_blank" rel="noopener noreferrer" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>전문가몰</span>
            </a>
            <a href="https://ad.biofoxi.com/" target="_blank" rel="noopener noreferrer" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <FoxLogo className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>폭시</span>
            </a>
          </nav>
        </div>
        <Separator className="my-3" />
        <div>
          <p className="px-2 text-xs font-medium text-muted-foreground">시스템</p>
          <nav className="mt-2 space-y-1">
            <Link href="/kol-new/notifications" className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>알림</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
} 