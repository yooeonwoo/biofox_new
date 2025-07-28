'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClinicalPhotosManager } from '../../hooks/useClinicalPhotosManager';
import CaseCard from '../../components/CaseCard';
import { Button } from '@/components/ui/button';
import { Plus, Camera } from 'lucide-react';
import type { ClinicalCase } from '@/types/clinical';

function CustomerClinicalUploadContent() {
  const { user, profile } = useAuth();

  // 사용자가 없으면 로딩 상태 표시
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // useClinicalPhotosManager에 profile의 Convex ID를 우선 사용
  const { data, actions } = useClinicalPhotosManager({
    profileId: profile?._id || user.id, // profile이 있으면 Convex ID 사용, 없으면 UUID 사용
  });

  const handleAddCustomer = async () => {
    try {
      await actions.createCase({
        name: '새 고객',
        subject_type: 'customer',
        consent_status: 'pending',
      });
    } catch (error) {
      console.error('고객 추가 실패:', error);
    }
  };

  const createHandlers = (caseData: any) => ({
    onUpdate: async (caseId: string, updates: Partial<ClinicalCase>) => {
      try {
        await actions.updateCase({
          caseId: caseId as any,
          updates: updates as any,
        });
      } catch (error) {
        console.error('케이스 업데이트 실패:', error);
      }
    },
    onDelete: async (caseId: string) => {
      try {
        await actions.deleteCase({ caseId: caseId as any });
      } catch (error) {
        console.error('케이스 삭제 실패:', error);
      }
    },
  });

  const isNewCustomer = (caseId: string) => {
    return false; // 단순화를 위해 항상 false
  };

  const setCases = () => {};

  // 고객 케이스만 필터링
  const customerCases = data.cases.filter(c => c.subject_type === 'customer');

  if (data.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객 임상 관리</h1>
          <p className="mt-1 text-sm text-gray-600">고객 케이스 {customerCases.length}건</p>
        </div>

        <Button onClick={handleAddCustomer} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          고객 추가
        </Button>
      </div>

      {/* 고객 케이스 리스트 */}
      {customerCases.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 고객 케이스가 없습니다</h3>
          <p className="mb-4 text-gray-600">첫 번째 고객 임상 케이스를 등록해보세요.</p>
          <Button onClick={handleAddCustomer} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            고객 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {customerCases.map(caseData => (
            <CaseCard
              key={caseData._id || caseData.id || Math.random().toString()}
              type="customer"
              case={
                {
                  ...caseData,
                  id: caseData._id || caseData.id || '', // id 필드 보장
                } as any
              }
              editableName={true}
              showDelete={true}
              showNewBadge={isNewCustomer(caseData._id || caseData.id || '')}
              {...createHandlers(caseData)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerClinicalUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <CustomerClinicalUploadContent />
    </Suspense>
  );
}
