import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface EducationNotesStageValue {
  understanding?: "상" | "중" | "하";
  cleanliness?: "상" | "중" | "하";
  setting?: "상" | "중" | "하";
  personality?: string[];

  /* 교육 완료 후 특이사항 6문항 */
  q1Level?: "상" | "중" | "하";
  q1YN?: boolean;
  q2Level?: "상" | "중" | "하";
  q2YN?: boolean;
  q3Level?: "상" | "중" | "하";
  q3YN?: boolean;
  q4Level?: "상" | "중" | "하";
  q4YN?: boolean;
  q5Level?: "상" | "중" | "하";
  q6Level?: "상" | "중" | "하";
  memo?: string;
}

interface Props {
  value: EducationNotesStageValue | undefined;
  onChange: (val: EducationNotesStageValue | undefined) => void;
}

const LEVELS = ["상", "중", "하"] as const;

const QUESTION_CONFIG = [
  { idx: 1, text: "플레이스는 세팅하였는가?", hasYN: true },
  { idx: 2, text: "인스타는 세팅하였는가?", hasYN: true },
  { idx: 3, text: "정품 및 정량 프로토콜대로 시행하고 있는가?", hasYN: true },
  { idx: 4, text: "상품 진열이 잘 되어있는가?", hasYN: true },
  { idx: 5, text: "설명을 잘 이해하는가?", hasYN: false },
  { idx: 6, text: "샵은 깔끔한가?", hasYN: false },
] as const;

/**
 * EducationNotesStageShad – 기존 EducationNotesStage 그대로 복사 + shad 색상 토큰으로 배경 변경
 */
export default function EducationNotesStage({ value, onChange }: Props) {
  const current = value || {};

  const setField = (
    field: keyof EducationNotesStageValue,
    val: any
  ) => {
    // For personality field (array), set directly without deselecting logic
    if (field === "personality") {
      onChange({ ...current, [field]: val.length > 0 ? val : undefined });
      return;
    }
    
    // For other fields, keep original deselecting logic
    const deselecting = current[field] === val;
    onChange({ ...current, [field]: deselecting ? undefined : val });
  };

  return (
    <div className="stage-block flex flex-col gap-4 text-xs bg-card">
      {/* 교육 완료 후 특이사항 6문항 */}
      <div className="flex flex-col gap-3">
        {QUESTION_CONFIG.map(({ idx, text, hasYN }) => {
          /* key 생성 */
          const levelKey = `q${idx}Level` as keyof EducationNotesStageValue;
          const ynKey = `q${idx}YN` as keyof EducationNotesStageValue;

          const currentLevel = current[levelKey] as "상" | "중" | "하" | undefined;
          const currentYN = current[ynKey] as boolean | undefined;

          const setLevel = (lvl: "상" | "중" | "하") => setField(levelKey, lvl);

          return (
            <div key={idx} className="flex flex-col xs:flex-row xs:items-center gap-2">
              {/* 번호 + 질문 */}
              <span className="shrink-0 text-sm font-medium w-40">{idx}. {text}</span>

              {/* 상 · 중 · 하 버튼 */}
              <div className="flex gap-1">
                {["상", "중", "하"].map((lvl) => {
                  const active = currentLevel === lvl;
                  return (
                    <Button
                      key={lvl}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-7 w-9 text-xs",
                        active && "bg-blue-600 text-white border-blue-600"
                      )}
                      onClick={() => setLevel(lvl as "상" | "중" | "하")}
                    >
                      {lvl}
                    </Button>
                  );
                })}
              </div>

              {/* Y/N 배지 – 1~4번만 */}
              {hasYN && (
                <div className="flex items-center gap-1 text-xs">
                  <span>/</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      currentYN === true && "bg-green-600 text-white",
                      currentYN === false && "bg-gray-300 text-gray-700",
                      currentYN === undefined && "bg-gray-200 text-gray-500"
                    )}
                  >
                    {currentYN === true ? "Y" : currentYN === false ? "N" : "—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 성향 선택 */}
      <div className="p-3 border rounded-md bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["행동부족형", "학습부족형", "부정형", "긍정형"].map((label) => {
            const selectedArr = current.personality || [];
            const isActive = selectedArr.includes(label);
            const toggle = () =>
              setField(
                "personality",
                isActive
                  ? selectedArr.filter((v) => v !== label)           // ⬅ 제외
                  : [...selectedArr, label]                          // ⬅ 추가
              );
            return (
              <Button
                key={label}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-1 text-xs h-8",
                  isActive && "bg-blue-600 text-white border-blue-600"
                )}
                onClick={toggle}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 