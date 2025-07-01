"use client";

import { StageData } from "@/lib/types/customer";
import { StageWrapper, InflowStage, ContractStage, DeliveryStage, EducationNotesStage, GrowthStage, ExpertStage } from "./stages";
// 아직 교체되지 않은 스테이지는 기존 컴포넌트 사용
import React from "react";
import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Achievements 타입 및 단일 체크박스 컴포넌트 추가
import { Achievements } from "@/lib/types/customer";
import AchievementCheckbox from "./AchievementCheckbox";
import StarTabs, { getIntegratedStarState } from "@/components/StarTabs";
import ClinicalLearningTabs, { getClinicalLearningStarState } from "@/components/ClinicalLearningTabs";

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
  inflow: InflowStage,
  contract: ContractStage,
  delivery: DeliveryStage,
  educationNotes: EducationNotesStage,
  growth: GrowthStage,
  expert: ExpertStage,
};

function SectionBlock({
  title,
  bgClass,
  children,
  level,
  isAchieved,
}: {
  title: string;
  bgClass: string;
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  isAchieved?: boolean;
}) {
  const titleColorMap: Record<number, string> = {
    2: "text-emerald-800 border-emerald-500",
    3: "text-violet-800 border-violet-500",
  };
  const titleStyle = level && level > 1 ? titleColorMap[level] : "text-gray-800 border-gray-500";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 space-y-6 overflow-hidden transition-all duration-300",
        isAchieved
          ? "shadow-lg border-blue-300 bg-blue-50/70"
          : bgClass
      )}
    >
      {level && (
        <div className={cn(
          "absolute top-4 right-4 text-4xl pointer-events-none select-none flex gap-2 transition-opacity duration-300",
          isAchieved ? "opacity-60" : "opacity-15"
        )}>
          {Array.from({ length: level }).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
      )}
      <div className={cn("font-bold text-base mb-4 pl-3 border-l-4", titleStyle)}>{title}</div>
      {children}
    </div>
  );
}

export default function StageBlocks({ stageData, onStageChange, achievements, onAchievementsChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 기본 과정 1~4 */}
      <div className="space-y-4">
        <SectionBlock 
          title="기본 과정" 
          bgClass="bg-gray-50 border-gray-200"
          isAchieved={achievements.basicTraining}
          level={1}
        >
          {(Object.keys(TITLES) as (keyof StageData)[]).slice(0, 4).map((key, idx) => {
            const Comp = COMPONENTS[key];
            return (
              <StageWrapper
                key={key}
                title={TITLES[key]}
                number={idx + 1}
                memo={(stageData as any)[key]?.memo || ""}
                onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
              >
                {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
              </StageWrapper>
            );
          })}
          {/* 본사 실무교육 이수 평가 */}
          <div className="p-3 border rounded-md bg-muted/20">
            {/* 타이틀과 통합 별을 같은 줄에 배치 */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  "text-[22px] flex-shrink-0 transition-opacity duration-200",
                  getIntegratedStarState({
                    manager: achievements.starManager,
                    owner: achievements.starOwner,
                    director: achievements.starDirector,
                  })
                    ? "text-yellow-400 opacity-100"
                    : "text-gray-300 opacity-40"
                )}
                aria-label="전체 평가 완료 여부"
              >
                🌟
              </span>
              <div className="text-sm font-medium text-gray-700">본사 실무교육 이수</div>
            </div>
            <StarTabs
              value={{
                manager: achievements.starManager,
                owner: achievements.starOwner,
                director: achievements.starDirector,
              }}
              onToggle={() => onAchievementsChange({
                ...achievements, 
                starManager: !achievements.starManager
              })}
              hideIntegratedStar={true}
            />
          </div>
        </SectionBlock>
      </div>

      {/* 성장 과정 5단계 */}
      <div className="space-y-4">
        <SectionBlock 
          title="성장 과정" 
          bgClass="bg-emerald-50 border-emerald-200" 
          level={2}
          isAchieved={achievements.standardProtocol}
        >
          {(Object.keys(TITLES) as (keyof StageData)[]).slice(4, 5).map((key) => {
            const Comp = COMPONENTS[key];
            return (
              <StageWrapper
                key={key}
                title={TITLES[key]}
                number={5}
                memo={(stageData as any)[key]?.memo || ""}
                bgClass="bg-green-50"
                onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
              >
                {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
              </StageWrapper>
            );
          })}
          {/* 임상 & 학습 평가 */}
          <div className="p-3 border rounded-md bg-muted/20">
            {/* 타이틀과 통합 별 2개를 같은 줄에 배치 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getClinicalLearningStarState({
                      clinical: achievements.clinicalStar,
                      learning: achievements.learningStar,
                    })
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="임상 학습 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getClinicalLearningStarState({
                      clinical: achievements.clinicalStar,
                      learning: achievements.learningStar,
                    })
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="임상 학습 평가 완료 여부"
                >
                  🌟
                </span>
              </div>
              <div className="text-sm font-medium text-gray-700">임상 & 학습</div>
            </div>
            <ClinicalLearningTabs
              value={{
                clinical: achievements.clinicalStar,
                learning: achievements.learningStar,
              }}
              onToggle={(key) => onAchievementsChange({
                ...achievements, 
                [key === "clinical" ? "clinicalStar" : "learningStar"]: 
                  !achievements[key === "clinical" ? "clinicalStar" : "learningStar"]
              })}
              hideIntegratedStar={true}
            />
          </div>
        </SectionBlock>
      </div>

      {/* 전문가 과정 6단계 */}
      <div className="space-y-4">
        <SectionBlock 
          title="전문가 과정" 
          bgClass="bg-violet-50 border-violet-200" 
          level={3}
          isAchieved={achievements.expertCourse}
        >
          {(Object.keys(TITLES) as (keyof StageData)[]).slice(5).map((key) => {
            const Comp = COMPONENTS[key];
            return (
              <StageWrapper
                key={key}
                title={TITLES[key]}
                number={6}
                memo={(stageData as any)[key]?.memo || ""}
                bgClass="bg-violet-50"
                onMemoChange={(m: string) => onStageChange(key, { ...(stageData as any)[key], memo: m })}
              >
                {Comp && <Comp value={(stageData as any)[key]} onChange={(val: any) => onStageChange(key, val)} />}
              </StageWrapper>
            );
          })}
          {/* 6단계 완료 체크박스 → 레벨 3 */}
          <AchievementCheckbox level={3} achievements={achievements} onChange={onAchievementsChange} />
        </SectionBlock>
      </div>
    </div>
  );
} 