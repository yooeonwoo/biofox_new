"use client";

import CustomerSection from "./CustomerSection";
import { StageData } from "@/lib/types/customer";

interface Props {
  stageData: StageData;
  onStageChange: (stageKey: keyof StageData, value: any) => void;
}

const TITLES: Record<keyof StageData, string> = {
  inflow: "유입",
  contract: "계약",
  delivery: "설치/교육",
  educationNotes: "특이사항",
  growth: "성장",
  expert: "전문가",
};

export default function StageBlocks({ stageData, onStageChange }: Props) {
  return (
    <div className="grid gap-4 stage-grid md:grid-cols-3 lg:grid-cols-6">
      {(Object.keys(TITLES) as (keyof StageData)[]).map((key) => (
        <CustomerSection
          key={key}
          title={TITLES[key]}
          stageKey={key}
          value={(stageData as any)[key]}
          onChange={(val) => onStageChange(key, val)}
        />
      ))}
    </div>
  );
} 