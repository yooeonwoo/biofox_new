import React from 'react';
import { useCaseManagement } from '@/app/kol-new/clinical-photos/hooks/useCaseManagement';
import { usePhotoManagement } from '@/app/kol-new/clinical-photos/hooks/usePhotoManagement';
import { CaseCard } from '@/app/kol-new/clinical-photos/components/CaseCard';
import { LoadingState } from '@/components/ui/loading';
import { useUpdateClinicalCaseStatus } from '@/lib/clinical-photos-convex';
import { toast } from 'sonner';

export default function PersonalClinicalUploadPageRefactor() {
  const { cases, loading, refresh } = useCaseManagement('personal');
  const { handlePhotoUpload, handlePhotoDelete } = usePhotoManagement();
  const updateCaseStatus = useUpdateClinicalCaseStatus();

  if (loading) {
    return <LoadingState title="본인 케이스 로딩 중" />;
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      {cases.map(caseItem => (
        <CaseCard
          key={caseItem.id}
          type="personal"
          case={caseItem}
          editableName={false}
          showDelete={false}
          onUpdate={async (caseId, updates) => {
            try {
              // Convex ID로 변환 (임시)
              const convexCaseId = caseItem.id; // 실제로는 Convex ID여야 함

              if (updates.status) {
                // 상태 매핑
                const statusMap: Record<string, any> = {
                  active: 'in_progress',
                  completed: 'completed',
                  archived: 'cancelled',
                };

                await updateCaseStatus.mutateAsync({
                  caseId: convexCaseId,
                  status: statusMap[updates.status] || 'in_progress',
                });
              }

              refresh();
            } catch (error) {
              console.error('Failed to update case:', error);
              toast.error('케이스 업데이트에 실패했습니다.');
            }
          }}
        />
      ))}
    </div>
  );
}
