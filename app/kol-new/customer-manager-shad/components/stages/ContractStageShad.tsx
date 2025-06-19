"use client";

import { useRef, useMemo } from "react";
import { ContractStageValue } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Calendar, Eraser } from "lucide-react";

const SECTIONS_CONFIG: Array<{
  key: "purchase" | "deposit" | "reject";
  label: string;
}> = [
  { key: "purchase", label: "구매" },
  { key: "deposit", label: "계약금" },
  { key: "reject", label: "거절" },
];

interface Props {
  value: ContractStageValue | undefined;
  onChange: (val: ContractStageValue | undefined) => void;
}

export default function ContractStageShad({ value, onChange }: Props) {
  const current = value || {};
  const setField = (field: keyof ContractStageValue, val: any) => {
    onChange({ ...current, [field]: val });
  };

  const renderSection = (section: { key: "purchase" | "deposit" | "reject"; label: string }) => {
    const { key, label } = section;
    const dateValue = (current as any)[`${key}Date`];
    const amountValue = (current as any)[`${key}Amount`];
    const reasonValue = (current as any)[`${key}Reason`];
    const adValue = (current as any)[`${key}Ad`];
    
    const isActive = current.type === key;

    const setType = () => {
        onChange({ ...current, type: isActive ? undefined : key });
    }

    return (
      <div key={key} className="flex flex-col md:flex-row items-stretch gap-3 p-3 rounded-lg border bg-card has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
        <div className="w-full md:w-24 shrink-0">
            <input 
                type="radio" 
                name="contract-type" 
                id={`radio-${key}`} 
                checked={isActive} 
                onChange={setType}
                className="sr-only"
            />
            <label 
                htmlFor={`radio-${key}`}
                className="w-full h-full flex items-center justify-center text-sm font-semibold border rounded-md cursor-pointer transition-colors hover:bg-muted/80 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary"
            >
                {label}
            </label>
        </div>

        <div className="w-full flex flex-col gap-2 md:flex-row">
          <div className="relative w-full">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="date"
              className="h-10 pl-8 text-sm"
              value={dateValue || ""}
              onChange={(e) => setField(`${key}Date`, e.target.value)}
            />
          </div>

          {key !== "reject" ? (
            <div className="relative w-full">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="금액(만원)"
                className="h-10 pl-8 text-sm"
                value={amountValue || ""}
                onChange={(e) => setField(`${key}Amount`, e.target.value)}
              />
            </div>
          ) : (
            <div className="relative w-full">
              <Eraser className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="거절사유"
                className="h-10 pl-8 text-sm"
                value={reasonValue || ""}
                onChange={(e) => setField(`${key}Reason`, e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Checkbox
                  id={`ad-add-${key}`}
                  checked={adValue}
                  onCheckedChange={(c) => setField(`${key}Ad`, !!c)}
                />
                <label htmlFor={`ad-add-${key}`} className="text-xs font-normal whitespace-nowrap">광고</label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="stage-block flex flex-col gap-3 text-xs bg-card">
      {SECTIONS_CONFIG.map(renderSection)}
    </div>
  );
} 