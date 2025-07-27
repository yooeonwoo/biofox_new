'use client';

import React, { useState, useRef } from 'react';
import { PageHeader } from '@/components/clinical/PageHeader';
import { LoadingScreen } from '@/components/clinical/LoadingScreen';
import { EmptyStateCard } from '@/components/clinical/EmptyStateCard';
import { CaseCard } from '@/components/clinical/CaseCard';
import { CaseInfoMessage } from '@/components/clinical/CaseInfoMessage';
import { LOADING_MESSAGES, EMPTY_STATE, INFO_MESSAGES, BUTTON_TEXTS } from '@/constants/ui';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useClinicalPhotosManager } from '../../hooks/useClinicalPhotosManager';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

export default function PersonalPage() {
  // 인증 정보 가져오기
  const { profile, profileId } = useCurrentProfile();

  // 중앙 데이터 관리 훅 사용
  const { data, actions } = useClinicalPhotosManager({
    profileId: profileId as Id<'profiles'> | undefined,
  });

  // 로컬 상태
  const [currentRound, setCurrentRound] = useState(1);
  const [saveStatus, setSaveStatus] = useState<{
    [caseId: string]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  // 본인 케이스만 필터링
  const personalCase = data.cases.find(c => c.name?.trim() === '본인');
  const personal = personalCase ? [personalCase] : [];

  // 본인 케이스 생성 핸들러
  const handleCreatePersonalCase = async () => {
    try {
      await actions.createCase({
        name: '본인',
        subject_type: 'self',
        consent_status: 'pending',
      });
      toast.success('본인 케이스가 생성되었습니다');
    } catch (error) {
      toast.error('케이스 생성 실패');
    }
  };

  // 표준 CaseCard를 위한 handlers 객체 생성
  const createHandlers = (caseData: any) => ({
    handleConsentChange: async (caseId: string, received: boolean) => {
      await actions.updateCase({
        caseId: caseId as Id<'clinical_cases'>,
        updates: { consent_status: received ? 'consented' : 'no_consent' },
      });
    },
    handleCaseStatusChange: async (caseId: string, status: 'active' | 'completed') => {
      const mappedStatus = status === 'active' ? 'in_progress' : 'completed';
      await actions.updateCaseStatus({
        caseId: caseId as Id<'clinical_cases'>,
        status: mappedStatus as 'in_progress' | 'completed',
      });
    },
    handleDeleteCase: async (caseId: string) => {
      toast.error('본인 케이스는 삭제할 수 없습니다');
    },
    refreshCases: () => {
      // Convex는 자동으로 리프레시되므로 아무 작업 필요 없음
    },
    handleSaveAll: async (caseId: string) => {
      setSaveStatus(prev => ({ ...prev, [caseId]: 'saving' }));
      try {
        // 자동 저장이므로 실제 저장 작업은 없음
        setSaveStatus(prev => ({ ...prev, [caseId]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [caseId]: 'idle' }));
        }, 2000);
      } catch (error) {
        setSaveStatus(prev => ({ ...prev, [caseId]: 'error' }));
      }
    },
    handleBasicCustomerInfoUpdate: async (caseId: string, info: any) => {
      await actions.updateCase({
        caseId: caseId as Id<'clinical_cases'>,
        updates: {
          name: info.name,
          age: info.age,
          gender: info.gender,
        },
      });
    },
    handleRoundCustomerInfoUpdate: async (caseId: string, round: number, info: any) => {
      await actions.saveRoundCustomerInfo({
        caseId: caseId as Id<'clinical_cases'>,
        roundNumber: round,
        info: {
          treatmentDate: info.date,
          treatmentType: info.treatmentType,
          products: info.products,
          skinTypes: info.skinTypes,
          memo: info.memo,
        },
      });
    },
    handlePhotoUpload: async (caseId: string, roundDay: number, angle: string, file: File) => {
      await actions.uploadPhoto({
        caseId: caseId as Id<'clinical_cases'>,
        roundDay,
        angle,
        file,
      });
    },
    handlePhotoDelete: async (caseId: string, roundDay: number, angle: string) => {
      // TODO: 사진 삭제 로직 구현 필요
      toast.error('사진 삭제 기능은 준비 중입니다.');
    },
    setCurrentRounds: (fn: any) =>
      setCurrentRound(fn((prev: any) => ({ ...prev, [caseData._id]: currentRound }))[caseData._id]),
  });

  // 로딩 중인 경우
  if (!profile || data.isLoading) {
    return <LoadingScreen title={LOADING_MESSAGES.personal.title} />;
  }

  return (
    <div>
      <PageHeader
        title="임상 관리 (본인)"
        backPath="/kol-new/clinical-photos"
        showAddButton={false}
      />

      <main ref={mainContentRef} className="mx-auto w-full px-3 sm:max-w-2xl sm:px-6">
        <CaseInfoMessage message={INFO_MESSAGES.personalCaseLimit} />

        {personal.length === 0 ? (
          <div className="mt-8">
            <EmptyStateCard
              title={EMPTY_STATE.noPersonalCases.title}
              description={EMPTY_STATE.noPersonalCases.description}
              buttonText={BUTTON_TEXTS.addPersonalCase}
              onButtonClick={handleCreatePersonalCase}
            />
          </div>
        ) : (
          <div className="mt-6">
            {personal.map((caseData, index) => (
              <CaseCard
                key={caseData._id}
                case_={caseData}
                index={index}
                currentRounds={{ [caseData._id as string]: currentRound }}
                saveStatus={saveStatus}
                numberVisibleCards={numberVisibleCards}
                isNewCustomer={() => false}
                setIsComposing={setIsComposing}
                setCases={() => {}} // Convex는 자동으로 업데이트
                handlers={createHandlers(caseData)}
                totalCases={1}
                profileId={profileId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
