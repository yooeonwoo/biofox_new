"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ShopCustomerData } from '../lib/types';
import { cn } from '@/lib/utils';


interface CustomerCardProps {
  customer: ShopCustomerData;
  cardNumber: number;
}

export default function ShopCustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, string>>({});
  const [progressValues, setProgressValues] = useState<Record<string, number>>({
    personal: 5,
  });
  const [customerProgress, setCustomerProgress] = useState<Record<string, number[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});
  
  const [achievements, setAchievements] = useState<Record<string, boolean>>({
    'basic-training': false,
    'standard-protocol': false,
    'expert-course': false,
  });
  
  const [sectionMemos, setSectionMemos] = useState<Record<string, string>>({});
  const [openMemoSections, setOpenMemoSections] = useState<Record<string, boolean>>({});

  const [learningProgress, setLearningProgress] = useState<Record<string, number>>({
    '홍조': 0,
    '기미': 0,
    '브리핑': 0,
    '여드름': 0,
  });

  const [evaluationScores, setEvaluationScores] = useState<Record<string, number>>({
    '모의 테스트': 0,
    '평가 테스트': 0,
    '튜터링': 0,
  });

  const [salesData] = useState<number[]>([
    320, 280, 450, 380, 520, 480, 610, 580, 530, 620, 580, 650
  ]);

  const learningMaxProgress = {
    '홍조': 8,
    '기미': 12,
    '브리핑': 6,
    '여드름': 8,
  };

  const getMemoBackgroundColor = (sectionId: string) => {
    const colorMap: Record<string, string> = {
      'delivery': 'bg-orange-50',
      'education-notes': 'bg-purple-50',
      'growth': 'bg-pink-50',
      'expert': 'bg-cyan-50',
    };
    return colorMap[sectionId] || 'bg-gray-50';
  };

  const handleAchievementChange = (achievementKey: string, checked: boolean) => {
    setAchievements(prev => {
      const newAchievements = { ...prev };
      
      if (checked) {
        switch (achievementKey) {
          case 'expert-course':
            newAchievements['expert-course'] = true;
          case 'standard-protocol':
            newAchievements['standard-protocol'] = true;
          case 'basic-training':
            newAchievements['basic-training'] = true;
            break;
        }
      } else {
        switch (achievementKey) {
          case 'basic-training':
            newAchievements['basic-training'] = false;
          case 'standard-protocol':
            newAchievements['standard-protocol'] = false;
          case 'expert-course':
            newAchievements['expert-course'] = false;
            break;
        }
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

  const handleMemoToggle = (sectionId: string) => {
    setOpenMemoSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleMemoChange = (sectionId: string, value: string) => {
    setSectionMemos(prev => ({ ...prev, [sectionId]: value }));
  };

  const totalLearningProgress = useMemo(() => {
    const currentTotal = Object.values(learningProgress).reduce((sum, current) => sum + current, 0);
    const maxTotal = Object.values(learningMaxProgress).reduce((sum, max) => sum + max, 0);
    const percentage = maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0;
    return { currentTotal, maxTotal, percentage };
  }, [learningProgress, learningMaxProgress]);

  const averageScore = useMemo(() => {
    const scores = Object.values(evaluationScores);
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }, [evaluationScores]);

  const handleButtonClick = (section: string, value: string) => {
    setActiveButtons(prev => ({ ...prev, [section]: prev[section] === value ? '' : value }));
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCheckboxes({ ...checkboxes, [field]: !!checked });
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 mb-5 max-w-4xl mx-auto relative">
      <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50 relative z-10">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold shadow-lg">
                {cardNumber}
              </div>
              <div className="flex items-center gap-1">
                <h2 className="text-lg">{customer.name}</h2>
                {Array.from({ length: getHighestAchievement() }).map((_, index) => (
                  <span key={index} className="text-yellow-500">⭐</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm h-7 flex items-center justify-end p-1">
                <span className="text-gray-600">담당자 : </span>
                <span>{formData['manager'] || customer.manager}</span>
              </div>
              <div className="text-xs text-gray-500 opacity-75 mt-1 text-right">
                <span>계약일 : </span>
                <span>{formData['contractDate'] || customer.contractDate}</span>
              </div>
            </div>
        </div>
      </div>

      {/* 여기에 CustomerSection들을 조합하여 UI를 완성합니다. */}

    </div>
  );
}

interface CustomerSectionProps {
  number: string;
  title?: string;
  sectionId: string;
  memo: string;
  isMemoOpen: boolean;
  onMemoToggle: () => void;
  onMemoChange: (value: string) => void;
  getMemoBackgroundColor: (sectionId: string) => string;
  children: React.ReactNode;
}

function CustomerSection({ 
  number, 
  title, 
  sectionId, 
  memo, 
  isMemoOpen, 
  onMemoToggle, 
  onMemoChange, 
  getMemoBackgroundColor,
  children 
}: CustomerSectionProps) {
  return (
    <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden relative z-10">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium">
            {number}
          </div>
          {title && <div className="font-medium">{title}</div>}
        </div>
        
        <button
          onClick={onMemoToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            memo.trim() ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={isMemoOpen ? '메모 닫기' : '메모 열기'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      
      {isMemoOpen && (
        <div className={cn(getMemoBackgroundColor(sectionId), "border-b border-gray-300 p-3 animate-in slide-in-from-top-2 duration-200")}>
          <Textarea
            value={memo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onMemoChange(e.target.value)}
            placeholder="이 섹션에 대한 메모를 입력하세요..."
            className="w-full h-20 p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{memo.length}자</span>
            <div className="flex gap-2">
              <button onClick={() => onMemoChange('')} className="text-xs text-gray-500 hover:text-red-500 transition-colors">지우기</button>
              <button onClick={onMemoToggle} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">완료</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 