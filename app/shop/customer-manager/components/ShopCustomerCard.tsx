"use client";

import React, { useState, useMemo } from 'react';
import { ShopCustomerData, SelfAssessmentValue, TrainingTabsValue } from '../lib/types';
import { GrowthStageValue, ExpertStageValue } from '@/lib/types/customer';
import CustomerSectionWrapper from './sections/CustomerSectionWrapper';
import InstallationEducationSection from './sections/InstallationEducationSection';
import SelfAssessmentSection from './sections/SelfAssessmentSection';
import TrainingTabs, { getTrainingStarState } from './sections/TrainingTabs';
import GrowthSection from './sections/GrowthSection';
import ExpertSection from './sections/ExpertSection';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
  shopId: string;
}

// This is a new main component that reflects the Figma design.
export default function ShopCustomerCard({ customer, cardNumber, shopId }: CustomerCardProps) {
  // 단일 stageData 객체로 통합
  const [stageData, setStageData] = useState<{
    growth: GrowthStageValue;
    expert: ExpertStageValue;
  }>({
    growth: {
      clinicalProgress: { personal: 5, customers: [] },
      learningProgress: { 
        '홍조': { value: 0, max: 8, label: '홍조' },
        '기미': { value: 0, max: 12, label: '기미' },
        '브리핑': { value: 0, max: 6, label: '브리핑' },
        '여드름': { value: 0, max: 8, label: '여드름' }
      },
      evaluationScores: { '모의 테스트': 0, '실전 테스트': 0 },
      salesData: []
    },
    expert: {
      topic: undefined,
      memo: undefined
    }
  });

  const [achievements, setAchievements] = useState<Record<string, boolean>>({
    'basic-training': false,
    'standard-protocol': false,
    'expert-course': false,
  });
  const [sectionMemos, setSectionMemos] = useState<Record<string, string>>({});
  const [openMemoSections, setOpenMemoSections] = useState<Record<string, boolean>>({});
  const [selfAssess, setSelfAssess] = useState<SelfAssessmentValue>({});
  const [trainingTabs, setTrainingTabs] = useState<TrainingTabsValue>({
    application: false,
    completion: false,
  });

  const handleAchievementChange = (achievementKey: string, checked: boolean) => {
    setAchievements(prev => {
      const newAchievements = { ...prev };
      if (checked) {
        if (achievementKey === 'expert-course') { newAchievements['standard-protocol'] = true; newAchievements['basic-training'] = true; }
        if (achievementKey === 'standard-protocol') newAchievements['basic-training'] = true;
      } else {
        if (achievementKey === 'basic-training') { newAchievements['standard-protocol'] = false; newAchievements['expert-course'] = false; }
        if (achievementKey === 'standard-protocol') newAchievements['expert-course'] = false;
      }
      newAchievements[achievementKey] = checked;
      return newAchievements;
    });
  };

  const getHighestAchievement = () => {
    if (achievements['expert-course']) return 3;
    if (achievements['standard-protocol']) return 2;
    if (achievements['basic-training']) return 1;
    return 0;
  };

  const handleMemoToggle = (sectionId: string) => setOpenMemoSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  const handleMemoChange = (sectionId: string, value: string) => setSectionMemos(prev => ({ ...prev, [sectionId]: value }));
  
  const updateSelfAssess = (k: keyof SelfAssessmentValue, v: boolean) =>
    setSelfAssess((prev) => ({ ...prev, [k]: v }));

  const getMemoBackgroundColor = (sectionId: string) => {
    const colorMap: Record<string, string> = {
      'delivery': 'bg-orange-50', 'education-notes': 'bg-purple-50', 'growth': 'bg-pink-50', 'expert': 'bg-cyan-50',
    };
    return colorMap[sectionId] || 'bg-gray-50';
  };
  
  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 mb-5 max-w-2xl mx-auto relative font-sans">
      {/* Header */}
      <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold shadow-lg">{cardNumber}</div>
            <h2 className="text-lg font-bold">{customer.name}</h2>
            {Array.from({ length: getHighestAchievement() }).map((_, i) => <span key={i} className="text-yellow-500">⭐</span>)}
          </div>
          <div className="text-right">
            <p className="text-sm">담당자 : {customer.manager}</p>
            <p className="text-xs text-gray-500 mt-1">계약일 : {customer.contractDate}</p>
          </div>
        </div>
      </div>

      {/* Block 1: Installation & Self-Assessment */}
      <div className="relative mb-6 p-4 rounded-xl bg-slate-100 border border-slate-300">
        <CustomerSectionWrapper number="1" title="설치/교육" sectionId="delivery" memo={sectionMemos['delivery'] || ''} isMemoOpen={openMemoSections['delivery'] || false} onMemoToggle={() => handleMemoToggle('delivery')} onMemoChange={(v) => handleMemoChange('delivery', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
             <InstallationEducationSection 
                shopId={shopId}
            />
            <div className="mt-6">
                <SelfAssessmentSection 
                    value={selfAssess} 
                    onChange={updateSelfAssess} 
                />
            </div>

            {/* 본사 실무교육 이수 - TrainingTabs */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm mt-6">
              {/* 타이틀과 통합 별을 같은 줄에 배치 */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    "text-[22px] flex-shrink-0 transition-opacity duration-200",
                    getTrainingStarState(trainingTabs)
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="전체 교육 완료 여부"
                >
                  🌟
                </span>
                <div className="text-sm font-medium text-gray-700">본사 실무교육 이수</div>
              </div>
              <TrainingTabs
                value={trainingTabs}
                onToggle={(key) => setTrainingTabs(prev => ({
                  ...prev,
                  [key]: !prev[key]
                }))}
                hideIntegratedStar={true}
              />
            </div>
        </CustomerSectionWrapper>
      </div>
      
      {/* Block 2: Growth */}
      <div className="relative mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <CustomerSectionWrapper number="2" title="성장" sectionId="growth" memo={sectionMemos['growth'] || ''} isMemoOpen={openMemoSections['growth'] || false} onMemoToggle={() => handleMemoToggle('growth')} onMemoChange={(v) => handleMemoChange('growth', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <GrowthSection 
                value={stageData.growth}
                onChange={(v) => setStageData((p) => ({ ...p, growth: v || { clinicalProgress: { personal: 0, customers: [] }, learningProgress: {}, evaluationScores: {}, salesData: [] } }))}
            />
        </CustomerSectionWrapper>
      </div>

      {/* Block 3: Expert Course */}
      <div className="relative mb-6 p-4 rounded-xl bg-violet-50 border border-violet-200">
        <CustomerSectionWrapper number="3" title="전문가과정" sectionId="expert" memo={sectionMemos['expert'] || ''} isMemoOpen={openMemoSections['expert'] || false} onMemoToggle={() => handleMemoToggle('expert')} onMemoChange={(v) => handleMemoChange('expert', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <ExpertSection
                value={stageData.expert}
                onChange={(v) => setStageData((p) => ({ ...p, expert: v || { topic: undefined, memo: undefined } }))}
            />
        </CustomerSectionWrapper>
      </div>
    </div>
  );
} 