import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { ClinicalCase } from '@/app/shop/clinical-photos/types';
import { SYSTEM_OPTIONS } from '@/app/shop/clinical-photos/constants';

interface SkinTypeSectionProps {
  caseItem: ClinicalCase;
  onUpdate: (updates: Partial<ClinicalCase>) => void;
}

const SKIN_FIELD_MAP: Record<string, keyof ClinicalCase> = {
  red_sensitive: 'skinRedSensitive',
  pigment: 'skinPigment',
  pore: 'skinPore',
  trouble: 'skinTrouble',
  wrinkle: 'skinWrinkle',
  etc: 'skinEtc',
};

export const SkinTypeSection: React.FC<SkinTypeSectionProps> = ({ caseItem, onUpdate }) => {
  const handleToggle = (value: string) => {
    const field = SKIN_FIELD_MAP[value];
    if (!field) return;
    onUpdate({ [field]: !caseItem[field] } as Partial<ClinicalCase>);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">고객 피부 타입</h3>
      <div className="grid grid-cols-2 gap-2">
        {SYSTEM_OPTIONS.skinTypes.map(opt => {
          const field = SKIN_FIELD_MAP[opt.value];
          const checked = field ? (caseItem[field] as boolean | undefined) : false;
          return (
            <label key={opt.value} className="flex items-center space-x-2 text-sm">
              <Checkbox
                checked={!!checked}
                onCheckedChange={() => handleToggle(opt.value)}
                id={`skin-${opt.value}`}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
