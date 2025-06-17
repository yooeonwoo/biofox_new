import React, { useState } from "react";
import { cn } from "@/lib/utils"; // simple class merge util, fallback if exists
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  number: number;
  memo: string;
  onMemoChange: (m: string) => void;
  bgClass?: string;
  children: React.ReactNode;
}

export default function StageWrapper({ title, number, memo, onMemoChange, children, bgClass }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("stage-block border border-gray-200 rounded-xl p-4 relative", bgClass ?? "bg-white")}>
      {/* 헤더 (번호 + 제목) */}
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        <h4 className="text-sm font-semibold flex-1">{title}</h4>

        {/* 메모 토글 버튼 */}
        <button
          type="button"
          aria-label={open ? "메모 닫기" : "메모 열기"}
          className="size-6 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
          onClick={() => setOpen((o) => !o)}
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* 메모 영역 */}
      <div
        className={`rounded-md overflow-hidden transition-[max-height,padding] duration-300 text-xs ${open ? "max-h-48 p-3 mb-3 border border-gray-300 bg-gray-50" : "max-h-0 p-0 mb-0 border-0 bg-transparent"}`}
      >
        <Textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-gray-500">{memo.length}자</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[11px] text-gray-500 hover:text-red-500"
              onClick={() => onMemoChange("")}
            >
              지우기
            </button>
            <button
              type="button"
              className="text-[11px] bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              onClick={() => setOpen(false)}
            >
              완료
            </button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
} 