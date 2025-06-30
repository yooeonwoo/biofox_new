'use client';

import { useEffect, useState, useRef } from 'react';
import { checkAuthSupabase } from '@/lib/auth';
import { useClinicalCases, useUpdateCase } from '@/hooks/useClinicalCases';
import { useCaseSerialQueues } from '@/hooks/useSerialQueue';
import { SYSTEM_OPTIONS, safeParseStringArray } from '@/types/clinical';
import type { ClinicalCase, CustomerInfo, RoundCustomerInfo, PhotoSlot, KolInfo, CaseStatus } from '@/types/clinical';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft, Camera, Plus, Calendar, User, Scissors, Eye, Trash2, Edit, Save } from "lucide-react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PhotoRoundCarousel from "../../components/PhotoRoundCarousel";
import CaseStatusTabs from "../../components/CaseStatusTabs";
import { PhotoUploader } from '@/components/clinical/PhotoUploader';
import { ConsentUploader } from '@/components/clinical/ConsentUploader';
import { useCustomerCaseHandlers } from '@/hooks/useCustomerCaseHandlers';
import { useCustomerPageState } from '@/hooks/useCustomerPageState';
import { PageHeader } from '@/components/clinical/PageHeader';
import { CaseCard } from '@/components/clinical/CaseCard';

// 중복된 타입 정의들은 /src/types/clinical.ts로 이동되었습니다.

export default function CustomerClinicalUploadPage() {
  // 모든 상태와 사이드 이펙트를 커스텀 훅으로 분리
  const {
    // States
    user,
    setUser,
    isLoading,
    setIsLoading,
    cases,
    setCases,
    currentRounds,
    setCurrentRounds,
    hasUnsavedNewCustomer,
    setHasUnsavedNewCustomer,
    numberVisibleCards,
    setNumberVisibleCards,
    isComposing,
    setIsComposing,
    inputDebounceTimers,
    setInputDebounceTimers,
    isUserInteracting,
    setIsUserInteracting,
    saveStatus,
    setSaveStatus,
    
    // Refs
    userActivityTimeoutRef,
    mainContentRef,
    casesRef,
    
    // Helper functions
    isNewCustomer,
  } = useCustomerPageState();

  const markSaving = (caseId:string) => setSaveStatus(prev=>({...prev,[caseId]:'saving'}));
  const markSaved = (caseId:string) => {
    setSaveStatus(prev=>({...prev,[caseId]:'saved'}));
    setTimeout(()=>{
      setSaveStatus(prev=>({...prev,[caseId]:'idle'}));
    },2000);
  };
  const markError = (caseId:string) => setSaveStatus(prev=>({...prev,[caseId]:'error'}));

  // -------- 직렬화용 Promise Queue 추가 --------
  const updateQueue = useRef<Record<string, Promise<void>>>({});
  const enqueue = (caseId:string, task:()=>Promise<void>) => {
    updateQueue.current[caseId] = (updateQueue.current[caseId] ?? Promise.resolve())
      .then(task)
      .catch(err => { console.error('enqueue error', err); });
    return updateQueue.current[caseId];
  };
  // ---------------------------------------------

  // debounce 함수 (영어/숫자/특수문자 입력 문제 해결)
  const debouncedUpdate = (key: string, updateFn: () => void, delay: number = 500) => {
    // 기존 타이머 클리어
    if (inputDebounceTimers[key]) {
      clearTimeout(inputDebounceTimers[key]);
    }
    
    // 새 타이머 설정
    const newTimer = setTimeout(() => {
      updateFn();
      // 타이머 정리
      setInputDebounceTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[key];
        return newTimers;
      });
    }, delay);
    
    setInputDebounceTimers(prev => ({ ...prev, [key]: newTimer }));
  };

  // 커스텀 훅으로 모든 핸들러 함수 가져오기
  const {
    handleSignOut,
    handleCaseStatusChange,
    handleConsentChange,
    handlePhotoUpload,
    handlePhotoDelete,
    handleBasicCustomerInfoUpdate,
    handleRoundCustomerInfoUpdate,
    updateCaseCheckboxes,
    handleCurrentRoundChange,
    refreshCases,
    handleAddCustomer,
    handleSaveNewCustomer,
    handleDeleteCase,
    handleDeleteNewCustomer,
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