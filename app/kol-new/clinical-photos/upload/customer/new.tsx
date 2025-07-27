import React from 'react';
import { useCaseManagement } from '@/app/kol-new/clinical-photos/hooks/useCaseManagement';
import CaseCard from '@/app/kol-new/clinical-photos/components/CaseCard';
import { LoadingState } from '@/components/ui/loading';
import { useCreateClinicalCase, useDeleteClinicalCase } from '@/lib/clinical-photos-convex';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function CustomerClinicalUploadPageRefactor() {
  const { cases, loading, refresh } = useCaseManagement('customer');
  const createCase = useCreateClinicalCase();
  const deleteCase = useDeleteClinicalCase();
  const updateCase = useMutation(api.clinical.updateClinicalCase);

  const handleAddCustomer = async () => {
    await createCase.mutateAsync({
      customerName: '새 고객',
      caseName: '신규 케이스',
      consentReceived: false,
    });
    refresh();
  };

  const handleDelete = async (caseId: string) => {
    await deleteCase.mutateAsync(caseId);
  };

  if (loading) {
    return <LoadingState title="고객 케이스 로딩 중" />;
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <button onClick={handleAddCustomer} className="mb-4 rounded bg-primary px-4 py-2 text-white">
        + 새 고객 추가
      </button>

      {cases.map(caseItem => (
        <CaseCard
          key={caseItem.id}
          type="customer"
          case={caseItem}
          editableName={true}
          showDelete={true}
          onUpdate={async (caseId, updates) => {
            await updateCase({
              caseId: caseId as Id<'clinical_cases'>,
              updates: updates as any,
            });
          }}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
