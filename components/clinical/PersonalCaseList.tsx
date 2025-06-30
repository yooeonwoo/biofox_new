'use client';

import React from 'react';
import { CaseCard } from '@/components/clinical/CaseCard';

// Personal 케이스 핸들러 타입 정의
interface PersonalHandlers {
  handleConsentChange: (caseId: string, consent: boolean) => void;
  handleCaseStatusChange: (caseId: string, status: 'active' | 'completed') => void;
  handleDeleteCase: (caseId: string) => void;
  refreshCases: () => void;
  handleSaveAll: (caseId: string) => Promise<void>;
  handleBasicCustomerInfoUpdate: (caseId: string, info: any) => void;
  handleRoundCustomerInfoUpdate: (caseId: string, roundDay: number, info: any) => void;
  updateCaseCheckboxes: () => void;
}

interface PersonalCaseListProps {
  cases: any[];
  currentRound: number;
  saveStatus: Record<string, 'idle' | 'saving' | 'saved' | 'error'>;
  numberVisibleCards: Set<string>;
  isNewPersonalCase: (caseId: string) => boolean;
  setIsComposing: (composing: boolean) => void;
  setCases: React.Dispatch<React.SetStateAction<any[]>>;
  handlers: PersonalHandlers;
}

export const PersonalCaseList: React.FC<PersonalCaseListProps> = ({
  cases,
  currentRound,
  saveStatus,
  numberVisibleCards,
  isNewPersonalCase,
  setIsComposing,
  setCases,
  handlers
}) => {
  return (
    <>
      {cases.map((case_, index) => {
        // Personal용 핸들러 객체 생성
        const personalHandlers = {
          handleConsentChange: (caseId: string, consent: boolean) => 
            handlers.handleConsentChange(caseId, consent),
          handleCaseStatusChange: (caseId: string, status: 'active' | 'completed') => 
            handlers.handleCaseStatusChange(caseId, status),
          handleDeleteCase: (caseId: string) => {
            // Personal 케이스 삭제는 새 케이스만 가능
            if (isNewPersonalCase(caseId)) {
              setCases(prev => prev.filter(c => c.id !== caseId));
              // hasUnsavedPersonalCase 상태는 상위 컴포넌트에서 관리
            }
          },
          refreshCases: handlers.refreshCases,
          handleSaveAll: handlers.handleSaveAll,
          handleBasicCustomerInfoUpdate: handlers.handleBasicCustomerInfoUpdate,
          handleRoundCustomerInfoUpdate: handlers.handleRoundCustomerInfoUpdate,
          updateCaseCheckboxes: handlers.updateCaseCheckboxes,
        };

        return (
          <CaseCard
            key={case_.id}
            case_={case_}
            index={index}
            currentRounds={{ [case_.id]: currentRound }}
            saveStatus={saveStatus}
            numberVisibleCards={numberVisibleCards}
            isNewCustomer={isNewPersonalCase}
            setIsComposing={setIsComposing}
            setCases={setCases}
            handlers={personalHandlers}
            totalCases={cases.length}
          />
        );
      })}
    </>
  );
}; 