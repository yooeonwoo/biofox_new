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
























  




  // 케이스 데이터 새로고침








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
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 px-4 md:px-6 border-b border-gray-100">
              <div className="flex items-center justify-center gap-16 max-w-2xl mx-auto">
                <div>
                  <Button variant="default" size="sm" asChild>
                    <Link href="/kol-new/clinical-photos">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      뒤로가기
                    </Link>
                  </Button>
                </div>
                
                {/* 새 고객 추가 버튼 */}
                <div className="flex flex-col items-center gap-1">
                  <Button 
                    onClick={handleAddCustomer}
                    className="flex items-center gap-2 bg-biofox-blue-violet hover:bg-biofox-dark-blue-violet text-white shadow-sm hover:shadow-md transition-all duration-200"
                    size="sm"
                    disabled={hasUnsavedNewCustomer}
                  >
                    <Plus className="h-4 w-4" />
                    새 고객 추가
                  </Button>
                  {hasUnsavedNewCustomer && (
                    <p className="text-xs text-orange-600 text-right whitespace-nowrap">
                      현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 기존 케이스들 */}
            <LayoutGroup>
              <div className="space-y-5 p-4 md:p-6 pt-6">
                <AnimatePresence mode="popLayout">
                  {cases.length > 0 ? (
                    cases.map((case_, index) => (
                      <motion.div
                        key={case_.id}
                        layout
                        initial={{ 
                          opacity: 0, 
                          y: 80, 
                          scale: 0.9,
                          rotateX: 15
                        }}
                        animate={{ 
                          opacity: 1,
                          y: 0, 
                          scale: 1,
                          rotateX: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          y: -80, 
                          scale: 0.9,
                          rotateX: -15
                        }}
                        transition={{
                          layout: { duration: 0.4, ease: "easeInOut" },
                          opacity: { duration: 0.3 },
                          y: { duration: 0.4, ease: "easeOut" },
                          scale: { duration: 0.3, ease: "easeOut" },
                          rotateX: { duration: 0.4, ease: "easeOut" }
                        }}
                        style={{
                          transformStyle: "preserve-3d",
                          perspective: 1000
                        }}
                      >
                        <Card 
                          data-case-id={case_.id}
                          className={`relative overflow-hidden border transition-all duration-200 shadow-sm hover:shadow-md rounded-xl ${
                            case_.status === 'completed' 
                              ? 'bg-gradient-to-r from-biofox-lavender/5 to-biofox-lavender/10 border-biofox-lavender/30' 
                              : 'bg-white hover:bg-gray-50/50 border-gray-100'
                          }`}
                        >
                          {/* 카드 배경 큰 번호 - 3초 후 자동 숨김 */}
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                            style={{ zIndex: 0 }}
                            initial={{ 
                              opacity: 0, 
                              scale: 0.3, 
                              rotate: -20,
                              y: 50
                            }}
                            animate={{ 
                              opacity: numberVisibleCards.has(case_.id) ? 0.6 : 0,
                              scale: numberVisibleCards.has(case_.id) ? 1 : 0.7,
                              rotate: numberVisibleCards.has(case_.id) ? 0 : -10,
                              y: numberVisibleCards.has(case_.id) ? 0 : 30
                            }}
                            transition={{ 
                              duration: 0.4, 
                              ease: "easeOut",
                              opacity: { 
                                duration: numberVisibleCards.has(case_.id) ? 0.2 : 0.4,
                                ease: numberVisibleCards.has(case_.id) ? "easeOut" : "easeIn"
                              },
                              scale: { duration: 0.3 },
                              rotate: { duration: 0.4 },
                              y: { duration: 0.3 }
                            }}
                          >
                            <motion.span 
                              className="text-[20rem] sm:text-[25rem] md:text-[30rem] lg:text-[35rem] font-black leading-none select-none"
                              animate={{
                                color: numberVisibleCards.has(case_.id) 
                                  ? "rgba(156, 163, 175, 0.5)" // gray-400/50 - 더 진하게
                                  : "rgba(209, 213, 219, 0.1)" // gray-300/10 - 더 연하게
                              }}
                              transition={{ 
                                duration: numberVisibleCards.has(case_.id) ? 0.2 : 0.4,
                                ease: numberVisibleCards.has(case_.id) ? "easeOut" : "easeIn"
                              }}
                            >
                              {cases.length - index}
                            </motion.span>
                          </motion.div>
                          
                          {/* 카드 내용 */}
                          <div className="relative" style={{ zIndex: 1 }}>
                    <CardHeader className="pb-4 bg-gray-50/30 rounded-t-xl">
                      {/* 첫 번째 줄: 고객이름 + 동의/미동의 + 진행중/완료 */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-9 w-9 bg-biofox-blue-violet text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm transform hover:scale-105 transition-transform">
                            {cases.length - index}
                          </div>
                          <span className="text-lg font-medium text-gray-800 truncate">{case_.customerName || '새 고객'}</span>
                          {isNewCustomer(case_.id) && (
                            <span className="text-xs bg-biofox-lavender/20 text-purple-700 px-2 py-1 rounded-full border border-biofox-lavender/40">
                              새 고객
                            </span>
                          )}
                          {/* 완료 상태인데 동의서가 없으면 경고 */}
                          {case_.status === 'completed' && case_.consentReceived && !case_.consentImageUrl && (
                            <span className="text-orange-500 flex-shrink-0">⚠️</span>
                          )}
                        </div>
                        
                        {/* 동의/미동의 탭 */}
                        <div className="flex bg-gray-100/70 p-1 rounded-lg flex-shrink-0">
                          <button
                            className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                              case_.consentReceived 
                                ? 'bg-white text-biofox-dark-blue-violet shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => handleConsentChange(case_.id, true)}
                          >
                            동의
                          </button>
                          <button
                            className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                              !case_.consentReceived 
                                ? 'bg-white text-biofox-dark-blue-violet shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => handleConsentChange(case_.id, false)}
                          >
                            미동의
                          </button>
                        </div>

                        {/* 진행중/완료 탭 */}
                        <CaseStatusTabs
                          status={case_.status as 'active' | 'completed'}
                          onStatusChange={(status) => handleCaseStatusChange(case_.id, status)}
                        />

                        {/* 삭제 버튼 */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" aria-label="케이스 삭제">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-sm bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>케이스 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                삭제하시면 이전 데이터는 복원되지 않습니다. 계속 삭제하시겠습니까?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={() => handleDeleteCase(case_.id)}>
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>


                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* 블록 1: 동의서 업로드 */}
                      {case_.consentReceived && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900">동의서 업로드</h3>
                          </div>
                          
                          <ConsentUploader
                            caseId={case_.id}
                            roundId={(currentRounds[case_.id] || 1).toString()}
                            onUploaded={() => refreshCases()}
                            disabled={case_.status === 'completed'}
                            className="max-w-md"
                          />
                        </div>
                      )}

                      {/* 블록 2: 임상사진 업로드 */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">임상사진 업로드</h3>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                            {currentRounds[case_.id] || 1}회차
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <PhotoUploader
                            caseId={case_.id}
                            roundId={(currentRounds[case_.id] || 1).toString()}
                            angle="front"
                            onUploaded={() => refreshCases()}
                            disabled={case_.status === 'completed'}
                          />
                          <PhotoUploader
                            caseId={case_.id}
                            roundId={(currentRounds[case_.id] || 1).toString()}
                            angle="left"
                            onUploaded={() => refreshCases()}
                            disabled={case_.status === 'completed'}
                          />
                          <PhotoUploader
                            caseId={case_.id}
                            roundId={(currentRounds[case_.id] || 1).toString()}
                            angle="right"
                            onUploaded={() => refreshCases()}
                            disabled={case_.status === 'completed'}
                          />
                        </div>
                      </div>
                      
                      {/* 블록 2: 고객 정보 */}
                      <div className="space-y-3 border-2 border-soksok-light-blue/40 rounded-lg p-4 bg-soksok-light-blue/20">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-blue-700">고객 정보</h3>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-soksok-light-blue/40">
                              {(currentRounds[case_.id] || 1) === 1 ? 'Before' : `${(currentRounds[case_.id] || 1) - 1}회차`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveAll(case_.id)}
                            id={`save-all-${case_.id}`}
                            disabled={saveStatus[case_.id]==='saving'}
                            className="text-xs px-3 py-1 h-7 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer flex items-center gap-1"
                          >
                            {saveStatus[case_.id]==='saving' && (
                              <>
                                <Save className="h-3 w-3 mr-1 animate-spin" /> 저장 중...
                              </>
                            )}
                            {saveStatus[case_.id]==='saved' && (
                              <>
                                ✅ 저장됨
                              </>
                            )}
                            {saveStatus[case_.id]==='error' && (
                              <>
                                ❌ 오류
                              </>
                            )}
                            {(!saveStatus[case_.id] || saveStatus[case_.id]==='idle') && (
                              <>
                                <Save className="h-3 w-3 mr-1" /> 전체저장
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {/* 첫 번째 열 */}
                          <div className="space-y-3">
                            {/* 이름 */}
                            <div className="flex items-center gap-0.5">
                              <Label htmlFor={`name-${case_.id}`} className="text-xs font-medium w-14 shrink-0 text-gray-600">이름</Label>
                              <Input
                                id={`name-${case_.id}`}
                                value={case_.customerInfo.name}
                                onChange={(e) => handleBasicCustomerInfoUpdate(case_.id, { name: e.target.value })}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={(e) => {
                                  setIsComposing(false);
                                  handleBasicCustomerInfoUpdate(case_.id, { name: e.currentTarget.value });
                                }}
                                placeholder="고객 이름"
                                className="w-20 text-sm h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                              />
                            </div>
                            
                            {/* 성별 */}
                            <div className="flex items-center gap-0.5">
                              <Label className="text-xs font-medium w-14 shrink-0 text-gray-600">성별</Label>
                              <Select
                                value={case_.customerInfo.gender || ''}
                                onValueChange={(value: 'male' | 'female' | 'other') => 
                                  handleBasicCustomerInfoUpdate(case_.id, { gender: value })
                                }
                              >
                                <SelectTrigger className="w-full sm:w-28 text-sm h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200">
                                  <SelectValue placeholder="성별 선택" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {SYSTEM_OPTIONS.genders.map((gender) => (
                                    <SelectItem key={gender.value} value={gender.value}>
                                      {gender.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* 두 번째 열 */}
                          <div className="space-y-3">
                            {/* 나이 */}
                            <div className="flex items-center">
                              <Label htmlFor={`age-${case_.id}`} className="text-xs font-medium w-10 shrink-0 text-gray-600">나이</Label>
                              <Input
                                id={`age-${case_.id}`}
                                type="number"
                                value={case_.customerInfo.age || ''}
                                onChange={(e) => handleBasicCustomerInfoUpdate(case_.id, { 
                                  age: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                placeholder="나이"
                                className="flex-1 text-xs h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                              />
                            </div>
                            
                            {/* 날짜 */}
                            <div className="flex items-center">
                              <Label htmlFor={`date-${case_.id}`} className="text-xs font-medium w-10 shrink-0 text-gray-600">날짜</Label>
                              <Input
                                id={`date-${case_.id}`}
                                type="date"
                                value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.date || ''}
                                onChange={(e) => 
                                  handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { date: e.target.value })
                                }
                                className="flex-1 text-xs h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                              />
                            </div>
                          </div>
                          
                          {/* 관리 유형 - 전체 너비 */}
                          <div className="flex items-center col-span-2">
                            <Label className="text-xs font-medium w-14 shrink-0 text-gray-600">관리유형</Label>
                            <Select
                              value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.treatmentType || ''}
                              onValueChange={(value) => 
                                handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { treatmentType: value })
                              }
                            >
                              <SelectTrigger className="flex-1 text-sm h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200">
                                <SelectValue placeholder="관리 유형 선택" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {SYSTEM_OPTIONS.treatmentTypes.map((treatment) => (
                                  <SelectItem key={treatment.value} value={treatment.value}>
                                    {treatment.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      {/* 블록 3: 홈케어 제품 */}
                      <div className="space-y-2 border-2 border-soksok-light-blue/40 rounded-lg p-4 bg-soksok-light-blue/20">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-blue-700">홈케어 제품</Label>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-soksok-light-blue/40">
                            {(currentRounds[case_.id] || 1) === 1 ? 'Before' : `${(currentRounds[case_.id] || 1) - 1}회차`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-2">
                          {SYSTEM_OPTIONS.products.map((product) => {
                            const currentRound = currentRounds[case_.id] || 1;
                            const currentRoundInfo = case_.roundCustomerInfo[currentRound] || { 
                              treatmentType: '', 
                              products: [], 
                              skinTypes: [], 
                              memo: '', 
                              date: '' 
                            };
                            
                            // 현재 회차의 제품 데이터에서 선택 상태 확인
                            const isSelected = currentRoundInfo.products.includes(product.value);
                            
                            return (
                              <label key={product.value} className={`
                                flex items-center space-x-1 p-1.5 rounded-lg text-xs
                                border border-transparent cursor-pointer
                                hover:bg-soksok-light-blue/20
                                transition-all duration-150
                                ${isSelected
                                  ? 'bg-biofox-blue-violet/10 border-biofox-blue-violet/30'
                                  : ''
                                }
                              `}>
                                <Checkbox
                                  id={`product-${case_.id}-${currentRound}-${product.value}`}
                                  checked={isSelected}
                                  onCheckedChange={async (checked) => {
                                    if (checked === 'indeterminate') return;
                                    const isChecked = Boolean(checked);
                                    let updatedProducts: string[] = [];
                                    // prev 기반으로 상태 계산하여 stale 문제 해결
                                    setCases(prev => prev.map(c => {
                                      if (c.id !== case_.id) return c;
                                      const prevRound = c.roundCustomerInfo[currentRound] || { treatmentType:'', products:[], skinTypes:[], memo:'', date:'' };
                                      updatedProducts = isChecked ? [...prevRound.products, product.value] : prevRound.products.filter(p=>p!==product.value);
                                      return { ...c, roundCustomerInfo: { ...c.roundCustomerInfo, [currentRound]: { ...prevRound, products: updatedProducts } } };
                                    }));
                                    
                                    // 백그라운드에서 저장
                                    try {
                                      await handleRoundCustomerInfoUpdate(case_.id, currentRound, { products: updatedProducts });
                                      // boolean 필드 동기화 - 홈케어 제품
                                      const booleanUpdates = {
                                        cureBooster: updatedProducts.includes('cure_booster'),
                                        cureMask: updatedProducts.includes('cure_mask'),
                                        premiumMask: updatedProducts.includes('premium_mask'),
                                        allInOneSerum: updatedProducts.includes('all_in_one_serum'),
                                      };

                                      await updateCaseCheckboxes(case_.id, booleanUpdates);
                                    } catch (error) {
                                      console.error('제품 선택 저장 실패:', error);
                                      // 실패 시 상태 되돌리기
                                      const revertedProducts = isChecked
                                        ? currentRoundInfo.products.filter(p => p !== product.value)
                                        : [...currentRoundInfo.products, product.value];
                                      
                                      setCases(prev => prev.map(c => 
                                        c.id === case_.id 
                                          ? { 
                                              ...c, 
                                              roundCustomerInfo: {
                                                ...c.roundCustomerInfo,
                                                [currentRound]: {
                                                  ...currentRoundInfo,
                                                  products: revertedProducts
                                                }
                                              }
                                            }
                                          : c
                                      ));
                                    }
                                  }}
                                  className="data-[state=checked]:bg-biofox-blue-violet data-[state=checked]:border-biofox-blue-violet"
                                />
                                <span className="text-xs leading-tight">{product.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 블록 4: 고객 피부타입 */}
                      <div className="space-y-2 border-2 border-soksok-light-blue/40 rounded-lg p-4 bg-soksok-light-blue/20">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-blue-700">고객 피부타입</Label>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-soksok-light-blue/40">
                            {(currentRounds[case_.id] || 1) === 1 ? 'Before' : `${(currentRounds[case_.id] || 1) - 1}회차`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-2">
                          {SYSTEM_OPTIONS.skinTypes.map((skinType) => {
                            const currentRound = currentRounds[case_.id] || 1;
                            const currentRoundInfo = case_.roundCustomerInfo[currentRound] || { 
                              treatmentType: '', 
                              products: [], 
                              skinTypes: [], 
                              memo: '', 
                              date: '' 
                            };
                            
                            // 현재 회차의 피부타입 데이터에서 선택 상태 확인
                            const isSelected = currentRoundInfo.skinTypes.includes(skinType.value);
                            
                            return (
                              <label key={skinType.value} className={`
                                flex items-center space-x-1 p-1.5 rounded-lg text-xs
                                border border-transparent cursor-pointer
                                hover:bg-soksok-light-blue/20
                                transition-all duration-150
                                ${isSelected
                                  ? 'bg-biofox-blue-violet/10 border-biofox-blue-violet/30'
                                  : ''
                                }
                              `}>
                                <Checkbox
                                  id={`skin-${case_.id}-${currentRound}-${skinType.value}`}
                                  checked={isSelected}
                                  onCheckedChange={async (checked) => {
                                    if (checked === 'indeterminate') return;
                                    const isChecked = Boolean(checked);
                                    let updatedSkinTypes: string[] = [];
                                    setCases(prev => prev.map(c => {
                                      if (c.id !== case_.id) return c;
                                      const prevRound = c.roundCustomerInfo[currentRound] || { treatmentType:'', products:[], skinTypes:[], memo:'', date:'' };
                                      updatedSkinTypes = isChecked ? [...prevRound.skinTypes, skinType.value] : prevRound.skinTypes.filter(s=>s!==skinType.value);
                                      return { ...c, roundCustomerInfo: { ...c.roundCustomerInfo, [currentRound]: { ...prevRound, skinTypes: updatedSkinTypes } } };
                                    }));
                                     // Boolean 필드 매핑
                                     const skinBooleanUpdates = {
                                       skinRedSensitive: updatedSkinTypes.includes('red_sensitive'),
                                       skinPigment: updatedSkinTypes.includes('pigment'),
                                       skinPore: updatedSkinTypes.includes('pore'),
                                       skinTrouble: updatedSkinTypes.includes('acne_trouble'),
                                       skinWrinkle: updatedSkinTypes.includes('wrinkle'),
                                       skinEtc: updatedSkinTypes.includes('other'),
                                     };
                                     
                                     // 백그라운드에서 저장
                                     try {
                                       await handleRoundCustomerInfoUpdate(case_.id, currentRound, { skinTypes: updatedSkinTypes });
                                       await updateCaseCheckboxes(case_.id, skinBooleanUpdates);
                                     } catch (error) {
                                       console.error('피부타입 선택 저장 실패:', error);
                                       setCases(prev => prev.map(c => {
                                         if (c.id !== case_.id) return c;
                                         const prevRound = c.roundCustomerInfo[currentRound] || { treatmentType:'', products:[], skinTypes:[], memo:'', date:'' };
                                         const reverted = isChecked ? prevRound.skinTypes.filter(s=>s!==skinType.value) : [...prevRound.skinTypes, skinType.value];
                                         return { ...c, roundCustomerInfo: { ...c.roundCustomerInfo, [currentRound]: { ...prevRound, skinTypes: reverted } } };
                                       }));
                                     }
                                   }}
                                  className="data-[state=checked]:bg-biofox-blue-violet data-[state=checked]:border-biofox-blue-violet"
                                />
                                <span className="text-xs leading-tight">{skinType.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 블록 5: 특이사항 */}
                      <div className="space-y-2 border-2 border-gray-200 rounded-lg p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`memo-${case_.id}`} className="text-sm font-medium text-gray-700">특이사항</Label>
                        </div>
                        <Textarea
                          id={`memo-${case_.id}`}
                          value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.memo || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            
                            // 즉시 로컬 상태 업데이트 (UI 반응성을 위해)
                            setCases(prev => prev.map(case_ => 
                              case_.id === case_.id 
                                ? { 
                                    ...case_, 
                                    roundCustomerInfo: {
                                      ...case_.roundCustomerInfo,
                                      [currentRounds[case_.id] || 1]: { 
                                        ...case_.roundCustomerInfo[currentRounds[case_.id] || 1],
                                        memo: newValue
                                      }
                                    }
                                  }
                                : case_
                            ));

                            // IME 입력 중이 아닐 때는 debounce 사용 (영어/숫자/특수문자)
                            if (!isComposing) {
                              const debounceKey = `memo-${case_.id}-${currentRounds[case_.id] || 1}`;
                              debouncedUpdate(debounceKey, () => {
                                handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { memo: newValue });
                              }, 800); // 800ms 디바운스
                            }
                          }}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={(e) => {
                            setIsComposing(false);
                            // 한글 입력 완료 시 즉시 저장
                            handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { memo: e.currentTarget.value });
                          }}
                          placeholder="해당 회차 관련 특이사항을 입력하세요..."
                          className="w-full min-h-[80px] border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                        />
                      </div>
                          </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    ))
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