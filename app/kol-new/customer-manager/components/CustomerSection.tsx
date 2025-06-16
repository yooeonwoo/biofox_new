"use client";

import { ChangeEvent } from "react";
import { StageData } from "@/lib/types/customer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  stageKey: keyof StageData;
  value: any;
  onChange: (newValue: any) => void;
}

export default function CustomerSection({ title, stageKey, value, onChange }: Props) {
  const completed = Boolean(value);

  const handleToggle = () => {
    if (completed) {
      onChange(undefined);
    } else {
      onChange({ completed: true });
    }
  };

  const handleMemoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const memo = e.target.value;
    onChange({ ...(value || {}), memo });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border border-gray-200 rounded-md p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Button size="sm" variant={completed ? "default" : "outline"} onClick={handleToggle}>
          {completed ? "완료" : "미완료"}
        </Button>
      </div>

      {/* 간단 메모 입력 */}
      <Input
        placeholder="메모"
        value={value?.memo || ""}
        onChange={handleMemoChange}
        className="text-sm"
      />
    </div>
  );
} 