import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const setType = (tp: DeliveryStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border border-gray-200 rounded-md p-3 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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