"use client";

import { useRef, useContext, useEffect } from "react";
import { DeliveryStageValue } from "@/lib/types/customer";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";

const DELIVERY_TYPES: Array<{
    key: "ship" | "install";
    label: string;
}> = [
    { key: "ship", label: "출고" },
    { key: "install", label: "설치/교육" },
];

interface Props {
  value: DeliveryStageValue | undefined;
  onChange: (val: DeliveryStageValue | undefined) => void;
}

/**
 * DeliveryStage: 출고/설치/리타겟 단계 – 기존 UI 구조를 유지하면서 shadcn 스타일 적용.
 */
export default function DeliveryStage({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);

  const refs = {
    ship: useRef<HTMLDivElement>(null),
    install: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (context) {
      Object.entries(refs).forEach(([key, ref]) => {
        context.registerButton(`delivery-${key}`, ref);
      });
    }
    return () => {
      if (context) {
        Object.keys(refs).forEach(key => {
          context.unregisterButton(`delivery-${key}`);
        });
      }
    };
  }, [context]);
  
  const setType = (type?: "ship" | "install") => {
    onChange({ ...current, type });
  };
  
  const setField = (field: keyof Omit<DeliveryStageValue, 'type'>, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <div className="stage-block flex flex-col gap-3 text-xs bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DELIVERY_TYPES.map(({ key, label }) => {
          const isActive = current.type === key;

          return (
            <div 
                key={key} 
                ref={refs[key as keyof typeof refs]}
                className="flex flex-col p-3 border rounded-lg cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400"
            >
              <label 
                htmlFor={`radio-delivery-${key}`} 
                className="w-full h-10 flex items-center justify-center text-sm font-semibold border rounded-md cursor-pointer transition-colors hover:bg-muted/80 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 mb-3"
              >
                  <input
                    type="radio"
                    id={`radio-delivery-${key}`}
                    name="delivery-type"
                    checked={isActive}
                    onChange={() => setType(isActive ? undefined : key)}
                    className="peer sr-only"
                  />
                  <span className="w-full text-center">{label}</span>
              </label>

              {key === 'ship' && (
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="relative w-full">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        type="date"
                        className="h-9 pl-8 text-sm"
                        value={current.shipDate || ""}
                        onChange={e => setField('shipDate', e.target.value)}
                    />
                  </div>
                  <div className="relative w-full">
                     <Input
                        placeholder="패키지"
                        className="h-9 text-sm"
                        value={current.shipPackage || ""}
                        onChange={e => setField('shipPackage', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {key === 'install' && (
                 <div className="relative w-full mt-auto">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        type="date"
                        className="h-9 pl-8 text-sm"
                        value={current.installDate || ""}
                        onChange={e => setField('installDate', e.target.value)}
                    />
                  </div>
              )}


            </div>
          );
        })}
      </div>
    </div>
  );
} 