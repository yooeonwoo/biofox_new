import React, { useRef, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";

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

/**
 * DeliveryStageShad: 출고/설치/리타겟 단계 – 기존 UI 구조를 유지하면서 shadcn 스타일 적용.
 */
export default function DeliveryStageShad({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);

  const buttonRefs = {
    ship: useRef<HTMLButtonElement>(null),
    install: useRef<HTMLButtonElement>(null),
    retarget: useRef<HTMLButtonElement>(null),
  };

  useEffect(() => {
    if (context) {
      Object.entries(buttonRefs).forEach(([key, ref]) => {
        context.registerButton(`delivery-${key}`, ref);
      });
    }
    return () => {
      if (context) {
        Object.keys(buttonRefs).forEach(key => {
          context.unregisterButton(`delivery-${key}`);
        });
      }
    };
  }, [context]);

  const setType = (tp: DeliveryStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border rounded-md p-3 text-xs bg-card">
      <div className="grid grid-cols-3 gap-2">
        {/* 출고 */}
        <div className="flex flex-col gap-1">
          <Button
            ref={buttonRefs.ship}
            variant={current.type === "ship" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8 mb-2"
            onClick={() => setType(current.type === "ship" ? undefined : "ship")}
          >
            출고
          </Button>
          <Input
            type="date"
            placeholder="날짜"
            className="text-xs h-7 border-gray-200"
            value={current.shipDate || ""}
            onChange={(e) => onChange({ ...current, shipDate: e.target.value })}
          />
          <Input
            placeholder="패키지"
            className="text-xs h-7 border-gray-200"
            value={current.package || ""}
            onChange={(e) => onChange({ ...current, package: e.target.value })}
          />
        </div>

        {/* 설치/교육 */}
        <div className="flex flex-col gap-1">
          <Button
            ref={buttonRefs.install}
            variant={current.type === "install" ? "default" : "outline"}
            size="sm"
            className="text-xs h-16 mb-2"
            onClick={() => setType(current.type === "install" ? undefined : "install")}
          >
            설치/교육
          </Button>
          <Input
            type="date"
            placeholder="날짜"
            className="text-xs h-7 border-gray-200"
            value={current.installDate || ""}
            onChange={(e) => onChange({ ...current, installDate: e.target.value })}
          />
        </div>

        {/* 리타겟 */}
        <div className="flex flex-col gap-1">
          <Button
            ref={buttonRefs.retarget}
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