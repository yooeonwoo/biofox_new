import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CaseCardProps } from '@/app/kol-new/clinical-photos/types';
import { CaseHeader } from './sub/CaseHeader';
import { CustomerInfoSection } from './sub/CustomerInfoSection';
import { PhotoSection } from './sub/PhotoSection';
import { ProductSection } from './sub/ProductSection';
import { SkinTypeSection } from './sub/SkinTypeSection';
import { MemoSection } from './sub/MemoSection';
// TODO: 추가 Section 컴포넌트 import

export const CaseCard: React.FC<CaseCardProps> = ({
  type,
  case: caseData,
  editableName = true,
  showDelete = false,
  showNewBadge = false,
  onUpdate,
  onDelete,
}) => {
  return (
    <Card
      variant={type === 'personal' ? 'glass-light' : 'default'}
      className="mx-auto mb-6 w-full max-w-2xl"
    >
      <CaseHeader caseItem={caseData} showDelete={showDelete} onDelete={onDelete} />

      <CardContent className="space-y-4">
        {/* 사진 / 회차 업로드 */}
        <PhotoSection
          caseId={caseData.id}
          isCompleted={caseData.status === 'completed' || caseData.status === 'archived'}
        />

        {/* 고객 정보 입력 섹션 */}
        <CustomerInfoSection
          caseItem={caseData}
          editableName={editableName}
          onUpdate={(updates: Partial<typeof caseData>) => onUpdate(caseData.id, updates)}
        />
        <ProductSection caseItem={caseData} onUpdate={updates => onUpdate(caseData.id, updates)} />
        <SkinTypeSection caseItem={caseData} onUpdate={updates => onUpdate(caseData.id, updates)} />
        <MemoSection caseItem={caseData} onUpdate={updates => onUpdate(caseData.id, updates)} />
      </CardContent>
    </Card>
  );
};

export default CaseCard;
