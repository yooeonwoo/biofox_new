"use client";

import { StageData } from "@/lib/types/customer";
import InflowStage from "./stages/InflowStage";
import ContractStage from "./stages/ContractStage";
import DeliveryStage from "./stages/DeliveryStage";
import EducationNotesStage from "./stages/EducationNotesStage";
import GrowthStage from "./stages/GrowthStage";
import ExpertStage from "./stages/ExpertStage";
import StageWrapper from "./stages/StageWrapper";

interface Props {
  stageData: StageData;
  onStageChange: (stageKey: keyof StageData, value: any) => void;
}

const TITLES: Record<keyof StageData, string> = {
  inflow: "유입",
  contract: "계약/결제",
  delivery: "설치/교육",
  educationNotes: "교육 완료 후 특이사항",
  growth: "성장",
  expert: "전문가과정",
};

const COMPONENTS: Record<keyof StageData, any> = {
  inflow: InflowStage,
  contract: ContractStage,
  delivery: DeliveryStage,
  educationNotes: EducationNotesStage,
  growth: GrowthStage,
  expert: ExpertStage,
};

const COLOR: Record<keyof StageData, string> = {
  inflow: "bg-blue-50",
  contract: "bg-emerald-50",
  delivery: "bg-orange-50",
  educationNotes: "bg-purple-50",
  growth: "bg-pink-50",
  expert: "bg-cyan-50",
};

export default function StageBlocks({ stageData, onStageChange }: Props) {
  return (
    <div className="grid gap-4 stage-grid md:grid-cols-3 lg:grid-cols-6">
      {(Object.keys(TITLES) as (keyof StageData)[]).map((key, idx) => {
        const Comp = COMPONENTS[key];
        return (
          <StageWrapper
            key={key}
            title={TITLES[key]}
            number={idx + 1}
            accentColor={COLOR[key]}
            memo={(stageData as any)[key]?.memo || ""}
            onMemoChange={(m: string) =>
              onStageChange(key, { ...(stageData as any)[key], memo: m })
            }
          >
            {Comp && (
              <Comp
                value={(stageData as any)[key]}
                onChange={(val: any) => onStageChange(key, val)}
              />
            )}
          </StageWrapper>
        );
      })}
    </div>
  );
} 