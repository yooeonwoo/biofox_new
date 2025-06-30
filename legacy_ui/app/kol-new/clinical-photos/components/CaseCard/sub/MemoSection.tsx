import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { ClinicalCase } from '@/app/kol-new/clinical-photos/types';

interface MemoSectionProps {
  caseItem: ClinicalCase;
  onUpdate: (updates: Partial<ClinicalCase>) => void;
}

export const MemoSection: React.FC<MemoSectionProps> = ({ caseItem, onUpdate }) => {
  const [memo, setMemo] = useState<string>(caseItem.treatmentPlan?.replace(/^\[본인\]\s*/, '') ?? '');

  const handleBlur = () => {
    if (memo !== (caseItem.treatmentPlan ?? '')) {
      // 본인 케이스라면 접두사 붙임은 API 레이어에서 처리 할 수도 있으나 일단 그대로 보냄
      onUpdate({ treatmentPlan: memo });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">메모</h3>
      <Textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        onBlur={handleBlur}
        placeholder="메모를 입력하세요"
      />
    </div>
  );
}; 