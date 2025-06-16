import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export interface GrowthStageValue {
  personalLevel?: number; // 0-10
  // simple representation
}

interface Props {
  value: GrowthStageValue | undefined;
  onChange: (val: GrowthStageValue | undefined) => void;
}

export default function GrowthStage({ value, onChange }: Props) {
  const current = value || { personalLevel: 0 };

  const setLevel = (lvl: number) => {
    onChange({ ...current, personalLevel: lvl });
  };

  return (
    <div className="stage-block border border-gray-200 rounded-md p-3 flex flex-col gap-3">
      <div className="text-xs mb-1">임상 (본인)</div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            className={`w-6 h-6 border border-black rounded text-xs flex items-center justify-center ${i < (current.personalLevel || 0) ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setLevel(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div>
        <Progress value={((current.personalLevel || 0) / 10) * 100} />
      </div>
    </div>
  );
}
