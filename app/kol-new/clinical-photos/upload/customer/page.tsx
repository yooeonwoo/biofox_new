'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/clinical/PageHeader';
import { CaseCard } from '@/components/clinical/CaseCard';
import { useClinicalPhotosManager } from '../../hooks/useClinicalPhotosManager';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

export default function CustomerClinicalUploadPage() {
  // 인증 정보 가져오기
  const { profile, profileId } = useCurrentProfile();

  // 중앙 데이터 관리 훅 사용
  const { data, actions } = useClinicalPhotosManager({
    profileId: profileId as Id<'profiles'> | undefined,
  });

  // 로컬 상태
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const [saveStatus, setSaveStatus] = useState<{
    [caseId: string]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  // 고객 케이스만 필터링
  const customerCases = data.cases.filter(c => c.subject_type === 'customer');

  // 새 고객 추가 핸들러
  const handleAddCustomer = async () => {
    try {
      await actions.createCase({
        subject_type: 'customer',
        consent_status: 'pending',
      });
      toast.success('새 고객 케이스가 추가되었습니다');
    } catch (error) {
      toast.error('고객 추가 실패');
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
      if (confirm('정말로 이 케이스를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
        await actions.deleteCase({ caseId: caseId as Id<'clinical_cases'> });
      }
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
    setCurrentRounds,
    updateCaseCheckboxes: () => {}, // 더 이상 필요하지 않음
  });

  // 새 고객 여부 확인
  const isNewCustomer = (caseId: string) => {
    const caseData = customerCases.find(c => c._id === caseId);
    return caseData
      ? !caseData.customerInfo?.name || caseData.customerInfo.name === '새 고객'
      : true;
  };

  // 케이스 업데이트를 위한 빈 함수 (Convex는 자동으로 업데이트)
  const setCases = () => {};

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!profile || data.isLoading) {
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
    <div>
      {/* 헤더를 main 밖으로 이동하여 전체 너비 활용 */}
      <PageHeader
        onAddCustomer={handleAddCustomer}
        title="임상 관리 (고객)"
        backPath="/kol-new/clinical-photos"
        showAddButton={true}
      />

      {/* Legacy의 반응형 스타일 적용 - 메인 컨테이너 */}
      <main ref={mainContentRef} className="mx-auto w-full xs:max-w-[95%] sm:max-w-2xl">
        {/* 기존 케이스들 */}
        <LayoutGroup>
          {/* 메인 컨텐츠 - Legacy 반응형 패딩과 간격 적용 */}
          <div className="space-y-4 p-3 xs:space-y-5 xs:p-4 md:px-0 md:py-6">
            <AnimatePresence mode="popLayout">
              {customerCases.length > 0 ? (
                customerCases.map((case_, index) => (
                  <CaseCard
                    key={case_._id}
                    case_={case_}
                    index={index}
                    currentRounds={currentRounds}
                    saveStatus={saveStatus}
                    numberVisibleCards={numberVisibleCards}
                    isNewCustomer={isNewCustomer}
                    setIsComposing={setIsComposing}
                    setCases={setCases}
                    handlers={createHandlers(case_)}
                    totalCases={customerCases.length}
                    profileId={profileId}
                  />
                ))
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
