"use client";

import { useEffect, useRef, useState, useContext } from "react";
import { ContractStageValue } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";
import { DollarSign, Calendar, Eraser, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "purchase" | "deposit" | "reject";

const BTN_CONFIG: Record<
  Section,
  { label: string; icon: React.ReactNode }
> = {
  purchase: { label: "구매", icon: <Check size={16} /> },
  deposit: { label: "계약금", icon: <DollarSign size={16} /> },
  reject: { label: "거절", icon: <X size={16} /> },
};

interface Props {
  value: ContractStageValue | undefined;
  onChange: (val: ContractStageValue | undefined) => void;
}

export default function ContractStageShad({ value, onChange }: Props) {
  const current = value || {};
  const [activeSection, setActiveSection] = useState<Section | null>(
    current.type || null
  );
  
  const purchaseDateRef = useRef<HTMLInputElement>(null);
  const depositDateRef = useRef<HTMLInputElement>(null);
  const rejectDateRef = useRef<HTMLInputElement>(null);

  const refs: Record<Section, React.RefObject<HTMLInputElement | null>> = {
    purchase: purchaseDateRef,
    deposit: depositDateRef,
    reject: rejectDateRef,
  };

  // Auto-focus logic
  useEffect(() => {
    if(activeSection && refs[activeSection]?.current) {
        refs[activeSection].current?.focus()
    }
  }, [activeSection])


  const setField = (field: keyof ContractStageValue, val: any) => {
    onChange({ ...current, [field]: val });
  };
  
  const handleSectionClick = (section: Section) => {
    // If clicking the active section, deactivate it
    if(section === activeSection) {
        setActiveSection(null);
        onChange({ ...current, type: undefined })
    } else {
        setActiveSection(section);
        onChange({ ...current, type: section })
    }
  }

  const renderSection = (section: Section) => {
    const isActive = activeSection === section;
    const data = {
        date: (current as any)[`${section}Date`],
        amount: (current as any)[`${section}Amount`],
        reason: (current as any)[`${section}Reason`],
        ad: (current as any)[`${section}Ad`],
    }

    return (
      <div key={section} className="flex items-center gap-2">
        {/* Main Button */}
        <Button
          variant={isActive ? "default" : "outline"}
          onClick={() => handleSectionClick(section)}
          className={cn(
            "transition-all duration-300 ease-in-out md:w-20 md:h-20",
            isActive ? "w-12 h-20" : "flex-grow h-12"
          )}
        >
          {isActive ? BTN_CONFIG[section].icon : BTN_CONFIG[section].label}
        </Button>
        
        {/* Input Fields Container */}
        <div
          className={cn(
            "flex-col gap-2 transition-all duration-300 ease-in-out md:flex md:flex-row md:w-full md:opacity-100 md:scale-100",
            isActive ? "flex w-full opacity-100 scale-100" : "w-0 opacity-0 scale-0 hidden"
          )}
        >
          <div className="relative w-full">
             <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
             <Input
               ref={refs[section]}
               type="date"
               className="h-9 pl-8 text-xs"
               value={data.date || ""}
               onChange={e => setField(`${section}Date`, e.target.value)}
             />
          </div>

          {section !== 'reject' ? (
            <div className="relative w-full">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="금액(만원)"
                className="h-9 pl-8 text-xs"
                value={data.amount || ""}
                onChange={e => setField(`${section}Amount`, e.target.value)}
              />
            </div>
          ) : (
            <div className="relative w-full">
              <Eraser className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="거절사유"
                className="h-9 pl-8 text-xs"
                value={data.reason || ""}
                onChange={e => setField(`${section}Reason`, e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <Checkbox 
                    id={`ad-add-${section}`}
                    checked={data.ad}
                    onCheckedChange={c => setField(`${section}Ad`, !!c)}
                  />
                  <label htmlFor={`ad-add-${section}`} className="text-xs font-normal whitespace-nowrap">광고</label>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="stage-block flex flex-col gap-2 rounded-md p-3 text-xs bg-card">
       { (["purchase", "deposit", "reject"] as Section[]).map(renderSection) }
    </div>
  );
} 