"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GrowthSectionProps {
  activeButtons: Record<string, string>;
  onButtonClick: (section: string, value: string) => void;
}

const clinicalStages = [
  { id: 'clinical-basic', label: 'Basic (5회)' },
  { id: 'clinical-intermediate', label: 'Intermediate (10회)' },
  { id: 'clinical-advanced', label: 'Advanced (20회)' },
];

const learningStages = [
  { id: 'learning-basic', label: '초급' },
  { id: 'learning-intermediate', label: '중급' },
  { id: 'learning-advanced', label: '고급' },
];

const evaluationStages = [
  { id: 'eval-theory', label: '이론' },
  { id: 'eval-practice', label: '실기' },
];

export default function GrowthSection({ activeButtons, onButtonClick }: GrowthSectionProps) {
  
  const getProgress = (section: string, stages: any[]) => {
    const activeButton = activeButtons[section];
    if (!activeButton) return 0;
    const activeIndex = stages.findIndex(stage => stage.id === activeButton);
    return ((activeIndex + 1) / stages.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 임상 섹션 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800">임상</h4>
        <div className="flex justify-between items-center gap-2">
            {clinicalStages.map((stage) => (
                <Button 
                    key={stage.id} 
                    variant={activeButtons['clinical'] === stage.id ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onButtonClick('clinical', stage.id)}
                >
                    {stage.label}
                </Button>
            ))}
        </div>
        <Progress value={getProgress('clinical', clinicalStages)} className="h-2" />
      </div>

      {/* 학습 진도 섹션 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800">학습 진도</h4>
        <div className="flex justify-between items-center gap-2">
            {learningStages.map((stage) => (
                <Button 
                    key={stage.id}
                    variant={activeButtons['learning'] === stage.id ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onButtonClick('learning', stage.id)}
                >
                    {stage.label}
                </Button>
            ))}
        </div>
        <Progress value={getProgress('learning', learningStages)} className="h-2" />
      </div>

      {/* 평가 섹션 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800">평가</h4>
        <div className="flex justify-between items-center gap-2">
            {evaluationStages.map((stage) => (
                <Button 
                    key={stage.id}
                    variant={activeButtons['evaluation'] === stage.id ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onButtonClick('evaluation', stage.id)}
                >
                    {stage.label}
                </Button>
            ))}
        </div>
      </div>
    </div>
  );
} 