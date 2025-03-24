import React from 'react';
import Link from 'next/link';
import { cn } from "@/lib/utils";

interface ISidebarProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 대시보드용 사이드바 컴포넌트
 * 
 * 왼쪽에 고정된 사이드바를 제공합니다.
 * 
 * @example
 * ```tsx
 * <Sidebar>
 *   <div>사이드바 내용</div>
 * </Sidebar>
 * ```
 */
export function Sidebar({ children, className = "" }: ISidebarProps) {
  return (
    <aside className={`w-64 h-screen bg-dark-gray-1 border-r border-white/10 fixed left-0 top-0 flex flex-col p-4 z-40 ${className}`}>
      <div className="flex-1 flex flex-col gap-8">
        {children}
      </div>
    </aside>
  );
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-6">{children}</div>;
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto">{children}</div>;
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto pt-4 border-t border-white/10">{children}</div>;
} 