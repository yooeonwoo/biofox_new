"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ShopCustomerData } from '../lib/types';
import { cn } from '@/lib/utils';
import CustomerSectionWrapper from './sections/CustomerSectionWrapper';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
}

export default function ShopCustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      if (checked) {
        if (achievementKey === 'expert-course') newAchievements['expert-course'] = true;
        if (achievementKey >= 'standard-protocol') newAchievements['standard-protocol'] = true;
        newAchievements['basic-training'] = true;
      } else {
        if (achievementKey === 'basic-training') newAchievements['basic-training'] = false;
        if (achievementKey <= 'standard-protocol') newAchievements['standard-protocol'] = false;
        if (achievementKey <= 'expert-course') newAchievements['expert-course'] = false;
      }
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
  const handleInputChange = (field: string, value: string) => setFormData({ ...formData, [field]: value });
  const handleCheckboxChange = (field: string, checked: boolean) => setCheckboxes({ ...checkboxes, [field]: !!checked });

  const getMemoBackgroundColor = (sectionId: string) => {
    const colorMap: Record<string, string> = {
      'delivery': 'bg-orange-50', 'education-notes': 'bg-purple-50', 'growth': 'bg-pink-50', 'expert': 'bg-cyan-50',
    };
    return colorMap[sectionId] || 'bg-gray-50';
  };
  
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={`item-${cardNumber}`} className="border-2 border-black rounded-xl overflow-hidden">
        <AccordionTrigger className="p-0 hover:no-underline">
           <div className="bg-white p-4 flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">
                        {cardNumber}
                    </div>
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-700">담당자 : {customer.manager}</p>
                    <p className="text-xs text-gray-500 mt-1">계약일 : {customer.contractDate}</p>
                </div>
           </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 bg-gray-50">
            <CustomerSectionWrapper number="1" title="설치/교육" sectionId="delivery" memo={sectionMemos['delivery'] || ''} isMemoOpen={openMemoSections['delivery'] || false} onMemoToggle={() => handleMemoToggle('delivery')} onMemoChange={(value) => handleMemoChange('delivery', value)} getMemoBackgroundColor={getMemoBackgroundColor}>
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-700 min-w-[80px]">설치 교육 :</label><Input className="flex-1 text-sm h-9" placeholder="날짜 입력" value={formData['install-education-date'] || ''} onChange={(e) => handleInputChange('install-education-date', e.target.value)} /></div>
                <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-700 min-w-[80px]">설치 담당자 :</label><Input className="flex-1 text-sm h-9" placeholder="담당자명 입력" value={formData['install-manager'] || ''} onChange={(e) => handleInputChange('install-manager', e.target.value)} /></div>
                <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-700 min-w-[80px]">연락처 :</label><Input className="flex-1 text-sm h-9" placeholder="연락처 입력" value={formData['install-contact'] || ''} onChange={(e) => handleInputChange('install-contact', e.target.value)} /></div>
              </div>
            </CustomerSectionWrapper>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 