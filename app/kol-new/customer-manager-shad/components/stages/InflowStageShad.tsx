"use client";

import { useRef, useContext, useEffect } from "react";
import { InflowStageValue } from "@/lib/types/customer";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";
import { cn } from "@/lib/utils";

const ALL_SOURCES: Array<{
  key: "cafe" | "insta" | "intro" | "seminar" | "visit";
  label: string;
  hasInputs: boolean;
}> = [
  { key: "cafe", label: "카페", hasInputs: false },
  { key: "insta", label: "인스타", hasInputs: false },
  { key: "intro", label: "소개", hasInputs: false },
  { key: "seminar", label: "세미나", hasInputs: true },
  { key: "visit", label: "방문", hasInputs: true },
];

interface Props {
  value: InflowStageValue | undefined;
  onChange: (val: InflowStageValue | undefined) => void;
}

export default function InflowStageShad({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);
  
  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    cafe: useRef<HTMLDivElement>(null),
    insta: useRef<HTMLDivElement>(null),
    intro: useRef<HTMLDivElement>(null),
    seminar: useRef<HTMLDivElement>(null),
    visit: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!context) return;
    Object.entries(refs).forEach(([key, ref]) => {
      context.registerButton(`inflow-${key}`, ref);
    });
    return () => {
      if (!context) return;
      Object.keys(refs).forEach(key => {
        context.unregisterButton(`inflow-${key}`);
      });
    };
  }, [context]);

  const setSource = (source?: InflowStageValue["source"]) => {
    onChange({ ...current, source });
  };
  
  const setField = (field: keyof Omit<InflowStageValue, 'source'>, val: any) => {
    onChange({ ...current, [field]: val });
  };

  return (
    <div className="stage-block flex flex-col gap-3 text-xs bg-card">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {ALL_SOURCES.map(({ key, label, hasInputs }) => {
          const isActive = current.source === key;
          const dateValue = (current as any)[`${key}Date`];
          const countValue = (current as any)[`${key}Count`];

          return (
            <div 
              key={key} 
              ref={refs[key]}
              className={cn(
                "flex flex-col p-2 border rounded-lg cursor-pointer transition-colors",
                isActive ? "bg-blue-50 border-blue-400" : "bg-card hover:bg-muted/50"
              )}
            >
              <label 
                htmlFor={`radio-inflow-${key}`} 
                className={cn(
                  "w-full flex items-center justify-center text-sm font-semibold rounded-md cursor-pointer h-10",
                  isActive && "text-blue-800"
                )}
              >
                <input
                    type="radio"
                    id={`radio-inflow-${key}`}
                    name="inflow-source"
                    checked={isActive}
                    onChange={() => setSource(isActive ? undefined : key)}
                    className="sr-only"
                />
                {label}
              </label>
              {hasInputs && (
                 <div className="flex flex-col gap-2 pt-2 border-t mt-2">
                    <div className="relative w-full">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="h-9 pl-8 text-sm bg-white"
                            value={(current as any)[`${key}Date`] || ""}
                            onChange={e => setField(`${key}Date` as keyof Omit<InflowStageValue, 'source'>, e.target.value)}
                        />
                    </div>
                    <div className="relative w-full">
                          <Input
                            type="number"
                            placeholder="횟수"
                            className="h-9 text-sm pl-3 bg-white"
                            value={(current as any)[`${key}Count`] || ""}
                            onChange={e => setField(`${key}Count` as keyof Omit<InflowStageValue, 'source'>, e.target.value)}
                        />
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 