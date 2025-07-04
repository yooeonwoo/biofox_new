"use client";

import { useRef, useContext, useEffect } from "react";
import { InflowStageValue } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";
import { cn } from "@/lib/utils";

const INTRO_SOURCES: Array<{ key: "cafe" | "insta" | "intro"; label: string; }> = [
  { key: "cafe", label: "카페" },
  { key: "insta", label: "인스타" },
  { key: "intro", label: "소개" },
];

const BLOCK_SOURCES: Array<{ key: "seminar" | "visit"; label: string; }> = [
  { key: "seminar", label: "세미나" },
  { key: "visit", label: "방문" },
];

interface Props {
  value: InflowStageValue | undefined;
  onChange: (val: InflowStageValue | undefined) => void;
}

export default function InflowStage({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);
  
  const buttonRefs = {
    cafe: useRef<HTMLButtonElement>(null),
    insta: useRef<HTMLButtonElement>(null),
    intro: useRef<HTMLButtonElement>(null),
  };
  const blockRefs = {
    seminar: useRef<HTMLDivElement>(null),
    visit: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!context) return;
    const allRefs = {...buttonRefs, ...blockRefs};
    Object.entries(allRefs).forEach(([key, ref]) => {
      context.registerButton(`inflow-${key}`, ref);
    });
    return () => {
      if (!context) return;
      Object.keys(allRefs).forEach(key => {
        context.unregisterButton(`inflow-${key}`);
      });
    };
  }, [context]);

  const setSource = (source?: InflowStageValue["source"]) => {
    const newSource = current.source === source ? undefined : source;
    onChange({ ...current, source: newSource });
  };
  
  const setField = (field: keyof Omit<InflowStageValue, 'source'>, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <fieldset className="stage-block flex flex-col gap-4 text-xs bg-card">
      <legend className="sr-only">유입 경로 선택</legend>
      <div className="flex flex-wrap gap-2">
        {INTRO_SOURCES.map(({ key, label }) => {
          const isActive = current.source === key;
          return (
            <Button 
              key={key}
              ref={buttonRefs[key]}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn("flex-1", isActive && "bg-blue-600 text-white border-blue-600")}
              onClick={() => setSource(key)}
            >
              {label}
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BLOCK_SOURCES.map(({ key, label }) => {
            const isActive = current.source === key;
            const dateValue = (current as any)[`${key}Date`];
            const countValue = (current as any)[`${key}Count`];

            return (
              <div 
                key={key} 
                ref={blockRefs[key]}
                onClick={() => setSource(key)}
                className={cn(
                  "flex flex-col p-3 border rounded-lg cursor-pointer transition-colors gap-3",
                  isActive ? "bg-blue-50 border-blue-400" : "bg-card hover:bg-muted/50"
                )}
              >
                <div className={cn("font-semibold text-sm", isActive && "text-blue-800")}>{label}</div>
                <div className="flex flex-col gap-2">
                    <div className="w-full">
                        <DatePicker
                            value={dateValue || ""}
                            onChange={value => setField(`${key}Date` as any, value)}
                            placeholder={`${label} 날짜 선택`}
                            className="h-9 text-sm bg-white"
                        />
                    </div>
                    <div className="relative w-full">
                          <Input
                            type="number"
                            placeholder="횟수"
                            className="h-9 text-sm pl-3 bg-white"
                            value={countValue || ""}
                            onChange={e => setField(`${key}Count` as any, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
              </div>
            )
        })}
      </div>
    </fieldset>
  );
} 