import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

export interface DeliveryStageValue {
  type?: "ship" | "install" | "retarget";
  shipDate?: string;
  package?: string;
  installDate?: string;
  memo?: string;
}

interface Props {
  value: DeliveryStageValue | undefined;
  onChange: (val: DeliveryStageValue | undefined) => void;
}

export default function DeliveryStage({ value, onChange }: Props) {
  const current = value || {};

  const [memoOpen, setMemoOpen] = useState(false);

  const setType = (tp: DeliveryStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border border-gray-200 rounded-md p-3 relative text-xs">
      <button
        aria-label={memoOpen ? "메모 닫기" : "메모 열기"}
        className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
        onClick={() => setMemoOpen((o) => !o)}
      >
        <Pencil size={14} />
      </button>

      <div
        className={`border border-gray-300 rounded-md bg-gray-50 overflow-hidden transition-[max-height,padding] duration-300 ${memoOpen ? "max-h-40 p-2 mt-7" : "max-h-0 p-0"}`}
      >
        <Textarea
          value={current.memo || ""}
          onChange={(e) => onChange({ ...current, memo: e.target.value })}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* 출고 */}
        <div className="flex flex-col">
          <Button
            variant={current.type === "ship" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8 mb-2"
            onClick={() => setType(current.type === "ship" ? undefined : "ship")}
          >
            출고
          </Button>
          <Input
            placeholder="날짜"
            className="text-xs h-7"
            value={current.shipDate || ""}
            onChange={(e) => onChange({ ...current, shipDate: e.target.value })}
          />
          <Input
            placeholder="패키지"
            className="text-xs h-7 mt-1"
            value={current.package || ""}
            onChange={(e) => onChange({ ...current, package: e.target.value })}
          />
        </div>

        {/* 설치/교육 */}
        <div className="flex flex-col">
          <Button
            variant={current.type === "install" ? "default" : "outline"}
            size="sm"
            className="text-xs h-16 mb-2"
            onClick={() => setType(current.type === "install" ? undefined : "install")}
          >
            설치/교육
          </Button>
          <Input
            placeholder="날짜"
            className="text-xs h-7"
            value={current.installDate || ""}
            onChange={(e) => onChange({ ...current, installDate: e.target.value })}
          />
        </div>

        {/* 리타겟 */}
        <div className="flex flex-col">
          <Button
            variant={current.type === "retarget" ? "default" : "outline"}
            size="sm"
            className="text-xs h-28"
            onClick={() => setType(current.type === "retarget" ? undefined : "retarget")}
          >
            리타겟
          </Button>
        </div>
      </div>
    </div>
  );
} 