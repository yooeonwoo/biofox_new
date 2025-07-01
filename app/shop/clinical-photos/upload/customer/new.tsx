import React from 'react';
import { useCaseManagement } from '@/app/shop/clinical-photos/hooks/useCaseManagement';
import CaseCard from '@/app/shop/clinical-photos/components/CaseCard';
import { LoadingState } from '@/components/ui/loading';
import { updateCase, deleteCase, createCase } from '@/lib/clinical-photos-api';

export default function CustomerClinicalUploadPageRefactor() {
  const { cases, loading, refresh, setCases } = useCaseManagement('customer');

  const handleAddCustomer = async () => {
    const newCase = await createCase({
      customerName: '',
      caseName: '신규 케이스',
    });
    if (newCase) {
      setCases(prev => [newCase, ...prev]);
    }
  };

  const handleDelete = async (caseId: number) => {
    await deleteCase(caseId);
    refresh();
  };

  if (loading) {
    return <LoadingState title="고객 케이스 로딩 중" />;
  }

  return (
    <div className="flex flex-col items-center py-8 space-y-6">
      <button onClick={handleAddCustomer} className="px-4 py-2 rounded bg-primary text-white mb-4">+ 새 고객 추가</button>

      {cases.map((caseItem) => (
        <CaseCard
          key={caseItem.id}
          type="customer"
          case={caseItem}
          editableName={true}
          showDelete={true}
          onUpdate={async (caseId, updates) => {
            await updateCase(caseId, updates);
            refresh();
          }}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
} 