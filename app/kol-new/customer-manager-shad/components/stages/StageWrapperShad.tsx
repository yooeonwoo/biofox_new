import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  number: number;
  memo: string;
  onMemoChange: (m: string) => void;
  bgClass?: string;
  children: React.ReactNode;
}

/**
 * StageWrapperShad
 * 기존 StageWrapper 와 레이아웃/DOM 구조는 동일하게 유지하면서 shadcn-ui 의 Card 컴포넌트를 이용해 스타일만 변경했다.
 */
export default function StageWrapperShad({ title, number, memo, onMemoChange, children, bgClass }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card
      className={cn(
        "stage-block relative p-4 border-muted-foreground/20",
        bgClass ?? "bg-white"
      )}
    >
      {/* 헤더 (번호 + 제목) */}
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        <h4 className="text-sm font-semibold flex-1">{title}</h4>

        {/* 메모 토글 버튼 */}
        <button
          type="button"
          aria-label={open ? "메모 닫기" : "메모 열기"}
          className="size-6 rounded-full flex items-center justify-center bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
          onClick={() => setOpen((o) => !o)}
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* 메모 영역 */}
      <div
        className={cn(
          "rounded-md overflow-hidden transition-[max-height,padding] duration-300 text-xs",
          open
            ? "max-h-48 p-3 mb-3 border border-muted bg-muted/50"
            : "max-h-0 p-0 mb-0 border-0 bg-transparent"
        )}
      >
        <Textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-muted-foreground">{memo.length}자</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-destructive"
              onClick={() => onMemoChange("")}
            >
              지우기
            </button>
            <button
              type="button"
              className="text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
              onClick={() => setOpen(false)}
            >
              완료
            </button>
          </div>
        </div>
      </div>

      {children}
    </Card>
  );
} 