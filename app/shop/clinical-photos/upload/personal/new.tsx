import React from 'react';
import { useCaseManagement } from '@/app/shop/clinical-photos/hooks/useCaseManagement';
import { usePhotoManagement } from '@/app/shop/clinical-photos/hooks/usePhotoManagement';
import { CaseCard } from '@/app/shop/clinical-photos/components/CaseCard';
import { LoadingState } from '@/components/ui/loading';
import { updateCase } from '@/lib/clinical-photos-api';

export default function PersonalClinicalUploadPageRefactor() {
  const { cases, loading, refresh } = useCaseManagement('personal');
  const { handlePhotoUpload, handlePhotoDelete } = usePhotoManagement();

  if (loading) {
    return <LoadingState title="본인 케이스 로딩 중" />;
  }

  return (
    <div className="flex flex-col items-center py-8 space-y-6">
      {cases.map((caseItem) => (
        <CaseCard
          key={caseItem.id}
          type="personal"
          case={caseItem}
          editableName={false}
          showDelete={false}
          onUpdate={async (caseId, updates) => {
            await updateCase(caseId, updates);
            refresh();
          }}
        />
      ))}
    </div>
  );
} 