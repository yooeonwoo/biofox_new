import { ReactNode } from "react";

export default function KolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">KOL 관리</h1>
      </div>
      {children}
    </div>
  );
} 