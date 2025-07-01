'use client';

import React from 'react';
import { usePersonalPageState } from '@/hooks/usePersonalPageState';
import { usePersonalCaseHandlers } from '@/hooks/usePersonalCaseHandlers';
import { useSerialQueue } from '@/hooks/useSerialQueue';
import { PageHeader } from '@/components/clinical/PageHeader';
import { LoadingScreen } from '@/components/clinical/LoadingScreen';
import { EmptyStateCard } from '@/components/clinical/EmptyStateCard';
import { PersonalCaseList } from '@/components/clinical/PersonalCaseList';
import { CaseInfoMessage } from '@/components/clinical/CaseInfoMessage';
import { LOADING_MESSAGES, EMPTY_STATE, INFO_MESSAGES, BUTTON_TEXTS } from '@/constants/ui';

export default function PersonalPage() {
  // Personal용 상태 관리 훅
  const pageState = usePersonalPageState({ initialRound: 1 });
  
  // 큐 관리
  const { enqueue } = useSerialQueue();
  
  // 디바운스 업데이트 함수
  const debouncedUpdate = (key: string, updateFn: () => void, delay = 300) => {
    setTimeout(updateFn, delay);
  };
  
  // 상태 관리 함수들
  const markSaving = (caseId: string) => {
    pageState.setSaveStatus(prev => ({ ...prev, [caseId]: 'saving' }));
  };
  
  const markSaved = (caseId: string) => {
    pageState.setSaveStatus(prev => ({ ...prev, [caseId]: 'saved' }));
  };
  
  const markError = (caseId: string) => {
    pageState.setSaveStatus(prev => ({ ...prev, [caseId]: 'error' }));
  };

  // Personal용 핸들러 훅
  const handlers = usePersonalCaseHandlers({
    user: pageState.user,
    cases: pageState.cases,
    setCases: pageState.setCases,
    currentRound: pageState.currentRound,
    setCurrentRound: pageState.setCurrentRound,
    isComposing: pageState.isComposing,
    debouncedUpdate,
    saveStatus: pageState.saveStatus,
    markSaving,
    markSaved,
    markError,
    enqueue: async (caseId: string, task: () => Promise<void>) => {
      await enqueue(caseId, task);
    },
    hasUnsavedPersonalCase: pageState.hasUnsavedPersonalCase,
    setHasUnsavedPersonalCase: pageState.setHasUnsavedPersonalCase,
  });

  // 로딩 상태
  if (pageState.isLoading) {
    return (
      <LoadingScreen 
        title={LOADING_MESSAGES.personal.title}
        description={LOADING_MESSAGES.personal.description}
      />
    );
  }

  return (
    <div>
      {/* 헤더를 main 밖으로 이동하여 전체 너비 활용 */}
      <PageHeader
        onAddCustomer={handlers.handleAddPersonalCase}
        hasUnsavedNewCustomer={pageState.hasUnsavedPersonalCase}
      />
      
      {/* Legacy의 반응형 스타일 적용 - 메인 컨테이너 */}
      <main ref={pageState.mainContentRef} className="mx-auto w-full xs:max-w-[95%] sm:max-w-2xl">
        {/* 메인 컨텐츠 - Legacy 반응형 패딩과 간격 적용 */}
        <div className="space-y-4 xs:space-y-5 p-3 xs:p-4 md:px-0 md:py-6">
          {/* 케이스가 없을 때 */}
          {pageState.cases.length === 0 && (
            <EmptyStateCard
              title={EMPTY_STATE.noPersonalCases.title}
              description={EMPTY_STATE.noPersonalCases.description}
              buttonText={BUTTON_TEXTS.addPersonalCase}
              onButtonClick={handlers.handleAddPersonalCase}
            />
          )}

          {/* 케이스 목록 */}
          {pageState.cases.length > 0 && (
            <PersonalCaseList
              cases={pageState.cases}
              currentRound={pageState.currentRound}
              saveStatus={pageState.saveStatus}
              numberVisibleCards={pageState.numberVisibleCards}
              isNewPersonalCase={handlers.isNewPersonalCase}
              setIsComposing={pageState.setIsComposing}
              setCases={pageState.setCases}
              handlers={{
                handleConsentChange: handlers.handleConsentChange,
                handleCaseStatusChange: handlers.handleCaseStatusChange,
                handleDeleteCase: (caseId: string) => {
                  // Personal 케이스 삭제는 새 케이스만 가능
                  if (handlers.isNewPersonalCase(caseId)) {
                    pageState.setCases(prev => prev.filter(c => c.id !== caseId));
                    pageState.setHasUnsavedPersonalCase(false);
                  }
                },
                refreshCases: () => {
                  // Personal 케이스 새로고침
                  window.location.reload();
                },
                handleSaveAll: async (caseId: string) => {
                  console.log('Personal 케이스 저장:', caseId);
                },
                handleBasicCustomerInfoUpdate: handlers.handleBasicPersonalInfoUpdate,
                handleRoundCustomerInfoUpdate: handlers.handleRoundPersonalInfoUpdate,
                updateCaseCheckboxes: () => {
                  // Personal에서는 체크박스 업데이트 미구현
                  console.log('Personal 체크박스 업데이트');
                },
              }}
            />
          )}

          {/* 케이스가 이미 있는 경우 메시지 */}
          {pageState.cases.length > 0 && pageState.cases.some(c => handlers.isNewPersonalCase(c.id)) && (
            <CaseInfoMessage 
              message={INFO_MESSAGES.personalCaseLimit}
              type="info"
            />
          )}
        </div>
      </main>
    </div>
  );
}