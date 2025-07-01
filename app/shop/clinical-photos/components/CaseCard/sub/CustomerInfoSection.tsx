import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import type { ClinicalCase } from '@/app/shop/clinical-photos/types';

interface CustomerInfoSectionProps {
  caseItem: ClinicalCase;
  editableName: boolean;
  onUpdate: (updates: Partial<ClinicalCase>) => void;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  caseItem,
  editableName,
  onUpdate,
}) => {
  const [name, setName] = useState(caseItem.customerName ?? '');

  const handleBlur = () => {
    if (name.trim() && name !== caseItem.customerName) {
      onUpdate({ customerName: name.trim() });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">고객명</label>
      {editableName ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          placeholder="고객명을 입력하세요"
        />
      ) : (
        <p className="text-sm text-gray-800">{name}</p>
      )}
    </div>
  );
}; 