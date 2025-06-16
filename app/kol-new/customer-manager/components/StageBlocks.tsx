"use client";

import { StageData } from "@/lib/types/customer";
import InflowStage from "./stages/InflowStage";
import ContractStage from "./stages/ContractStage";
import DeliveryStage from "./stages/DeliveryStage";
import EducationNotesStage from "./stages/EducationNotesStage";
import GrowthStage from "./stages/GrowthStage";
import ExpertStage from "./stages/ExpertStage";
import StageWrapper from "./stages/StageWrapper";
import { Mailbox, FileSignature, Package, StickyNote, BarChart3, GraduationCap } from "lucide-react";
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

const COLOR: Record<keyof StageData, string> = {
  inflow: "bg-blue-50",
  contract: "bg-emerald-50",
  delivery: "bg-orange-50",
  educationNotes: "bg-purple-50",
  growth: "bg-pink-50",
  expert: "bg-cyan-50",
};

const ICON: Record<keyof StageData, React.ReactNode> = {
  inflow: <Mailbox size={14} className="text-blue-600" />,
  contract: <FileSignature size={14} className="text-emerald-600" />,
  delivery: <Package size={14} className="text-orange-600" />,
  educationNotes: <StickyNote size={14} className="text-purple-600" />,
  growth: <BarChart3 size={14} className="text-pink-600" />,
  expert: <GraduationCap size={14} className="text-cyan-600" />,
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
            icon={ICON[key]}
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