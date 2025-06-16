import React from "react";
import { cn } from "@/lib/utils"; // simple class merge util, fallback if exists

interface Props {
  title: string;
  number: number;
  accentColor: string; // e.g. bg-blue-50
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function StageWrapper({ title, number, accentColor, icon, children }: Props) {
  return (
    <div className={cn("stage-block relative border border-gray-200 rounded-xl p-4", accentColor)}>
      {/* 번호 뱃지 */}
      <div className="absolute -top-3 -left-3 size-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow">
        {number}
      </div>

      {/* 헤더 */}
      <h4 className="flex items-center gap-1 text-sm font-semibold mb-3">
        {icon}
        <span>{title}</span>
      </h4>

      {children}
    </div>
  );
} 