"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface InstallationEducationSectionProps {
  formData: Record<string, string>;
  activeButtons: Record<string, string>;
  checkboxes: Record<string, boolean>;
  onInputChange: (field: string, value: string) => void;
  onButtonClick: (section: string, value: string) => void;
  onCheckboxChange: (field:string, checked: boolean) => void;
  onApplyTraining: () => void;
  cardNumber: number;
}

const selfAssessmentQuestions = [
    { id: 'place-setting', label: '1. 플레이스는 세팅하였는가?' },
    { id: 'insta-setting', label: '2. 인스타는 세팅하였는가?' },
    { id: 'protocol-compliance', label: '3. 정품 및 정량 프로토콜대로 시행하고 있는가?' },
    { id: 'product-display', label: '4. 상품 진열이 잘 되어있는가?' },
];

export default function InstallationEducationSection({ 
    formData,
    activeButtons,
    checkboxes,
    onInputChange,
    onButtonClick,
    onCheckboxChange,
    onApplyTraining,
    cardNumber
}: InstallationEducationSectionProps) {
  return (
    <div className="space-y-6">
      {/* 설치 교육 파트 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">설치 교육</h4>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">설치 교육:</label>
            <Input className="flex-1 text-sm h-9" placeholder="날짜를 입력하세요" value={formData['install-education-date'] || ''} onChange={(e) => onInputChange('install-education-date', e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">설치 담당자:</label>
            <Input className="flex-1 text-sm h-9" placeholder="담당자명을 입력하세요" value={formData['install-manager'] || ''} onChange={(e) => onInputChange('install-manager', e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-28">연락처:</label>
            <Input className="flex-1 text-sm h-9" placeholder="연락처를 입력하세요" value={formData['install-contact'] || ''} onChange={(e) => onInputChange('install-contact', e.target.value)} />
        </div>
      </div>
      
      {/* 자가 평가 파트 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">자가 평가</h4>
        <div className="space-y-3">
          {selfAssessmentQuestions.map(q => (
            <div key={q.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
              <span className="text-sm font-medium text-gray-700">{q.label}</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`${q.id}-${level}`}
                    variant={activeButtons[q.id] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-10"
                    onClick={() => onButtonClick(q.id, level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 본사 실무교육 신청하기 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox 
              id={`training-application-${cardNumber}`}
              checked={checkboxes['training-application'] || false}
              onCheckedChange={(checked) => onCheckboxChange('training-application', !!checked)}
              className="w-5 h-5"
            />
            <label htmlFor={`training-application-${cardNumber}`} className="text-sm font-medium text-gray-700 cursor-pointer">
              본사 실무교육 신청하기
            </label>
          </div>
          <Button
            onClick={onApplyTraining}
            variant="default"
            size="sm"
            className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            신청
          </Button>
        </div>
      </div>
    </div>
  );
} 