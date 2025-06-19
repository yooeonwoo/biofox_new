"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface ExpertSectionProps {
  activeButtons: Record<string, string>;
  onButtonClick: (section: string, value: string) => void;
}

const expertStages = [
  { id: 'expert-enroll', label: '등록' },
  { id: 'expert-in-progress', label: '진행중' },
  { id: 'expert-complete', label: '수료' },
];

export default function ExpertSection({ activeButtons, onButtonClick }: ExpertSectionProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center gap-2">
        {expertStages.map((stage) => (
          <Button
            key={stage.id}
            variant={activeButtons['expert'] === stage.id ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onButtonClick('expert', stage.id)}
          >
            {stage.label}
          </Button>
        ))}
      </div>
    </div>
  );
} 