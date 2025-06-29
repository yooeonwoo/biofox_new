"use client";

import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function KolNewLayout({ children }: LayoutProps) {
  // 로컬 개발환경에서는 인증 체크를 건너뜀
  
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}