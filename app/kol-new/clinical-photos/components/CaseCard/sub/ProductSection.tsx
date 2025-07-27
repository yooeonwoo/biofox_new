import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { ClinicalCase } from '@/app/kol-new/clinical-photos/types';
import { SYSTEM_OPTIONS } from '@/app/kol-new/clinical-photos/constants';

interface ProductSectionProps {
  caseItem: ClinicalCase;
  onUpdate: (updates: Partial<ClinicalCase>) => void;
}

const PRODUCT_FIELD_MAP: Record<string, keyof ClinicalCase> = {
  cure_booster: 'cureBooster',
  cure_mask: 'cureMask',
  premium_mask: 'premiumMask',
  all_in_one_serum: 'allInOneSerum',
};

export const ProductSection: React.FC<ProductSectionProps> = ({ caseItem, onUpdate }) => {
  const handleToggle = (value: string) => {
    const field = PRODUCT_FIELD_MAP[value];
    if (!field) return;
    onUpdate({ [field]: !caseItem[field] } as Partial<ClinicalCase>);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">사용 제품</h3>
      <div className="grid grid-cols-2 gap-2">
        {SYSTEM_OPTIONS.products.map(opt => {
          const field = PRODUCT_FIELD_MAP[opt.value];
          if (!field) return null;
          const checked = caseItem[field] as boolean | undefined;
          return (
            <label key={opt.value} className="flex items-center space-x-2 text-sm">
              <Checkbox
                checked={!!checked}
                onCheckedChange={() => handleToggle(opt.value)}
                id={`product-${opt.value}`}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
