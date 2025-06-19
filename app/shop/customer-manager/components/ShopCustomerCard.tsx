"use client";

import React, { useState, useMemo } from 'react';
import { ShopCustomerData } from '../lib/types';
import CustomerSectionWrapper from './sections/CustomerSectionWrapper';
import InstallationEducationSection from './sections/InstallationEducationSection';
import GrowthSection from './sections/GrowthSection';
import ExpertSection from './sections/ExpertSection';

interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
}

// This is a new main component that reflects the Figma design.
export default function ShopCustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, string>>({});
  const [progressValues, setProgressValues] = useState<Record<string, number>>({ personal: 5 });
  const [customerProgress, setCustomerProgress] = useState<Record<string, number[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({
      manager: customer.manager,
      contractDate: customer.contractDate,
  });
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});
  const [achievements, setAchievements] = useState<Record<string, boolean>>({
    'basic-training': false,
    'standard-protocol': false,
    'expert-course': false,
  });
  const [sectionMemos, setSectionMemos] = useState<Record<string, string>>({});
  const [openMemoSections, setOpenMemoSections] = useState<Record<string, boolean>>({});
  const [learningProgress, setLearningProgress] = useState<Record<string, number>>({ '홍조': 0, '기미': 0, '브리핑': 0, '여드름': 0 });
  const [evaluationScores, setEvaluationScores] = useState<Record<string, number>>({ '모의 테스트': 0, '평가 테스트': 0, '튜터링': 0 });

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
  const handleButtonClick = (section: string, value: string) => setActiveButtons(prev => ({ ...prev, [section]: prev[section] === value ? '' : value }));
  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleCheckboxChange = (field: string, checked: boolean) => setCheckboxes(prev => ({ ...prev, [field]: !!checked }));
  const handleTrainingApplication = () => console.log('Apply for training');

  const handleProgressClick = (type: string, index: number) => setProgressValues({ ...progressValues, [type]: index + 1 });
  const handleCustomerProgressClick = (customerIndex: number, progressIndex: number) => {
      const key = `customer-${customerIndex}`;
      const current = customerProgress[key] || [];
      const newProgress = current.includes(progressIndex) ? current.filter(p => p !== progressIndex) : [...current, progressIndex];
      setCustomerProgress({ ...customerProgress, [key]: newProgress });
  };
  const learningMaxProgress: { [key: string]: number } = { '홍조': 8, '기미': 12, '브리핑': 6, '여드름': 8 };
  const handleLearningProgressClick = (subject: string, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const newProgress = Math.max(0, Math.min(learningMaxProgress[subject], Math.round((clickX / rect.width) * learningMaxProgress[subject])));
      setLearningProgress(prev => ({ ...prev, [subject]: newProgress }));
  };
  const handleScoreChange = (evalType: string, value: string) => {
      const clampedScore = Math.max(0, Math.min(100, parseInt(value) || 0));
      setEvaluationScores(prev => ({ ...prev, [evalType]: clampedScore }));
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold shadow-lg">{cardNumber}</div>
            <h2 className="text-lg font-bold">{customer.name}</h2>
            {Array.from({ length: getHighestAchievement() }).map((_, i) => <span key={i} className="text-yellow-500">⭐</span>)}
          </div>
          <div className="text-right">
            <p className="text-sm">담당자 : {formData.manager}</p>
            <p className="text-xs text-gray-500 mt-1">계약일 : {formData.contractDate}</p>
          </div>
        </div>
      </div>

      {/* Block 1: Installation & Self-Assessment */}
      <div className="relative mb-6 p-4 rounded-xl bg-slate-100 border border-slate-300">
        <CustomerSectionWrapper number="1" title="설치/교육" sectionId="delivery" memo={sectionMemos['delivery'] || ''} isMemoOpen={openMemoSections['delivery'] || false} onMemoToggle={() => handleMemoToggle('delivery')} onMemoChange={(v) => handleMemoChange('delivery', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
             <InstallationEducationSection 
                formData={formData}
                activeButtons={activeButtons}
                checkboxes={checkboxes}
                onInputChange={handleInputChange}
                onButtonClick={handleButtonClick}
                onCheckboxChange={handleCheckboxChange}
                onApplyTraining={handleTrainingApplication}
                cardNumber={cardNumber}
            />
        </CustomerSectionWrapper>
      </div>
      
      {/* Block 2: Growth */}
      <div className="relative mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <CustomerSectionWrapper number="3" title="성장" sectionId="growth" memo={sectionMemos['growth'] || ''} isMemoOpen={openMemoSections['growth'] || false} onMemoToggle={() => handleMemoToggle('growth')} onMemoChange={(v) => handleMemoChange('growth', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <GrowthSection 
                progressValues={progressValues}
                customerProgress={customerProgress}
                learningProgress={learningProgress}
                evaluationScores={evaluationScores}
                achievements={achievements}
                onProgressClick={handleProgressClick}
                onCustomerProgressClick={handleCustomerProgressClick}
                onLearningProgressClick={handleLearningProgressClick}
                onScoreChange={handleScoreChange}
                onAchievementChange={handleAchievementChange}
                cardNumber={cardNumber}
            />
        </CustomerSectionWrapper>
      </div>

      {/* Block 3: Expert Course */}
      <div className="relative mb-6 p-4 rounded-xl bg-violet-50 border border-violet-200">
        <CustomerSectionWrapper number="4" title="전문가과정" sectionId="expert" memo={sectionMemos['expert'] || ''} isMemoOpen={openMemoSections['expert'] || false} onMemoToggle={() => handleMemoToggle('expert')} onMemoChange={(v) => handleMemoChange('expert', v)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <ExpertSection
                activeButtons={activeButtons}
                achievements={achievements}
                onButtonClick={handleButtonClick}
                onAchievementChange={handleAchievementChange}
                cardNumber={cardNumber}
            />
        </CustomerSectionWrapper>
      </div>
    </div>
  );
} 