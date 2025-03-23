"use client";

import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: string;
}

export default function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 