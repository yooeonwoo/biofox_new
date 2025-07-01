"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function HQTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ─── Sidebar (desktop) ─── */}
      <aside className="hidden sm:flex flex-col w-64 bg-blue-600 text-white">
        <div className="p-4 border-b border-blue-500">
          <h1 className="text-lg font-bold">본사 교육</h1>
        </div>
        <div className="flex-1 p-4">
          <NavLinks />
        </div>
      </aside>

      {/* ─── Mobile Menu Button ─── */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 text-blue-600 hover:bg-blue-50"
          aria-label="메뉴 열기"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* ─── Mobile Drawer ─── */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-blue-600 text-white z-50 sm:hidden">
            <div className="p-4 border-b border-blue-500 flex items-center justify-between">
              <h1 className="text-lg font-bold">본사 교육</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:bg-blue-500 p-1 rounded"
                aria-label="메뉴 닫기"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <NavLinks onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

// NavLinks 컴포넌트
function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const links = [
    { href: "/hq-training", label: "대시보드" },
    { href: "/hq-training/head-office", label: "본사 실무교육" },
  ];

  return (
    <nav className="flex flex-col gap-2 text-sm">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            className={`px-3 py-2 rounded transition-colors hover:bg-blue-500 ${
              isActive ? "bg-blue-500 font-semibold" : ""
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
} 