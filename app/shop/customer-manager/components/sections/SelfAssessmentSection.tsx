"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SelfAssessmentValue } from "../../lib/types";

const QUESTIONS = [
  "플레이스는 세팅하였는가?",
  "인스타는 세팅하였는가?",
  "정품 및 정량 프로토콜대로 시행하고 있는가?",
  "상품 진열이 잘 되어있는가?",
] as const;

type Props = {
  value: SelfAssessmentValue;
  onChange: (key: keyof SelfAssessmentValue, val: boolean) => void;
};

export default function SelfAssessmentSection({ value, onChange }: Props) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
      <h4 className="text-md font-semibold text-gray-800 border-b pb-2">자가 평가</h4>

      <div className="space-y-3">
        {QUESTIONS.map((q, i) => {
          const key = `q${i + 1}YN` as keyof SelfAssessmentValue;
          const yn = value[key];

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
            >
              {/* 번호 + 질문 */}
              <span className="text-sm font-medium sm:w-48 sm:flex-1">
                {i + 1}. {q}
              </span>

              {/* Y / N 스위치 토글 */}
              <div className="flex items-center ml-auto sm:ml-0">
                <div
                  className={cn(
                    "flex text-xs font-medium border rounded-full overflow-hidden",
                    yn === undefined && "opacity-40"
                  )}
                  style={{ minWidth: 46 }} // 23px × 2
                >
                  {/* Y 구역 */}
                  <div
                    className={cn(
                      "w-1/2 h-6 flex items-center justify-center cursor-pointer transition-colors",
                      yn === true && "bg-blue-600 text-white"
                    )}
                    onClick={() => onChange(key, true)}
                  >
                    Y
                  </div>
                  {/* N 구역 */}
                  <div
                    className={cn(
                      "w-1/2 h-6 flex items-center justify-center border-l cursor-pointer transition-colors",
                      yn === false && "bg-blue-600 text-white"
                    )}
                    onClick={() => onChange(key, false)}
                  >
                    N
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 