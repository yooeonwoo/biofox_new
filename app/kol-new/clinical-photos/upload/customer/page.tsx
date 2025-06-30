'use client';


import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerCaseHandlers } from '@/hooks/useCustomerCaseHandlers';
import { useCustomerPageState } from '@/hooks/useCustomerPageState';
import { PageHeader } from '@/components/clinical/PageHeader';
import { CaseCard } from '@/components/clinical/CaseCard';
import { createSaveStatusUtils, createEnqueueUtil, createDebounceUtil } from '@/utils/customer';

// 중복된 타입 정의들은 /src/types/clinical.ts로 이동되었습니다.

export default function CustomerClinicalUploadPage() {
  // 모든 상태와 사이드 이펙트를 커스텀 훅으로 분리
  const {
    // States (only used ones)
    user,
    isLoading,
    cases,
    setCases,
    currentRounds,
    setCurrentRounds,
    hasUnsavedNewCustomer,
    setHasUnsavedNewCustomer,
    numberVisibleCards,
    isComposing,
    setIsComposing,
    inputDebounceTimers,
    setInputDebounceTimers,
    saveStatus,
    setSaveStatus,
    
    // Refs (only used ones)
    mainContentRef,
    
    // Helper functions
    isNewCustomer,
  } = useCustomerPageState();

  // 유틸 함수들 생성
  const { markSaving, markSaved, markError } = createSaveStatusUtils(setSaveStatus);
  const { updateQueue, enqueue } = createEnqueueUtil();
  const { debouncedUpdate } = createDebounceUtil(inputDebounceTimers, setInputDebounceTimers);

  // 커스텀 훅으로 모든 핸들러 함수 가져오기 (사용하는 것만)
  const {
    handleCaseStatusChange,
    handleConsentChange,
    handleBasicCustomerInfoUpdate,
    handleRoundCustomerInfoUpdate,
    updateCaseCheckboxes,
    refreshCases,
    handleAddCustomer,
    handleDeleteCase,
    handleSaveAll,
  } = useCustomerCaseHandlers({
    user,
    cases,
    setCases,
    currentRounds,
    setCurrentRounds,
    isComposing,
    debouncedUpdate,
    saveStatus,
    markSaving,
    markSaved,
    markError,
    enqueue,
    hasUnsavedNewCustomer,
    setHasUnsavedNewCustomer,
  });

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">업로드 페이지를 준비하는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <main ref={mainContentRef} className="mx-auto max-w-4xl">
        {/* 뒤로가기 헤더 - 고정 */}
        <PageHeader
          onAddCustomer={handleAddCustomer}
          hasUnsavedNewCustomer={hasUnsavedNewCustomer}
        />

        {/* 기존 케이스들 */}
        <LayoutGroup>
          <div className="space-y-5 p-4 md:p-6 pt-6">
            <AnimatePresence mode="popLayout">
              {cases.length > 0 ? (
                cases.map((case_, index) => {
                  // 핸들러 객체 생성
                  const handlers = {
                    handleConsentChange,
                    handleCaseStatusChange,
                    handleDeleteCase,
                    refreshCases,
                    handleSaveAll,
                    handleBasicCustomerInfoUpdate,
                    handleRoundCustomerInfoUpdate,
                    updateCaseCheckboxes,
                  };

                  return (
                    <CaseCard
                      key={case_.id}
                      case_={case_}
                      index={index}
                      currentRounds={currentRounds}
                      saveStatus={saveStatus}
                      numberVisibleCards={numberVisibleCards}
                      isNewCustomer={isNewCustomer}
                      setIsComposing={setIsComposing}
                      setCases={setCases}
                      handlers={handlers}
                      totalCases={cases.length}
                    />
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 고객 케이스가 없습니다</h3>
                      <p className="text-gray-500 mb-4">위 버튼을 사용해서 첫 번째 고객 케이스를 등록해보세요</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </main>
    </div>
  );
}