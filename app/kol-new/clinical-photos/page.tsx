'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClinicalPhotosManager } from './hooks/useClinicalPhotosManager';
import CaseCard from './components/CaseCard';
import CustomerAddModal from './components/CustomerAddModal';
import CaseStatusTabs from './components/CaseStatusTabs';
import { Button } from '@/components/ui/button';
import { Plus, Camera } from 'lucide-react';
import type { ClinicalCase } from '@/types/clinical'; // 전역 타입 사용

function ClinicalPhotosContent() {
  const { user } = useAuth();

  // 사용자가 없으면 로딩 상태 표시
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const [statusFilter, setStatusFilter] = React.useState<'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // useClinicalPhotosManager에 user.id를 전달 (단순한 string ID 사용)
  const { data, actions } = useClinicalPhotosManager({
    profileId: user.id, // 단순하게 user.id를 string으로 사용
  });

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

  const handleAddCustomer = async (customerData: any) => {
    try {
      await actions.createCase({
        name: customerData.customerName,
        subject_type: 'customer',
        consent_status: customerData.consentReceived ? 'consented' : 'pending',
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('고객 추가 실패:', error);
    }
  };

  const handleCreatePersonalCase = async () => {
    try {
      await actions.createCase({
        name: '본인',
        subject_type: 'self',
        consent_status: 'pending',
      });
    } catch (error) {
      console.error('본인 케이스 생성 실패:', error);
    }
  };

  const isNewCustomer = (caseId: string) => {
    return false; // 단순화를 위해 항상 false
  };

  const filteredCases = data.cases.filter(c => c.status === statusFilter);
  const personalCases = filteredCases.filter(c => c.subject_type === 'self');
  const customerCases = filteredCases.filter(c => c.subject_type === 'customer');

  const activeCases = data.cases.filter(c => c.status === 'active');
  const completedCases = data.cases.filter(c => c.status === 'completed');

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
          <h1 className="text-2xl font-bold text-gray-900">임상 사진 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            전체 {data.cases.length}건 · 진행중 {activeCases.length}건 · 완료{' '}
            {completedCases.length}건
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CaseStatusTabs status={statusFilter} onStatusChange={setStatusFilter} />
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            고객 추가
          </Button>
        </div>
      </div>

      {/* 본인 케이스 섹션 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">내 임상 진행상황</h2>
        </div>

        {personalCases.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">아직 내 케이스가 없습니다</h3>
            <p className="mb-4 text-gray-600">
              본인의 임상 케이스를 등록하여 진행상황을 관리해보세요.
            </p>
            <Button onClick={handleCreatePersonalCase} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />내 케이스 등록하기
            </Button>
          </div>
        ) : (
          personalCases.map(caseData => (
            <CaseCard
              key={caseData._id || caseData.id || Math.random().toString()}
              type="personal"
              case={
                {
                  ...caseData,
                  id: caseData._id || caseData.id || '', // id 필드 보장
                } as any
              } // 타입 단순화를 위해 any 사용
              editableName={false}
              {...createHandlers(caseData)}
            />
          ))
        )}
      </div>

      {/* 고객 케이스 섹션 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">고객 임상 관리</h2>
          <p className="text-sm text-gray-500">전체 {customerCases.length}건</p>
        </div>

        {customerCases.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              등록된 고객 케이스가 없습니다
            </h3>
            <p className="mb-4 text-gray-600">고객의 임상 케이스를 등록하여 관리를 시작해보세요.</p>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
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
                } // 타입 단순화를 위해 any 사용
                editableName={true}
                showDelete={true}
                showNewBadge={isNewCustomer(caseData._id || caseData.id || '')}
                {...createHandlers(caseData)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 고객 추가 모달 */}
      <CustomerAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCustomer}
        profileId={user.id as any}
      />
    </div>
  );
}

export default function ClinicalPhotosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <ClinicalPhotosContent />
    </Suspense>
  );
}
