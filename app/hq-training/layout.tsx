"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HQTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen text-gray-800">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r shadow-sm">
        <SidebarHeader />
        <NavLinks />
      </aside>

      {/* ── Main Column (Header + Content) ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ===== Header Bar ===== */}
        <header className="h-14 flex items-center gap-3 px-4 border-b bg-white lg:shadow-sm">
          {/* ☰ mobile trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden" aria-label="메뉴 열기">
                <Menu className="size-6 text-blue-600" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetTitle className="sr-only">본사 교육 메뉴</SheetTitle>
              <SidebarHeader />
              <NavLinks />
            </SheetContent>
          </Sheet>

          <span className="text-base font-semibold text-blue-600">
            본사 교육
          </span>
        </header>

        {/* ===== Page body ===== */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="h-14 flex items-center justify-center border-b border-gray-100">
      <span className="text-lg font-bold text-blue-600">본사 교육</span>
    </div>
  );
}

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