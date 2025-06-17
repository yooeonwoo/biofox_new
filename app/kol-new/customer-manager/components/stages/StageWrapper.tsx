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
    <div className={cn("stage-block border border-gray-200 rounded-xl p-4", accentColor)}>
      {/* 헤더 (번호 + 아이콘 + 제목) */}
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>

      {children}
    </div>
  );
} 