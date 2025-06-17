import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

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

  const [memoOpen, setMemoOpen] = useState(false);

  const setField = (field: keyof EducationNotesStageValue, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <div className="stage-block flex flex-col gap-3 border border-gray-200 rounded-md p-3 text-xs relative">
      {/* 메모 토글 버튼 */}
      <button
        aria-label={memoOpen ? "메모 닫기" : "메모 열기"}
        className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
        onClick={() => setMemoOpen((o) => !o)}
      >
        <Pencil size={14} />
      </button>

      {/* 슬라이드 메모 영역 */}
      <div
        className={`rounded-md overflow-hidden transition-[max-height,padding] duration-300 text-xs ${memoOpen ? "max-h-40 p-2 mt-5 border border-gray-300 bg-gray-50" : "max-h-0 p-0 mt-0 border-0 bg-transparent"}`}
      >
        <Textarea
          value={current.memo || ""}
          onChange={(e) => setField("memo", e.target.value)}
          placeholder="특이사항 메모를 입력하세요..."
          className="h-24 text-xs"
        />
      </div>

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
        {[
          "ENFP",
          "ENTP",
          "ISTJ",
          "INFP",
        ].map((mbti) => (
          <Button
            key={mbti}
            variant="outline"
            size="sm"
            className={`flex-1 text-xs h-8 ${current.personality === mbti ? "bg-blue-500 text-white border-blue-500" : ""}`}
            onClick={() =>
              setField(
                "personality",
                current.personality === mbti ? undefined : mbti,
              )
            }
          >
            {mbti}
          </Button>
        ))}
      </div>
    </div>
  );
} 