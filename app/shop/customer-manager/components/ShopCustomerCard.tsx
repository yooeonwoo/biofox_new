"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopCustomerData } from '../lib/types';
import CustomerSectionWrapper from './sections/CustomerSectionWrapper';
import InstallationEducationSection from './sections/InstallationEducationSection';
import GrowthSection from './sections/GrowthSection';
import ExpertSection from './sections/ExpertSection';
import AchievementSection from './sections/AchievementSection';

interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
}

export default function ShopCustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, string>>({});
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

  const handleAchievementChange = (achievementKey: string, checked: boolean) => {
    setAchievements(prev => {
      const newAchievements = { ...prev };
      // Simplified cascading logic
      if (checked) {
        if (achievementKey === 'expert-course') newAchievements['standard-protocol'] = true;
        if (achievementKey === 'standard-protocol' || achievementKey === 'expert-course') newAchievements['basic-training'] = true;
      }
      newAchievements[achievementKey] = checked;

      // Uncheck higher levels if a lower level is unchecked
      if (!checked) {
        if (achievementKey === 'basic-training') {
          newAchievements['standard-protocol'] = false;
          newAchievements['expert-course'] = false;
        }
        if (achievementKey === 'standard-protocol') {
            newAchievements['expert-course'] = false;
        }
      }
      return newAchievements;
    });
  };

  const handleMemoToggle = (sectionId: string) => setOpenMemoSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  const handleMemoChange = (sectionId: string, value: string) => setSectionMemos(prev => ({ ...prev, [sectionId]: value }));
  const handleButtonClick = (section: string, value: string) => setActiveButtons(prev => ({ ...prev, [section]: prev[section] === value ? '' : value }));
  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleCheckboxChange = (field: string, checked: boolean) => setCheckboxes(prev => ({ ...prev, [field]: !!checked }));

  const getMemoBackgroundColor = (sectionId: string) => {
    const colorMap: Record<string, string> = {
      'installation-education': 'bg-green-50',
      'growth': 'bg-pink-50',
      'expert': 'bg-cyan-50',
    };
    return colorMap[sectionId] || 'bg-gray-50';
  };
  
  return (
    <Card className="w-full border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg">
      <CardHeader className="bg-white p-4 flex flex-row justify-between items-center w-full border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-inner">
            {cardNumber}
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">{customer.name}</CardTitle>
        </div>
        <div className="text-right">
          <p className="text-md text-gray-700 font-semibold">담당자 : {formData.manager}</p>
          <p className="text-sm text-gray-500 mt-1">계약일 : {formData.contractDate}</p>
        </div>
      </CardHeader>
      <CardContent className="p-5 bg-gray-50 space-y-6">
        <CustomerSectionWrapper number="1" title="설치/교육 및 자가 평가" sectionId="installation-education" memo={sectionMemos['installation-education'] || ''} isMemoOpen={openMemoSections['installation-education'] || false} onMemoToggle={() => handleMemoToggle('installation-education')} onMemoChange={(value) => handleMemoChange('installation-education', value)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <InstallationEducationSection 
                formData={formData}
                checkboxes={checkboxes}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
            />
        </CustomerSectionWrapper>

        <CustomerSectionWrapper number="2" title="성장" sectionId="growth" memo={sectionMemos['growth'] || ''} isMemoOpen={openMemoSections['growth'] || false} onMemoToggle={() => handleMemoToggle('growth')} onMemoChange={(value) => handleMemoChange('growth', value)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <GrowthSection 
                activeButtons={activeButtons}
                onButtonClick={handleButtonClick}
            />
        </CustomerSectionWrapper>
        
        <CustomerSectionWrapper number="3" title="전문가 과정" sectionId="expert" memo={sectionMemos['expert'] || ''} isMemoOpen={openMemoSections['expert'] || false} onMemoToggle={() => handleMemoToggle('expert')} onMemoChange={(value) => handleMemoChange('expert', value)} getMemoBackgroundColor={getMemoBackgroundColor}>
            <ExpertSection
                activeButtons={activeButtons}
                onButtonClick={handleButtonClick}
            />
        </CustomerSectionWrapper>

        <AchievementSection 
            achievements={achievements}
            onAchievementChange={handleAchievementChange}
        />
      </CardContent>
    </Card>
  );
} 