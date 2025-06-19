import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

/**
 * EducationNotesStageShad – 기존 EducationNotesStage 그대로 복사 + shad 색상 토큰으로 배경 변경
 */
export default function EducationNotesStage({ value, onChange }: Props) {
  const current = value || {};

  const setField = (
    field: keyof EducationNotesStageValue,
    val: string | undefined
  ) => {
    // If clicking the same value again, deselect it
    const deselecting = current[field] === val;
    onChange({ ...current, [field]: deselecting ? undefined : val });
  };

  return (
    <div className="stage-block flex flex-col gap-4 text-xs bg-card">
      {/* 질문 그룹 */}
      <div className="space-y-3">
        {(
          ["understanding", "cleanliness", "setting"] as const
        ).map((field) => (
          <div
            key={field}
            className="flex justify-between items-center gap-4"
          >
            <span className="text-left text-sm font-medium leading-snug">
              {field === "understanding"
                ? "1. 설명을 잘 이해하는가?"
                : field === "cleanliness"
                ? "2. 샵은 깔끔한가?"
                : "3. 플레이스 세팅은 되어있는가?"}
            </span>
            <div className="flex gap-1 shrink-0">
              {LEVELS.map((lvl) => (
                <Button
                  key={lvl}
                  variant={current[field] === lvl ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-7 w-9",
                    current[field] === lvl && "bg-blue-600 text-white border-blue-600"
                  )}
                  onClick={() => setField(field, lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MBTI 선택 */}
      <div className="p-3 border rounded-md bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["ENFP", "ENTP", "ISTJ", "INFP"].map((mbti) => (
            <Button
              key={mbti}
              variant={current.personality === mbti ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex-1 text-xs h-8",
                current.personality === mbti && "bg-blue-600 text-white border-blue-600"
              )}
              onClick={() => setField("personality", mbti)}
            >
              {mbti}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 