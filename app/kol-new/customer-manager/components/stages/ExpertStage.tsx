import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

export interface ExpertStageValue {
  topic?: "매출업" | "상담법" | "마케팅";
  memo?: string;
}

interface Props {
  value: ExpertStageValue | undefined;
  onChange: (val: ExpertStageValue | undefined) => void;
}

export default function ExpertStage({ value, onChange }: Props) {
  const current = value || {};
  const toggle = (t: ExpertStageValue["topic"]) => {
    onChange({ topic: current.topic === t ? undefined : t });
  };

  const [memoOpen, setMemoOpen] = useState(false);

  return (
    <div className="stage-block border border-gray-200 rounded-md p-3 flex flex-col gap-2 relative text-xs">
      <button
        aria-label={memoOpen ? "메모 닫기" : "메모 열기"}
        className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
        onClick={() => setMemoOpen((o) => !o)}
      >
        <Pencil size={14} />
      </button>

      <div
        className={`border border-gray-300 rounded-md bg-gray-50 overflow-hidden transition-[max-height,padding] duration-300 ${memoOpen ? "max-h-40 p-2 mt-7" : "max-h-0 p-0"}`}
      >
        <Textarea
          value={current.memo || ""}
          onChange={(e) => onChange({ ...current, memo: e.target.value })}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
      </div>

      <div className="flex gap-2">
        {["매출업", "상담법", "마케팅"].map((t) => (
          <Button
            key={t}
            variant={current.topic === t ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => toggle(t as any)}
          >
            {t}
          </Button>
        ))}
      </div>
    </div>
  );
} 