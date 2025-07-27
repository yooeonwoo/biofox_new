'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerCaseHandlers } from '@/hooks/useCustomerCaseHandlers';
import { useCustomerPageState } from '@/hooks/useCustomerPageState';
import { PageHeader } from '@/components/clinical/PageHeader';
import { CaseCard } from '@/components/clinical/CaseCard';
import { createSaveStatusUtils, createEnqueueUtil, createDebounceUtil } from '@/utils/customer';
import type { RoundCustomerInfo } from '@/types/clinical';

// 중복된 타입 정의들은 /src/types/clinical.ts로 이동되었습니다.

export default function CustomerClinicalUploadPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    }
  }, [authUser, authLoading, router]);

  // 모든 상태와 사이드 이펙트를 커스텀 훅으로 분리
  const {
    // States (only used ones)
    user,
    isLoading,
    cases,
    setCases,
    currentRounds,
    setCurrentRounds,
    numberVisibleCards,
    isComposing,
    setIsComposing,
    inputDebounceTimers,
    setInputDebounceTimers,
    saveStatus,
    setSaveStatus,

    // Refs (only used ones)
    mainContentRef,
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
    profileId: profile?._id, // profileId 추가
  });

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (authLoading || !profile || !user || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              고객 임상사진 페이지를 준비하는 중입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더를 main 밖으로 이동하여 전체 너비 활용 */}
      <PageHeader
        onAddCustomer={handleAddCustomer}
        title="임상 관리 (고객)"
        backPath="/shop/clinical-photos"
        showAddButton={true}
      />

      {/* Legacy의 반응형 스타일 적용 - 메인 컨테이너 */}
      <main ref={mainContentRef} className="mx-auto w-full xs:max-w-[95%] sm:max-w-2xl">
        {/* 기존 케이스들 */}
        <LayoutGroup>
          {/* 메인 컨텐츠 - Legacy 반응형 패딩과 간격 적용 */}
          <div className="space-y-4 p-3 xs:space-y-5 xs:p-4 md:px-0 md:py-6">
            <AnimatePresence mode="popLayout">
              {cases.length > 0 ? (
                cases.map((case_, index) => {
                  // 핸들러 객체 생성 (CaseCard 시그니처에 맞게 래핑)
                  const handlers = {
                    handleConsentChange,
                    handleCaseStatusChange,
                    handleDeleteCase,
                    refreshCases,
                    handleSaveAll,
                    handleBasicCustomerInfoUpdate: (caseId: string, info: any) => {
                      // CaseCard가 객체로 전달하므로 각 필드별로 호출
                      if (info.name !== undefined)
                        handleBasicCustomerInfoUpdate(caseId, 'name', info.name);
                      if (info.age !== undefined)
                        handleBasicCustomerInfoUpdate(caseId, 'age', info.age);
                      if (info.gender !== undefined)
                        handleBasicCustomerInfoUpdate(caseId, 'gender', info.gender);
                    },
                    handleRoundCustomerInfoUpdate: (caseId: string, round: number, info: any) => {
                      // CaseCard가 객체로 전달하므로 각 필드별로 호출
                      Object.keys(info).forEach(field => {
                        handleRoundCustomerInfoUpdate(
                          caseId,
                          round,
                          field as keyof RoundCustomerInfo,
                          info[field],
                          currentRounds
                        );
                      });
                    },
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
                      isNewCustomer={() => false}
                      setIsComposing={setIsComposing}
                      setCases={setCases}
                      handlers={handlers}
                      totalCases={cases.length}
                      profileId={profile?._id}
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
                      <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        등록된 고객 케이스가 없습니다
                      </h3>
                      <p className="mb-4 text-gray-500">
                        위 버튼을 사용해서 첫 번째 고객 케이스를 등록해보세요
                      </p>
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
