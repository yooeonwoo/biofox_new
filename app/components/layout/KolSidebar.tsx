'use client';

import Link from 'next/link';
import { Home, Store, FileText, Bell, Settings } from "lucide-react";
import { Separator } from "../../../components/ui/separator";

export default function KolSidebar() {
  return (
    <aside className="hidden border-r bg-white shadow-sm md:block md:w-64">
      <div className="flex h-full flex-col p-4 md:p-6">
        <div className="mb-6">
          <p className="px-2 text-sm font-medium text-muted-foreground">메뉴</p>
          <nav className="mt-2 space-y-1">
            <Link href="/kol-new" className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <Home className="mr-3 h-5 w-5 text-primary" />
              <span>대시보드</span>
            </Link>
            <Link href="/kol-new/stores" className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <Store className="mr-3 h-5 w-5 text-muted-foreground" />
              <span>전문점 관리</span>
            </Link>
            <Link href="/kol-new/activities" className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
              <span>영업 일지</span>
            </Link>
          </nav>
        </div>
        <Separator className="my-4" />
        <div>
          <p className="px-2 text-sm font-medium text-muted-foreground">시스템</p>
          <nav className="mt-2 space-y-1">
            <Link href="#" className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <Bell className="mr-3 h-5 w-5 text-muted-foreground" />
              <span>알림</span>
            </Link>
            <Link href="#" className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <Settings className="mr-3 h-5 w-5 text-muted-foreground" />
              <span>설정</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
} 