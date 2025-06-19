"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface InstallationEducationSectionProps {
  formData: Record<string, string>;
  checkboxes: Record<string, boolean>;
  onInputChange: (field: string, value: string) => void;
  onCheckboxChange: (field:string, checked: boolean) => void;
}

const selfAssessmentQuestions = [
    { id: 'self-q1', label: '본사 교육 내용을 충분히 숙지했나요?' },
    { id: 'self-q2', label: '임상 프로토콜을 정확하게 이해했나요?' },
    { id: 'self-q3', label: '고객에게 자신감 있게 설명할 수 있나요?' },
    { id: 'self-q4', label: '기기 작동 및 관리 방법을 완벽히 알고 있나요?' },
];

export default function InstallationEducationSection({ 
    formData, 
    checkboxes, 
    onInputChange, 
    onCheckboxChange 
}: InstallationEducationSectionProps) {
  return (
    <div className="space-y-6">
      {/* 설치 교육 파트 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">설치 교육</h4>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">설치 교육:</label>
            <Input className="flex-1 text-sm h-9" placeholder="날짜 입력" value={formData['install-education-date'] || ''} onChange={(e) => onInputChange('install-education-date', e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">설치 담당자:</label>
            <Input className="flex-1 text-sm h-9" placeholder="담당자명 입력" value={formData['install-manager'] || ''} onChange={(e) => onInputChange('install-manager', e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">연락처:</label>
            <Input className="flex-1 text-sm h-9" placeholder="연락처 입력" value={formData['install-contact'] || ''} onChange={(e) => onInputChange('install-contact', e.target.value)} />
        </div>
      </div>
      
      {/* 자가 평가 파트 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">자가 평가</h4>
        <div className="space-y-3">
          {selfAssessmentQuestions.map(q => (
            <div key={q.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
              <Checkbox 
                id={q.id} 
                checked={checkboxes[q.id] || false}
                onCheckedChange={(checked) => onCheckboxChange(q.id, !!checked)}
              />
              <label htmlFor={q.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                {q.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 