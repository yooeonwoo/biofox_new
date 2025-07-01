"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrainingTabsValue } from "../../lib/types";

type Props = {
  value: TrainingTabsValue;
  onToggle: (key: "application" | "completion") => void;
  hideIntegratedStar?: boolean;
};

export default function TrainingTabs({ value, onToggle, hideIntegratedStar }: Props) {
  const SEG = [
    { key: "application", label: "신청", active: value.application },
    { key: "completion", label: "완료", active: value.completion },
  ] as const;

  const allDone = value.application && value.completion;

  return (
    <div>
      {/* 세그먼트 탭 - 한 줄 고정 */}
      <div className="flex items-center gap-2 py-[3px] whitespace-nowrap">
        {/* 통합 별 – 조건부 렌더링 */}
        {!hideIntegratedStar && (
          <span
            className={cn(
              "text-[22px] flex-shrink-0 transition-opacity duration-200",
              allDone
                ? "text-yellow-400 opacity-100"
                : "text-gray-300 opacity-40"
            )}
            aria-label="전체 평가 완료 여부"
          >
            🌟
          </span>
        )}

        {SEG.map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center gap-[2px] px-1 py-[3px] border rounded-md text-[11px] leading-none",
              active ? "bg-yellow-50 border-yellow-400" : "bg-muted/20"
            )}
          >
            <Star
              className={cn(
                "size-4",
                active ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
              )}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 통합 별 상태를 외부에서 계산할 수 있도록 헬퍼 함수 export
export const getTrainingStarState = (value: TrainingTabsValue) => {
  return value.application && value.completion;
}; 