import React, { useRef, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";

export interface InflowStageValue {
  source?: "cafe" | "insta" | "intro" | "seminar" | "visit";
  seminarDate?: string;
  seminarCount?: string;
  visitDate?: string;
  visitCount?: string;
  memo?: string;
}

interface Props {
  value: InflowStageValue | undefined;
  onChange: (val: InflowStageValue | undefined) => void;
}

// 버튼 key와 라벨 매핑
const BTN: Record<string, { label: string; value: InflowStageValue["source"] }> = {
  cafe: { label: "카페", value: "cafe" },
  insta: { label: "인스타", value: "insta" },
  intro: { label: "소개", value: "intro" },
  seminar: { label: "세미나", value: "seminar" },
  visit: { label: "방문", value: "visit" },
};

/**
 * InflowStageShad
 * 기존 InflowStage 와 로직/DOM 을 동일하게 유지하되 색상·테두리·여백을 shadcn 기준 디자인으로 조정하였다.
 */
export default function InflowStageShad({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);

  const buttonRefs = {
    cafe: useRef<HTMLButtonElement>(null),
    insta: useRef<HTMLButtonElement>(null),
    intro: useRef<HTMLButtonElement>(null),
    seminar: useRef<HTMLButtonElement>(null),
    visit: useRef<HTMLButtonElement>(null),
  };

  useEffect(() => {
    if (context) {
      Object.entries(buttonRefs).forEach(([key, ref]) => {
        context.registerButton(`inflow-${key}`, ref);
      });
    }
    return () => {
      if (context) {
        Object.keys(buttonRefs).forEach(key => {
          context.unregisterButton(`inflow-${key}`);
        });
      }
    };
  }, [context]);

  const setSource = (src: InflowStageValue["source"] | undefined) => {
    if (!src) {
      onChange(undefined);
    } else {
      onChange({ ...current, source: src });
    }
  };

  return (
    <div className="stage-block flex flex-col gap-2 border rounded-md p-3 text-xs bg-card">
      {/* 상단 토글 버튼들 */}
      <div className="flex gap-2 mb-2">
        {(["cafe", "insta", "intro"] as const).map((k) => (
          <Button
            key={k}
            ref={buttonRefs[k]}
            variant={current.source === BTN[k].value ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setSource(current.source === BTN[k].value ? undefined : BTN[k].value)}
          >
            {BTN[k].label}
          </Button>
        ))}
      </div>

      {/* 세미나 & 방문 2열 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 세미나 */}
        <div className="flex gap-2">
          <Button
            ref={buttonRefs.seminar}
            variant={current.source === "seminar" ? "default" : "outline"}
            size="sm"
            className="text-xs h-16 w-16"
            onClick={() => setSource(current.source === "seminar" ? undefined : "seminar")}
          >
            세미나
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs min-w-[30px]">날짜:</span>
              <Input
                type="date"
                className="text-xs h-7 w-full border-gray-200"
                value={current.seminarDate || ""}
                onChange={(e) => onChange({ ...current, seminarDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs min-w-[30px]">횟수:</span>
              <Input
                type="number"
                className="text-xs h-7 w-full border-gray-200"
                value={current.seminarCount || ""}
                onChange={(e) => onChange({ ...current, seminarCount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 방문 */}
        <div className="flex gap-2">
          <Button
            ref={buttonRefs.visit}
            variant={current.source === "visit" ? "default" : "outline"}
            size="sm"
            className="text-xs h-16 w-16"
            onClick={() => setSource(current.source === "visit" ? undefined : "visit")}
          >
            방문
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs min-w-[30px]">날짜:</span>
              <Input
                type="date"
                className="text-xs h-7 w-full border-gray-200"
                value={current.visitDate || ""}
                onChange={(e) => onChange({ ...current, visitDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs min-w-[30px]">횟수:</span>
              <Input
                type="number"
                className="text-xs h-7 w-full border-gray-200"
                value={current.visitCount || ""}
                onChange={(e) => onChange({ ...current, visitCount: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 