import React from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { ConsentUploader } from '@/components/clinical/ConsentUploader';
import PhotoRoundCarousel from '@/components/clinical/PhotoRoundCarousel';
import CaseStatusTabs from '@/app/kol-new/clinical-photos/components/CaseStatusTabs';
import { SYSTEM_OPTIONS } from '@/types/clinical';
import type { ClinicalCase } from '@/types/clinical';

interface CaseCardProps {
  case_: ClinicalCase;
  index: number;
  currentRounds: { [caseId: string]: number };
  saveStatus: { [caseId: string]: 'idle' | 'saving' | 'saved' | 'error' };
  numberVisibleCards: Set<string>;
  isNewCustomer: (caseId: string) => boolean;
  setIsComposing: (composing: boolean) => void;
  setCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  handlers: {
    handleConsentChange: (caseId: string, received: boolean) => void;
    handleCaseStatusChange: (caseId: string, status: 'active' | 'completed') => void;
    handleDeleteCase: (caseId: string) => void;
    refreshCases: () => void;
    handleSaveAll: (caseId: string) => void;
    handleBasicCustomerInfoUpdate: (caseId: string, info: any) => void;
    handleRoundCustomerInfoUpdate: (caseId: string, round: number, info: any) => void;
    updateCaseCheckboxes: (caseId: string, updates: any) => void;
  };
  totalCases: number;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  case_,
  index,
  currentRounds,
  saveStatus,
  numberVisibleCards,
  isNewCustomer,
  setIsComposing,
  setCases,
  handlers,
  totalCases,
}) => {
  const {
    handleConsentChange,
    handleCaseStatusChange,
    handleDeleteCase,
    refreshCases,
    handleSaveAll,
    handleBasicCustomerInfoUpdate,
    handleRoundCustomerInfoUpdate,
    updateCaseCheckboxes,
  } = handlers;

  return (
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
        className="legacy-card"
        variant={case_.status === 'completed' ? 'glass-light' : 'default'}
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
            {totalCases - index}
          </motion.span>
        </motion.div>
        
        {/* 카드 내용 */}
        <div className="relative" style={{ zIndex: 1 }}>
          <CardHeader className="pb-4 bg-gray-50/30 rounded-t-xl">
            {/* 첫 번째 줄: 고객이름 + 동의/미동의 + 진행중/완료 */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 flex-1 min-w-0">
                <div className="h-6 w-6 xs:h-7 xs:w-7 sm:h-9 sm:w-9 bg-biofox-blue-violet text-white rounded-lg flex items-center justify-center text-[11px] xs:text-xs sm:text-sm font-bold flex-shrink-0 shadow-sm transform hover:scale-105 transition-transform">
                  {totalCases - index}
                </div>
                <span className="text-lg font-medium text-gray-800 truncate">{case_.customerName || '새 고객'}</span>
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
          
          <CardContent className="space-y-3 xs:space-y-4 sm:space-y-6 p-3 xs:p-4 sm:p-6">
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
            <PhotoRoundCarousel
              caseId={case_.id}
              photos={case_.photos}
              onPhotoUpload={async (roundDay: number, angle: string, file: File) => {
                // TODO: PhotoUpload 로직 구현 필요
                console.log('Photo upload:', { roundDay, angle, file });
                refreshCases();
              }}
              onPhotoDelete={async (roundDay: number, angle: string) => {
                // TODO: PhotoDelete 로직 구현 필요  
                console.log('Photo delete:', { roundDay, angle });
                refreshCases();
              }}
              isCompleted={case_.status === 'completed'}
              onRoundChange={(roundDay: number) => {
                // TODO: currentRounds 업데이트 로직 구현 필요
                console.log('Round change:', roundDay);
              }}
              onPhotosRefresh={() => refreshCases()}
            />
            
            {/* 블록 3: 고객 정보 */}
            <div className="space-y-3 legacy-section">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="legacy-section-header">고객 정보</h3>
                  <span className="legacy-round-badge">
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
              
              <div className="space-y-3">
                {/* 이름 */}
                <div className="flex items-center gap-1">
                  <Label htmlFor={`name-${case_.id}`} className="text-xs font-medium w-10 xs:w-12 sm:w-14 shrink-0 text-gray-600">이름</Label>
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
                    className="flex-1 min-w-0 text-xs xs:text-sm h-7 xs:h-8 sm:h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                  />
                </div>
                
                {/* 성별 */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs font-medium w-10 xs:w-12 sm:w-14 shrink-0 text-gray-600">성별</Label>
                  <Select
                    value={case_.customerInfo.gender || ''}
                    onValueChange={(value: 'male' | 'female' | 'other') => 
                      handleBasicCustomerInfoUpdate(case_.id, { gender: value })
                    }
                  >
                    <SelectTrigger className="flex-1 min-w-0 text-xs xs:text-sm h-7 xs:h-8 sm:h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200">
                      <SelectValue placeholder="성별" />
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
                
                {/* 나이 */}
                <div className="flex items-center gap-1">
                  <Label htmlFor={`age-${case_.id}`} className="text-xs font-medium w-10 xs:w-12 sm:w-14 shrink-0 text-gray-600">나이</Label>
                  <Input
                    id={`age-${case_.id}`}
                    type="number"
                    value={case_.customerInfo.age || ''}
                    onChange={(e) => handleBasicCustomerInfoUpdate(case_.id, { 
                      age: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="나이"
                    className="flex-1 text-xs xs:text-sm h-7 xs:h-8 sm:h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                  />
                </div>
                
                {/* 날짜 */}
                <div className="flex items-center gap-1">
                  <Label htmlFor={`date-${case_.id}`} className="text-xs font-medium w-10 xs:w-12 sm:w-14 shrink-0 text-gray-600">날짜</Label>
                  <Input
                    id={`date-${case_.id}`}
                    type="date"
                    value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.date || ''}
                    onChange={(e) => 
                      handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { date: e.target.value })
                    }
                    className="flex-1 text-xs xs:text-sm h-7 xs:h-8 sm:h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                  />
                </div>
                
                {/* 관리 유형 */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs font-medium w-10 xs:w-12 sm:w-14 shrink-0 text-gray-600">관리유형</Label>
                  <Select
                    value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.treatmentType || ''}
                    onValueChange={(value) => 
                      handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { treatmentType: value })
                    }
                  >
                    <SelectTrigger className="flex-1 min-w-0 text-xs xs:text-sm h-7 xs:h-8 sm:h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200">
                      <SelectValue placeholder="관리 유형" />
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
            
            {/* 블록 4: 홈케어 제품 */}
            <div className="space-y-2 legacy-section">
              <div className="flex items-center gap-2">
                <Label className="legacy-section-header">홈케어 제품</Label>
                <span className="legacy-round-badge">
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
            
            {/* 블록 5: 고객 피부타입 */}
            <div className="space-y-2 legacy-section">
              <div className="flex items-center gap-2">
                <Label className="legacy-section-header">고객 피부타입</Label>
                <span className="legacy-round-badge">
                  {(currentRounds[case_.id] || 1) === 1 ? 'Before' : `${(currentRounds[case_.id] || 1) - 1}회차`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-2">
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
                        id={`skintype-${case_.id}-${currentRound}-${skinType.value}`}
                        checked={isSelected}
                        onCheckedChange={async (checked) => {
                          if (checked === 'indeterminate') return;
                          const isChecked = Boolean(checked);
                          let updatedSkinTypes: string[] = [];
                          // prev 기반으로 상태 계산하여 stale 문제 해결
                          setCases(prev => prev.map(c => {
                            if (c.id !== case_.id) return c;
                            const prevRound = c.roundCustomerInfo[currentRound] || { treatmentType:'', products:[], skinTypes:[], memo:'', date:'' };
                            updatedSkinTypes = isChecked ? [...prevRound.skinTypes, skinType.value] : prevRound.skinTypes.filter(s=>s!==skinType.value);
                            return { ...c, roundCustomerInfo: { ...c.roundCustomerInfo, [currentRound]: { ...prevRound, skinTypes: updatedSkinTypes } } };
                          }));
                          
                          // 백그라운드에서 저장
                          try {
                            await handleRoundCustomerInfoUpdate(case_.id, currentRound, { skinTypes: updatedSkinTypes });
                            // boolean 필드 동기화 - 피부타입
                            const booleanUpdates = {
                              skinRedSensitive: updatedSkinTypes.includes('red_sensitive'),
                              skinPigment: updatedSkinTypes.includes('pigment'),
                              skinPore: updatedSkinTypes.includes('pore'),
                              skinTrouble: updatedSkinTypes.includes('acne_trouble'),
                              skinWrinkle: updatedSkinTypes.includes('wrinkle'),
                              skinEtc: updatedSkinTypes.includes('other'),
                            };

                            await updateCaseCheckboxes(case_.id, booleanUpdates);
                          } catch (error) {
                            console.error('피부타입 선택 저장 실패:', error);
                            // 실패 시 상태 되돌리기
                            const revertedSkinTypes = isChecked
                              ? currentRoundInfo.skinTypes.filter(s => s !== skinType.value)
                              : [...currentRoundInfo.skinTypes, skinType.value];
                            
                            setCases(prev => prev.map(c => 
                              c.id === case_.id 
                                ? { 
                                    ...c, 
                                    roundCustomerInfo: {
                                      ...c.roundCustomerInfo,
                                      [currentRound]: {
                                        ...currentRoundInfo,
                                        skinTypes: revertedSkinTypes
                                      }
                                    }
                                  }
                                : c
                            ));
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
            
            {/* 블록 6: 특이사항 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">특이사항</Label>
              <Textarea
                value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.memo || ''}
                onChange={(e) => {
                  const currentRound = currentRounds[case_.id] || 1;
                  handleRoundCustomerInfoUpdate(case_.id, currentRound, { memo: e.target.value });
                }}
                placeholder="해당 회차에 관련한 권한 특이사항을 입력해주세요."
                className="min-h-[100px] resize-none border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
              />
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}; 