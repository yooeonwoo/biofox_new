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

/**
 * EducationNotesStageShad – 기존 EducationNotesStage 그대로 복사 + shad 색상 토큰으로 배경 변경
 */
export default function EducationNotesStageShad({ value, onChange }: Props) {
  const current = value || {};
  const [memoOpen, setMemoOpen] = useState(false);

  const setField = (field: keyof EducationNotesStageValue, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <div className="stage-block flex flex-col gap-3 border rounded-md p-3 text-xs bg-card relative">
      {/* 메모 토글 버튼 */}
      <button
        aria-label={memoOpen ? "메모 닫기" : "메모 열기"}
        className="absolute top-2 right-2 text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setMemoOpen((o) => !o)}
      >
        <Pencil size={14} />
      </button>

      {/* 슬라이드 메모 영역 */}
      <div
        className={`rounded-md overflow-hidden transition-[max-height,padding] duration-300 text-xs ${memoOpen ? "max-h-40 p-2 mt-5 border border-muted bg-muted/50" : "max-h-0 p-0 mt-0 border-0 bg-transparent"}`}
      >
        <Textarea
          value={current.memo || ""}
          onChange={(e) => setField("memo", e.target.value)}
          placeholder="특이사항 메모를 입력하세요..."
          className="h-24 text-xs"
        />
      </div>

      {/* 질문 그룹 */}
      <div className="p-3 border rounded-md bg-muted/20 space-y-3">
        {(["understanding", "cleanliness", "setting"] as const).map((field) => (
          <div key={field} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-1">
            <span className="text-left text-sm sm:text-xs">
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
                  variant={current[field] === lvl ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-6 w-8"
                  onClick={() => setField(field, lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MBTI 선택 그룹 */}
      <div className="p-3 border rounded-md bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["ENFP", "ENTP", "ISTJ", "INFP"].map((mbti) => (
            <Button
              key={mbti}
              variant="outline"
              size="sm"
              className={`flex-1 text-xs h-8 ${current.personality === mbti ? "bg-primary text-primary-foreground border-primary" : ""}`}
              onClick={() => setField("personality", current.personality === mbti ? undefined : mbti)}
            >
              {mbti}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 