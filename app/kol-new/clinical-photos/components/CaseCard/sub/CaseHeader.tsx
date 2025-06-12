import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ClinicalCase } from '@/app/kol-new/clinical-photos/types';
import { XIcon } from 'lucide-react';

interface CaseHeaderProps {
  caseItem: ClinicalCase;
  showDelete?: boolean;
  onDelete?: (caseId: number) => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ caseItem, showDelete = false, onDelete }) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-2">
      <CardTitle className="text-lg font-medium truncate">
        {caseItem.caseName || caseItem.customerName}
      </CardTitle>

      {showDelete && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="delete case"
          onClick={() => onDelete?.(caseItem.id)}
        >
          <XIcon className="w-4 h-4 text-red-500" />
        </Button>
      )}
    </CardHeader>
  );
}; 