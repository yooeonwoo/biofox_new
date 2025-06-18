"use client";

import { StageData } from "@/lib/types/customer";
import { StageWrapperShad, InflowStageShad, ContractStageShad, DeliveryStageShad, EducationNotesStageShad, GrowthStageShad, ExpertStageShad } from "./stages";
// 아직 교체되지 않은 스테이지는 기존 컴포넌트 사용
import React from "react";
import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Achievements 타입 및 단일 체크박스 컴포넌트 추가
import { Achievements } from "@/lib/types/customer";

const LABELS: Record<1 | 2 | 3, string> = {
  1: "본사 실무교육 이수",
  2: "본사 표준 프로토콜을 잘 따르는가?",
  3: "본사 전문가 과정을 모두 이수하였는가?",
};

const CONTAINER_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-white border-gray-200",
  2: "bg-white border-green-200",
  3: "bg-white border-violet-200",
};

function SingleAchieveCheckbox({
  level,
  achievements,
  onChange,
}: {
  level: 1 | 2 | 3;
  achievements: Achievements;
  onChange: (a: Achievements) => void;
}) {
  const keys: (keyof Achievements)[] = [
    "basicTraining",
    "standardProtocol",
    "expertCourse",
  ];
  const key = keys[level - 1];
  const checked = achievements[key];

  const toggle = (isChecked: boolean | "indeterminate") => {
    if (typeof isChecked !== "boolean") return;
    const newVal = { ...achievements };
    if (isChecked) {
      // 체크 → 하위레벨까지 모두 true
      for (let i = 0; i < level; i++) newVal[keys[i]] = true;
    } else {
      // 해제 → 상위레벨부터 모두 false
      for (let i = level - 1; i < 3; i++) newVal[keys[i]] = false;
    }
    onChange(newVal);
  };

  const id = `achieve-level-${level}-${key}`;

  return (
    <div className={cn("p-3 rounded-lg border", CONTAINER_STYLES[level])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={checked} onCheckedChange={toggle} />
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {LABELS[level]}
          </label>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: level }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className="fill-yellow-500 text-yellow-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  stageData: StageData;
  onStageChange: (stageKey: keyof StageData, value: any) => void;
  achievements: Achievements;
  onAchievementsChange: (a: Achievements) => void;
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
  inflow: InflowStageShad,
  contract: ContractStageShad,
  delivery: DeliveryStageShad,
  educationNotes: EducationNotesStageShad,
  growth: GrowthStageShad,
  expert: ExpertStageShad,
};

function SectionBlock({ title, bgClass, children }: { title: string; bgClass: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${bgClass} space-y-6`}>
      <div className="font-semibold mb-4 text-sm pl-2 border-l-4 border-current">{title}</div>
      {children}
    </div>
  );
}

export default function StageBlocksShad({ stageData, onStageChange, achievements, onAchievementsChange }: Props) {
  return (
    <div className="grid gap-4 stage-grid md:grid-cols-3 lg:grid-cols-6">
      {/* 기본 과정 1~4 */}
      <SectionBlock title="기본 과정" bgClass="bg-gray-50 border-gray-200">
        {(Object.keys(TITLES) as (keyof StageData)[]).slice(0, 4).map((key, idx) => {
          const Comp = COMPONENTS[key];
          return (
            <StageWrapperShad
              key={key}
              title={TITLES[key]}
              number={idx + 1}
              memo={(stageData as any)[key]?.memo || ""}
              onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
            >
              {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
            </StageWrapperShad>
          );
        })}
        {/* 4단계 완료 체크박스 → 레벨 1 */}
        <SingleAchieveCheckbox level={1} achievements={achievements} onChange={onAchievementsChange} />
      </SectionBlock>

      {/* 성장 과정 5단계 */}
      <SectionBlock title="성장 과정" bgClass="bg-green-50 border-green-200">
        {(Object.keys(TITLES) as (keyof StageData)[]).slice(4, 5).map((key) => {
          const Comp = COMPONENTS[key];
          return (
            <StageWrapperShad
              key={key}
              title={TITLES[key]}
              number={5}
              memo={(stageData as any)[key]?.memo || ""}
              bgClass="bg-green-50"
              onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
            >
              {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
            </StageWrapperShad>
          );
        })}
        {/* 5단계 완료 체크박스 → 레벨 2 */}
        <SingleAchieveCheckbox level={2} achievements={achievements} onChange={onAchievementsChange} />
      </SectionBlock>

      {/* 전문가 과정 6단계 */}
      <SectionBlock title="전문가 과정" bgClass="bg-violet-50 border-violet-200">
        {(Object.keys(TITLES) as (keyof StageData)[]).slice(5).map((key) => {
          const Comp = COMPONENTS[key];
          return (
            <StageWrapperShad
              key={key}
              title={TITLES[key]}
              number={6}
              memo={(stageData as any)[key]?.memo || ""}
              bgClass="bg-violet-50"
              onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
            >
              {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
            </StageWrapperShad>
          );
        })}
        {/* 6단계 완료 체크박스 → 레벨 3 */}
        <SingleAchieveCheckbox level={3} achievements={achievements} onChange={onAchievementsChange} />
      </SectionBlock>
    </div>
  );
} 