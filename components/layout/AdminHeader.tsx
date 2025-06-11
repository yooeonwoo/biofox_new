"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between bg-white border-b shadow-sm px-4 py-3 md:px-6">
      <Link href="/admin-new" className="font-bold text-lg text-black hover:text-gray-700">
        BIOFOX 관리자
      </Link>
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/signin" appearance={{ elements: { userButtonPopoverCard: "bg-white" } }} />
      </div>
    </header>
  );
} 