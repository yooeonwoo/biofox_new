import React from "react";
import { Button } from "@/components/ui/button";

export interface EducationNotesStageValue {
  understanding?: "상" | "중" | "하";
  cleanliness?: "상" | "중" | "하";
  setting?: "상" | "중" | "하";
  personality?: string;
  memo?: string;
}

interface Props {
  value: EducationNotesStageValue | undefined;
  onChange: (val: EducationNotesStageValue | undefined) => void;
}

const LEVELS = ["상", "중", "하"] as const;

export default function EducationNotesStage({ value, onChange }: Props) {
  const current = value || {};

  const setField = (field: keyof EducationNotesStageValue, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <div className="stage-block flex flex-col gap-3 border border-gray-200 rounded-md p-3 text-xs">
      {["understanding", "cleanliness", "setting"].map((field) => (
        <div key={field} className="flex justify-between items-center gap-1">
          <span className="text-left">
            {field === "understanding"
              ? "1. 설명을 잘 이해하는가?"
              : field === "cleanliness"
              ? "2. 샵은 깔끔한가?"
              : "3. 플레이스 세팅은 되어있는가?"}
          </span>
          <div className="flex gap-1">
            {LEVELS.map((lvl) => (
              <Button
                key={lvl}
                variant={current[field as keyof EducationNotesStageValue] === lvl ? "default" : "outline"}
                size="sm"
                className="text-xs h-6 w-8"
                onClick={() => setField(field as any, lvl)}
              >
                {lvl}
              </Button>
            ))}
          </div>
        </div>
      ))}

      {/* MBTI 선택 */}
      <div className="flex gap-2 mt-1">
        {["ENFP", "ENTP", "ISTJ", "INFP"].map((mbti) => (
          <Button
            key={mbti}
            variant={current.personality === mbti ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setField("personality", current.personality === mbti ? undefined : mbti)}
          >
            {mbti}
          </Button>
        ))}
      </div>
    </div>
  );
} 