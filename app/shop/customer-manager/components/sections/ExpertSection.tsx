"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ExpertSectionProps {
  activeButtons: Record<string, string>;
  achievements: Record<string, boolean>;
  onButtonClick: (section: string, value: string) => void;
  onAchievementChange: (key: string, checked: boolean) => void;
  cardNumber: number;
}

const expertStages = ['매출업', '상담법', '마케팅'];

export default function ExpertSection({ 
    activeButtons, 
    achievements, 
    onButtonClick, 
    onAchievementChange,
    cardNumber,
}: ExpertSectionProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center gap-2">
          {expertStages.map((stage) => (
            <Button
              key={stage}
              variant={activeButtons[`expert-${stage}`] === stage ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => onButtonClick(`expert-${stage}`, stage)}
            >
              {stage}
            </Button>
          ))}
        </div>
      </div>
      
      {/* 본사 전문가 과정 체크박스 */}
      <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
        <div className="flex items-center gap-2">
            <Checkbox 
              id={`expert-course-${cardNumber}`}
              checked={achievements['expert-course']}
              onCheckedChange={(checked) => onAchievementChange('expert-course', !!checked)}
              className="w-4 h-4"
            />
            <label htmlFor={`expert-course-${cardNumber}`} className="text-sm text-gray-700">
              본사 전문가 과정을 모두 이수하였는가?
            </label>
            <div className="flex gap-1 ml-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
            </div>
        </div>
      </div>
    </div>
  );
} 