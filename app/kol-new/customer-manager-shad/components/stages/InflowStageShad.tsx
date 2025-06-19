"use client";

import { useRef, useContext, useEffect } from "react";
import { InflowStageValue, IntroSource } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";

const SOURCE_TYPES: Array<{
  key: "seminar" | "visit";
  label: string;
}> = [
  { key: "seminar", label: "세미나" },
  { key: "visit", label: "방문" },
];

const INTRO_TYPES: Array<{ key: "cafe" | "insta" | "intro", label: string}> = [
    { key: 'cafe', label: '카페'},
    { key: 'insta', label: '인스타'},
    { key: 'intro', label: '소개'},
]

interface Props {
  value: InflowStageValue | undefined;
  onChange: (val: InflowStageValue | undefined) => void;
}

export default function InflowStageShad({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);

  const refs = {
    seminar: useRef<HTMLDivElement>(null),
    visit: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (context) {
      Object.entries(refs).forEach(([key, ref]) => {
        context.registerButton(`inflow-${key}`, ref);
      });
    }
    return () => {
      if (context) {
        Object.keys(refs).forEach(key => {
          context.unregisterButton(`inflow-${key}`);
        });
      }
    };
  }, [context]);

  const setSource = (source?: "seminar" | "visit") => {
    onChange({ ...current, source });
  };
  
  const setField = (field: keyof Omit<InflowStageValue, 'source' | 'introSource'>, val: any) => {
    onChange({ ...current, [field]: val });
  }
  
  const toggleIntroSource = (introKey: IntroSource) => {
      const currentIntro = current.introSource || [];
      const newIntro = currentIntro.includes(introKey)
        ? currentIntro.filter((i: IntroSource) => i !== introKey)
        : [...currentIntro, introKey];
      onChange({ ...current, introSource: newIntro });
  }

  return (
    <div className="stage-block flex flex-col gap-4 text-xs bg-card">
        {/* 다중 선택 버튼 */}
        <div className="flex flex-wrap gap-2">
            {INTRO_TYPES.map(type => (
                <Button 
                    key={type.key}
                    variant={current.introSource?.includes(type.key) ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleIntroSource(type.key)}
                >
                    {type.label}
                </Button>
            ))}
        </div>

        {/* 단일 선택 블록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SOURCE_TYPES.map(({ key, label }) => {
            const dateValue = (current as any)[`${key}Date`];
            const countValue = (current as any)[`${key}Count`];
            const isActive = current.source === key;

            return (
                <div key={key} ref={refs[key as keyof typeof refs]} className="flex flex-col p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 gap-3">
                     <label 
                        htmlFor={`radio-inflow-${key}`} 
                        className="w-full flex items-center justify-center text-sm font-semibold border rounded-md cursor-pointer transition-colors hover:bg-muted/80 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600"
                    >
                        <input
                            type="radio"
                            id={`radio-inflow-${key}`}
                            name="inflow-source"
                            checked={isActive}
                            onChange={() => setSource(isActive ? undefined : key)}
                            className="peer sr-only"
                        />
                        <span className="w-full text-center py-2">{label}</span>
                    </label>
                    <div className="flex flex-col gap-2">
                        <div className="relative w-full">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="date"
                                className="h-9 pl-8 text-sm"
                                value={dateValue || ""}
                                onChange={e => setField(`${key}Date`, e.target.value)}
                            />
                        </div>
                        <div className="relative w-full">
                             <Input
                                type="number"
                                placeholder="횟수"
                                className="h-9 text-sm"
                                value={countValue || ""}
                                onChange={e => setField(`${key}Count`, e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )
        })}
        </div>
    </div>
  );
} 