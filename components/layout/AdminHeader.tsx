"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between bg-white border-b shadow-sm px-4 py-3 md:px-6">
      <nav className="flex items-center gap-6">
        <Link href="/admin-new" className="font-bold text-lg text-black hover:text-gray-700">
          BIOFOX 관리자
        </Link>
        <Link
          href="/admin-new/shops"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          전문점
        </Link>
        <Link
          href="/admin-new/manual-metrics"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          수기 실적 입력
        </Link>
      </nav>
      <div className="ml-auto">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}