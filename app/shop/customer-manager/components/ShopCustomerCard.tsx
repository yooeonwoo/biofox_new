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
import ClinicalLearningTabs, { getClinicalLearningStarState } from '@/components/ClinicalLearningTabs';
import ShopExpertCourseTabs, { getShopExpertCourseStarState } from './sections/ShopExpertCourseTabs';
import { ClipboardCheck } from "lucide-react";
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
  
  // 임상 & 학습 평가용 상태 추가
  const [clinicalLearning, setClinicalLearning] = useState<{ clinical?: boolean; learning?: boolean }>({
    clinical: false,
    learning: false,
  });
  
  // 전문가 과정 상태 추가
  const [expertCourse, setExpertCourse] = useState<{ application?: boolean; completion?: boolean; educator?: boolean }>({
    application: false,
    completion: false,
    educator: false,
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

  const handleClinicalLearningChange = (key: "clinical" | "learning") => {
    setClinicalLearning(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpertCourseChange = (key: "application" | "completion" | "educator") => {
    setExpertCourse(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
        <div className="space-y-2">
          {/* 샵명과 별점 */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold truncate">{customer.name}</h2>
            {Array.from({ length: getHighestAchievement() }).map((_, i) => <span key={i} className="text-yellow-500">⭐</span>)}
          </div>
          
          {/* 담당자 */}
          <div>
            <p className="text-sm truncate">담당자 : {customer.manager}</p>
          </div>
          
          {/* 계약일 */}
          <div>
            <p className="text-xs text-gray-500 truncate">계약일 : {customer.contractDate}</p>
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

      {/* Block 2.5: Clinical & Learning */}
      <div className="relative mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="space-y-4">
          {/* 임상 & 학습 평가 */}
          <div className="p-3 border rounded-md bg-muted/20">
            {/* 타이틀과 통합 별 2개를 같은 줄에 배치 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getClinicalLearningStarState(clinicalLearning)
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
                    getClinicalLearningStarState(clinicalLearning)
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
              value={clinicalLearning}
              onToggle={handleClinicalLearningChange}
              hideIntegratedStar={true}
            />
            
            {/* 안내문구 */}
            <div
              className="mt-3 flex items-center gap-2 px-2 py-1 bg-blue-50/60
                         border border-blue-100 rounded-md"
            >
              {/* Icon */}
              <ClipboardCheck
                className="flex-shrink-0 size-4 text-blue-600 drop-shadow-sm"
                aria-hidden="true"
              />

              {/* Text */}
              <p
                className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-blue-800 leading-tight
                           whitespace-pre-wrap"
              >
                전문가 과정을 이수하면,<br className="inline sm:hidden" />
                광고에 노출시켜드립니다.
              </p>
            </div>
          </div>
        </div>
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

      {/* Block 4: Expert Course Tabs */}
      <div className="relative mb-6 p-4 rounded-xl bg-violet-50 border border-violet-200">
        <div className="space-y-4">
          {/* 본사 전문가과정 이수 평가 */}
          <div className="p-3 border rounded-md bg-muted/20">
            {/* 타이틀과 통합 별 3개를 같은 줄에 배치 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getShopExpertCourseStarState(expertCourse)
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getShopExpertCourseStarState(expertCourse)
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
                <span
                  className={cn(
                    "text-[22px] transition-opacity duration-200",
                    getShopExpertCourseStarState(expertCourse)
                      ? "text-yellow-400 opacity-100"
                      : "text-gray-300 opacity-40"
                  )}
                  aria-label="전문가과정 평가 완료 여부"
                >
                  🌟
                </span>
              </div>
              <div className="text-sm font-medium text-gray-700">본사 전문가과정 이수</div>
            </div>
            <ShopExpertCourseTabs
              value={expertCourse}
              onToggle={handleExpertCourseChange}
              hideIntegratedStar={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 