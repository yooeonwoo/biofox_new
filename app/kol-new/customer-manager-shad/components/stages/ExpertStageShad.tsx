import React from "react";
import { Button } from "@/components/ui/button";

export interface ExpertStageValue {
  topic?: "매출업" | "상담법" | "마케팅";
  memo?: string;
}

interface Props {
  value: ExpertStageValue | undefined;
  onChange: (val: ExpertStageValue | undefined) => void;
}

export default function ExpertStageShad({ value, onChange }: Props) {
  const current = value || {};
  const toggle = (t: ExpertStageValue["topic"]) => {
    onChange({ topic: current.topic === t ? undefined : t });
  };

  return (
    <div className="stage-block border rounded-md p-3 flex flex-col gap-2 text-xs bg-card">
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