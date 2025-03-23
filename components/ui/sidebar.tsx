import React from "react";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
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
export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  );
} 