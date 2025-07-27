'use client';

import { StageData } from '@/lib/types/customer';
import {
  StageWrapper,
  InflowStage,
  ContractStage,
  DeliveryStage,
  EducationNotesStage,
  GrowthStage,
  ExpertStage,
} from './stages';
// 아직 교체되지 않은 스테이지는 기존 컴포넌트 사용
import React, { useState, useCallback } from 'react';
import { Star, ClipboardCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Achievements 타입 및 단일 체크박스 컴포넌트 추가
import { Achievements } from '@/lib/types/customer';
import AchievementCheckbox from './AchievementCheckbox';
import StarTabs, { getIntegratedStarState } from '@/components/StarTabs';
import ClinicalLearningTabs, {
  getClinicalLearningStarState,
} from '@/components/ClinicalLearningTabs';
import ExpertCourseTabs, { getExpertCourseStarState } from '@/components/ExpertCourseTabs';

// Convex 관련 imports
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

const LABELS: Record<1 | 2 | 3, string> = {
  1: '본사 실무교육 이수',
  2: '본사 표준 프로토콜을 잘 따르는가?',
  3: '본사 전문가 과정을 모두 이수하였는가?',
};

const CONTAINER_STYLES: Record<1 | 2 | 3, string> = {
  1: 'bg-white border-gray-200',
  2: 'bg-white border-green-200',
  3: 'bg-white border-violet-200',
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
  const keys: (keyof Achievements)[] = ['basicTraining', 'standardProtocol', 'expertCourse'];
  const key = keys[level - 1];
  if (!key) throw new Error(`Invalid level: ${level}`);
  const checked = achievements[key];

  const toggle = (isChecked: boolean | 'indeterminate') => {
    if (typeof isChecked !== 'boolean') return;
    const newVal = { ...achievements };
    if (isChecked) {
      // 체크 → 하위레벨까지 모두 true
      for (let i = 0; i < level; i++) {
        const keyAtIndex = keys[i];
        if (keyAtIndex) newVal[keyAtIndex] = true;
      }
    } else {
      // 해제 → 상위레벨부터 모두 false
      for (let i = level - 1; i < 3; i++) {
        const keyAtIndex = keys[i];
        if (keyAtIndex) newVal[keyAtIndex] = false;
      }
    }
    onChange(newVal);
  };

  const id = `achieve-level-${level}-${key}`;

  return (
    <div className={cn('rounded-lg border p-3', CONTAINER_STYLES[level])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={checked} onCheckedChange={toggle} />
          <label htmlFor={id} className="select-none text-sm font-medium text-gray-700">
            {LABELS[level]}
          </label>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: level }).map((_, i) => (
            <Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />
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
  // 저장 기능을 위한 새로운 props
  customerId?: Id<'customers'>;
  isDummyMode?: boolean;
}

const TITLES: Record<keyof StageData, string> = {
  inflow: '유입',
  contract: '계약/결제',
  delivery: '설치/교육',
  educationNotes: '교육 완료 후 특이사항',
  growth: '성장',
  expert: '전문가과정',
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
    2: 'text-emerald-800 border-emerald-500',
    3: 'text-violet-800 border-violet-500',
  };
  const titleStyle = level && level > 1 ? titleColorMap[level] : 'text-gray-800 border-gray-500';

  return (
    <div
      className={cn(
        'relative space-y-6 overflow-hidden rounded-xl border p-4 transition-all duration-300',
        isAchieved ? 'border-blue-300 bg-blue-50/70 shadow-lg' : bgClass
      )}
    >
      {level && (
        <div
          className={cn(
            'pointer-events-none absolute right-4 top-4 flex select-none gap-2 text-4xl transition-opacity duration-300',
            isAchieved ? 'opacity-60' : 'opacity-15'
          )}
        >
          {Array.from({ length: level }).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
      )}
      <div className={cn('mb-4 border-l-4 pl-3 text-base font-bold', titleStyle)}>{title}</div>
      {children}
    </div>
  );
}

export default function StageBlocks({
  stageData,
  onStageChange,
  achievements,
  onAchievementsChange,
  customerId,
  isDummyMode = false,
}: Props) {
  // 각 단계별 저장 상태 관리
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [lastSavedTimes, setLastSavedTimes] = useState<Record<string, Date | null>>({});

  // Convex mutation
  const updateCustomerProgress = useMutation(api.customers.updateCustomerProgress);

  // 개별 단계 저장 함수
  const saveStage = useCallback(
    async (stageKey: keyof StageData) => {
      if (isDummyMode || !customerId) {
        console.log('더미 모드 또는 고객 ID 없음: 저장 시뮬레이션', {
          stageKey,
          stageData,
          achievements,
        });

        // 더미 모드에서도 저장 상태 업데이트
        setSavingStates(prev => ({ ...prev, [stageKey]: true }));

        // 1초 대기 후 완료 처리
        setTimeout(() => {
          setSavingStates(prev => ({ ...prev, [stageKey]: false }));
          setLastSavedTimes(prev => ({ ...prev, [stageKey]: new Date() }));
          toast.success(`${TITLES[stageKey]} 단계가 저장되었습니다.`);
        }, 1000);

        return;
      }

      try {
        setSavingStates(prev => ({ ...prev, [stageKey]: true }));

        await updateCustomerProgress({
          customerId,
          stageData,
          achievements,
        });

        setLastSavedTimes(prev => ({ ...prev, [stageKey]: new Date() }));
        toast.success(`${TITLES[stageKey]} 단계가 저장되었습니다.`);
      } catch (error) {
        console.error('저장 실패:', error);
        toast.error(`${TITLES[stageKey]} 단계 저장에 실패했습니다.`);
      } finally {
        setSavingStates(prev => ({ ...prev, [stageKey]: false }));
      }
    },
    [customerId, stageData, achievements, updateCustomerProgress, isDummyMode]
  );

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
                memo={(stageData as any)[key]?.memo || ''}
                onMemoChange={(m: string) =>
                  onStageChange(key, { ...(stageData as any)[key], memo: m })
                }
                onSave={() => saveStage(key)}
                isSaving={savingStates[key] || false}
                lastSaved={lastSavedTimes[key] || null}
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
          {/* 본사 실무교육 이수 평가 */}
          <div className="rounded-md border bg-muted/20 p-3">
            {/* 타이틀과 통합 별을 같은 줄에 배치 */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'flex-shrink-0 text-[22px] transition-opacity duration-200',
                  getIntegratedStarState({
                    manager: achievements.starManager,
                    owner: achievements.starOwner,
                    director: achievements.starDirector,
                  })
                    ? 'text-yellow-400 opacity-100'
                    : 'text-gray-300 opacity-40'
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
              onToggle={() =>
                onAchievementsChange({
                  ...achievements,
                  starManager: !achievements.starManager,
                })
              }
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
          {(Object.keys(TITLES) as (keyof StageData)[]).slice(4, 5).map(key => {
            const Comp = COMPONENTS[key];
            return (
              <StageWrapper
                key={key}
                title={TITLES[key]}
                number={5}
                memo={(stageData as any)[key]?.memo || ''}
                bgClass="bg-green-50"
                onMemoChange={(m: string) =>
                  onStageChange(key, { ...(stageData as any)[key], memo: m })
                }
                onSave={() => saveStage(key)}
                isSaving={savingStates[key] || false}
                lastSaved={lastSavedTimes[key] || null}
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
          {/* 임상 & 학습 평가 */}
          <div className="rounded-md border bg-muted/20 p-3">
            {/* 타이틀과 통합 별 2개를 같은 줄에 배치 */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-shrink-0 items-center gap-1">
                <span
                  className={cn(
                    'text-[22px] transition-opacity duration-200',
                    getClinicalLearningStarState({
                      clinical: achievements.clinicalStar,
                      learning: achievements.learningStar,
                    })
                      ? 'text-yellow-400 opacity-100'
                      : 'text-gray-300 opacity-40'
                  )}
                  aria-label="임상 학습 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    'text-[22px] transition-opacity duration-200',
                    getClinicalLearningStarState({
                      clinical: achievements.clinicalStar,
                      learning: achievements.learningStar,
                    })
                      ? 'text-yellow-400 opacity-100'
                      : 'text-gray-300 opacity-40'
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
              onToggle={key =>
                onAchievementsChange({
                  ...achievements,
                  [key === 'clinical' ? 'clinicalStar' : 'learningStar']:
                    !achievements[key === 'clinical' ? 'clinicalStar' : 'learningStar'],
                })
              }
              hideIntegratedStar={true}
            />

            {/* ─── Expert course guidance banner ─── */}
            <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-2 py-1">
              {/* Icon */}
              <ClipboardCheck
                className="size-4 flex-shrink-0 text-blue-600 drop-shadow-sm"
                aria-hidden="true"
              />

              {/* Text */}
              <p className="whitespace-pre-wrap text-[9px] font-medium leading-tight text-blue-800 xs:text-[10px] sm:text-[11px]">
                전문가 과정을 들을 수 있게끔 권유하세요.
              </p>
            </div>
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
          {(Object.keys(TITLES) as (keyof StageData)[]).slice(5).map(key => {
            const Comp = COMPONENTS[key];
            return (
              <StageWrapper
                key={key}
                title={TITLES[key]}
                number={6}
                memo={(stageData as any)[key]?.memo || ''}
                bgClass="bg-violet-50"
                onMemoChange={(m: string) =>
                  onStageChange(key, { ...(stageData as any)[key], memo: m })
                }
                onSave={() => saveStage(key)}
                isSaving={savingStates[key] || false}
                lastSaved={lastSavedTimes[key] || null}
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
          {/* 본사 전문가과정 이수 평가 */}
          <div className="rounded-md border bg-muted/20 p-3">
            {/* 타이틀과 통합 별 3개를 같은 줄에 배치 */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-shrink-0 items-center gap-1">
                <span
                  className={cn(
                    'text-[22px] transition-opacity duration-200',
                    getExpertCourseStarState({
                      owner: achievements.expertOwner,
                      educator: achievements.expertEducator,
                    })
                      ? 'text-yellow-400 opacity-100'
                      : 'text-gray-300 opacity-40'
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    'text-[22px] transition-opacity duration-200',
                    getExpertCourseStarState({
                      owner: achievements.expertOwner,
                      educator: achievements.expertEducator,
                    })
                      ? 'text-yellow-400 opacity-100'
                      : 'text-gray-300 opacity-40'
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    'text-[22px] transition-opacity duration-200',
                    getExpertCourseStarState({
                      owner: achievements.expertOwner,
                      educator: achievements.expertEducator,
                    })
                      ? 'text-yellow-400 opacity-100'
                      : 'text-gray-300 opacity-40'
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
              </div>
              <div className="text-sm font-medium text-gray-700">본사 전문가과정 이수</div>
            </div>
            <ExpertCourseTabs
              value={{
                owner: achievements.expertOwner,
                educator: achievements.expertEducator,
              }}
              onToggle={key =>
                onAchievementsChange({
                  ...achievements,
                  [key === 'owner' ? 'expertOwner' : 'expertEducator']:
                    !achievements[key === 'owner' ? 'expertOwner' : 'expertEducator'],
                })
              }
              hideIntegratedStar={true}
            />
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
