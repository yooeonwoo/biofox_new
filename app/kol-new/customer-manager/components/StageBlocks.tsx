"use client";

import { StageData } from "@/lib/types/customer";
import InflowStage from "./stages/InflowStage";
import ContractStage from "./stages/ContractStage";
import DeliveryStage from "./stages/DeliveryStage";
import EducationNotesStage from "./stages/EducationNotesStage";
import GrowthStage from "./stages/GrowthStage";
import ExpertStage from "./stages/ExpertStage";
// TODO: import DeliveryStage, EducationNotesStage, GrowthStage, ExpertStage after creation

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

const COMPONENTS: Record<keyof StageData, any> = {
  inflow: InflowStage,
  contract: ContractStage,
  delivery: DeliveryStage,
  educationNotes: EducationNotesStage,
  growth: GrowthStage,
  expert: ExpertStage,
};

export default function StageBlocks({ stageData, onStageChange }: Props) {
  return (
    <div className="grid gap-4 stage-grid md:grid-cols-3 lg:grid-cols-6">
      {(Object.keys(TITLES) as (keyof StageData)[]).map((key) => {
        const Comp = COMPONENTS[key];
        return (
          <div
            key={key}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-bold mb-4">{TITLES[key]}</h2>
            {Comp && (
              <Comp
                value={(stageData as any)[key]}
                onChange={(val: any) => onStageChange(key, val)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
} 