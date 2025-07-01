"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "본사 교육" };

export default function HQTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* ───────── Desktop Sidebar ───────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200">
        <Header />
        <NavLinks />
      </aside>

      {/* ───────── Mobile Sheet (Shadcn) ───────── */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="lg:hidden p-3" aria-label="메뉴 열기">
            <Menu className="size-6 text-blue-600" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <Header />
          <NavLinks />
        </SheetContent>
      </Sheet>

      {/* ───────── Main Content ───────── */}
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  );
}

/* 공통 헤더(사이드바 상단) */
function Header() {
  return (
    <div className="h-16 flex items-center justify-center border-b border-gray-100">
      <span className="text-lg font-bold text-blue-600">본사 교육</span>
    </div>
  );
}

/* 네비게이션 링크 */
function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/hq-training", label: "대시보드" },
    { href: "/hq-training/head-office", label: "본사 실무교육" },
  ];

  return (
    <nav className="flex flex-col gap-1 pt-4 px-4">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-50",
              isActive
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:text-blue-600"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
} 