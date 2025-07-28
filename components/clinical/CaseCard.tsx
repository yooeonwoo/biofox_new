import React from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ConsentUploader } from '@/components/clinical/ConsentUploader';
import PhotoRoundCarousel from '@/components/clinical/PhotoRoundCarousel';
import CaseStatusTabs from '@/app/kol-new/clinical-photos/components/CaseStatusTabs';
import { SYSTEM_OPTIONS } from '@/types/clinical';
import type { ClinicalCase } from '@/types/clinical';
import { SaveStatusIndicator } from '@/components/clinical/SaveStatusIndicator';
import {
  useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoConvex,
} from '@/lib/clinical-photos-hooks';
import { useCasePhotos } from '@/lib/clinical-case-photos-hooks';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

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
    handleDeleteCase: (caseId: string) => void;
    handleConsentChange: (caseId: string, consented: boolean) => void;
    handleCaseStatusChange: (caseId: string, status: 'active' | 'completed') => void;
    handleSaveAll: (caseId: string) => void;
    handleBasicCustomerInfoUpdate: (caseId: string, updates: any) => void;
    handleRoundCustomerInfoUpdate: (caseId: string, round: number, updates: any) => void;
    handlePhotoUpload: (
      caseId: string,
      roundDay: number,
      angle: string,
      file: File
    ) => Promise<void>;
    handlePhotoDelete: (caseId: string, roundDay: number, angle: string) => Promise<void>;
  };
  totalCases: number;
}

const CaseCard: React.FC<CaseCardProps> = ({
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
  // ✅ 타입 안전성을 위한 early return
  const caseId = case_._id ?? case_.id;
  if (!caseId) {
    console.warn('CaseCard: case ID is missing', case_);
    return null;
  }

  // 케이스별 사진 데이터 조회
  const { photos, isLoading: photosLoading } = useCasePhotos(caseId);

  const {
    handleDeleteCase,
    handleConsentChange,
    handleCaseStatusChange,
    handleSaveAll,
    handleBasicCustomerInfoUpdate,
    handleRoundCustomerInfoUpdate,
  } = handlers;

  return (
    <motion.div
      key={caseId}
      className="group relative h-[90vh] w-full overflow-hidden rounded-3xl sm:h-[95vh]"
      layoutId={caseId}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
    >
      <Card
        className="relative z-10 h-full w-full overflow-hidden border-none bg-white/95 shadow-2xl backdrop-blur-sm"
        data-case-id={caseId}
        style={{
          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))',
        }}
      >
        {/* Background Number */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
          style={{ zIndex: 0 }}
          initial={{
            opacity: 0,
            scale: 0.3,
            rotate: -20,
            y: 50,
          }}
          animate={{
            opacity: numberVisibleCards.has(caseId) ? 0.6 : 0,
            scale: numberVisibleCards.has(caseId) ? 1 : 0.7,
            rotate: numberVisibleCards.has(caseId) ? 0 : -10,
            y: numberVisibleCards.has(caseId) ? 0 : 30,
          }}
          transition={{
            duration: 0.4,
            ease: 'easeOut',
            opacity: {
              duration: numberVisibleCards.has(caseId) ? 0.2 : 0.4,
              ease: numberVisibleCards.has(caseId) ? 'easeOut' : 'easeIn',
            },
            scale: { duration: 0.3 },
            rotate: { duration: 0.4 },
            y: { duration: 0.3 },
          }}
        >
          <motion.span
            className="select-none text-[20rem] font-black leading-none sm:text-[25rem] md:text-[30rem] lg:text-[35rem]"
            animate={{
              color: numberVisibleCards.has(caseId)
                ? 'rgba(156, 163, 175, 0.5)' // gray-400/50 - 더 진하게
                : 'rgba(209, 213, 219, 0.1)', // gray-300/10 - 더 연하게
            }}
            transition={{
              duration: numberVisibleCards.has(caseId) ? 0.2 : 0.4,
              ease: numberVisibleCards.has(caseId) ? 'easeOut' : 'easeIn',
            }}
          >
            {totalCases - index}
          </motion.span>
        </motion.div>

        <div className="relative z-20 flex h-full flex-col">
          <CardHeader className="relative flex shrink-0 flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {/* 사용자 아바타 영역 */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg">
                {(case_.customerInfo?.name ?? case_.name ?? 'N')[0]?.toUpperCase() ?? 'N'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {case_.customerInfo?.name ?? case_.name ?? '이름 없음'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isNewCustomer(caseId) ? '신규 고객' : '기존 고객'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>고객 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 이 고객을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteCase(caseId)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>

          {/* 동의 상태 및 케이스 상태 */}
          <div className="flex shrink-0 items-center justify-between bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={case_.consentReceived ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => handleConsentChange(caseId, true)}
              >
                동의함
              </Button>
              <Button
                size="sm"
                variant={!case_.consentReceived ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => handleConsentChange(caseId, false)}
              >
                동의 안함
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={case_.status === 'active' ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => handleCaseStatusChange(caseId, 'active')}
              >
                진행중
              </Button>
              <Button
                size="sm"
                variant={case_.status === 'completed' ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => handleCaseStatusChange(caseId, 'completed')}
              >
                완료
              </Button>
            </div>
          </div>

          <CardContent className="relative flex-1 overflow-y-auto p-4">
            {/* 동의서 업로드 */}
            <ConsentUploader
              caseId={caseId}
              roundId={(currentRounds[caseId] || 1).toString()}
              onUploadSuccess={() => {
                // 업로드 성공 처리
              }}
            />

            {/* 사진 업로드 캐러셀 */}
            <PhotoRoundCarousel
              caseId={caseId}
              photos={photos}
              currentRound={currentRounds[caseId] || 1}
              onPhotoUpload={async (roundDay, angle, file) => {
                try {
                  await handlers.handlePhotoUpload(caseId, roundDay, angle, file);
                } catch (error) {
                  console.error('Photo upload failed:', error);
                }
              }}
              onPhotoDelete={async (roundDay, angle) => {
                try {
                  await handlers.handlePhotoDelete(caseId, roundDay, angle);
                } catch (error) {
                  console.error('Photo delete failed:', error);
                }
              }}
              onRoundChange={roundDay => {
                setIsComposing(true);
                // Update current round for this case
                setCases(prev =>
                  prev.map(c =>
                    c._id === caseId || c.id === caseId ? { ...c, [caseId]: roundDay } : c
                  )
                );
              }}
            />

            {/* 회차 표시 및 저장 버튼 */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {(currentRounds[caseId] || 1) === 1
                  ? '1회차 (초기)'
                  : `${(currentRounds[caseId] || 1) - 1}회차`}
              </span>
              <div className="flex items-center gap-2">
                <SaveStatusIndicator status={saveStatus[caseId] || 'idle'} />
                <Button
                  size="sm"
                  onClick={() => handleSaveAll(caseId)}
                  id={`save-all-${caseId}`}
                  disabled={saveStatus[caseId] === 'saving'}
                  className="h-8 px-3 text-xs"
                >
                  <Save className="mr-1 h-3 w-3" />
                  저장
                </Button>
              </div>
            </div>

            {/* 기본 고객 정보 */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${caseId}`} className="text-sm font-medium text-gray-700">
                    고객명
                  </Label>
                  <Input
                    id={`name-${caseId}`}
                    value={case_.customerInfo?.name ?? case_.name ?? ''}
                    onChange={e => {
                      const value = e.target.value;
                      setCases(prev =>
                        prev.map(c =>
                          c._id === caseId || c.id === caseId
                            ? {
                                ...c,
                                customerInfo: {
                                  ...c.customerInfo,
                                  name: value,
                                  products: c.customerInfo?.products ?? [],
                                  skinTypes: c.customerInfo?.skinTypes ?? [],
                                },
                              }
                            : c
                        )
                      );
                    }}
                    onBlur={e => {
                      setCases(prev =>
                        prev.map(c =>
                          c._id === caseId || c.id === caseId
                            ? {
                                ...c,
                                customerInfo: {
                                  ...c.customerInfo,
                                  name: e.target.value,
                                  products: c.customerInfo?.products ?? [],
                                  skinTypes: c.customerInfo?.skinTypes ?? [],
                                },
                              }
                            : c
                        )
                      );
                      handleBasicCustomerInfoUpdate(caseId, { name: e.target.value });
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">성별</Label>
                  <Select
                    value={case_.customerInfo?.gender ?? case_.gender ?? ''}
                    onValueChange={value =>
                      handleBasicCustomerInfoUpdate(caseId, { gender: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`age-${caseId}`} className="text-sm font-medium text-gray-700">
                    나이
                  </Label>
                  <Input
                    id={`age-${caseId}`}
                    type="number"
                    value={case_.customerInfo?.age ?? case_.age ?? ''}
                    onChange={e => {
                      const value = parseInt(e.target.value) || undefined;
                      setCases(prev =>
                        prev.map(c =>
                          c._id === caseId || c.id === caseId
                            ? {
                                ...c,
                                customerInfo: {
                                  ...c.customerInfo,
                                  age: value,
                                  name: c.customerInfo?.name ?? '',
                                  products: c.customerInfo?.products ?? [],
                                  skinTypes: c.customerInfo?.skinTypes ?? [],
                                },
                              }
                            : c
                        )
                      );
                    }}
                    onBlur={e => {
                      const value = parseInt(e.target.value) || undefined;
                      handleBasicCustomerInfoUpdate(caseId, { age: value });
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`date-${caseId}`} className="text-sm font-medium text-gray-700">
                    날짜
                  </Label>
                  <Input
                    id={`date-${caseId}`}
                    type="date"
                    value={case_.roundCustomerInfo?.[currentRounds[caseId] || 1]?.date || ''}
                    onChange={e =>
                      handleRoundCustomerInfoUpdate(caseId, currentRounds[caseId] || 1, {
                        date: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">시술 타입</Label>
                <Select
                  value={case_.roundCustomerInfo?.[currentRounds[caseId] || 1]?.treatmentType || ''}
                  onValueChange={value =>
                    handleRoundCustomerInfoUpdate(caseId, currentRounds[caseId] || 1, {
                      treatmentType: value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="시술 타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_OPTIONS.treatmentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 제품 사용 체크박스 */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                제품 사용{' '}
                <span className="text-xs text-gray-500">
                  (
                  {(currentRounds[caseId] || 1) === 1
                    ? '1회차 (초기)'
                    : `${(currentRounds[caseId] || 1) - 1}회차`}
                  )
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {SYSTEM_OPTIONS.products.map(product => {
                  const currentRound = currentRounds[caseId] || 1;
                  const roundInfo = case_.roundCustomerInfo?.[currentRound];
                  const isChecked = roundInfo?.products?.includes(product.value) || false;

                  return (
                    <div key={product.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${caseId}-${currentRound}-${product.value}`}
                        checked={isChecked}
                        onCheckedChange={async checked => {
                          setCases(prev =>
                            prev.map(c => {
                              if (c._id !== caseId && c.id !== caseId) return c;

                              const currentProducts =
                                c.roundCustomerInfo?.[currentRound]?.products || [];
                              const updatedProducts = checked
                                ? [...currentProducts, product.value]
                                : currentProducts.filter(p => p !== product.value);

                              return {
                                ...c,
                                roundCustomerInfo: {
                                  ...c.roundCustomerInfo,
                                  [currentRound]: {
                                    ...c.roundCustomerInfo?.[currentRound],
                                    products: updatedProducts,
                                    name: c.roundCustomerInfo?.[currentRound]?.name ?? '',
                                    skinTypes: c.roundCustomerInfo?.[currentRound]?.skinTypes ?? [],
                                  },
                                },
                              };
                            })
                          );

                          // 서버 업데이트
                          const currentProducts =
                            case_.roundCustomerInfo?.[currentRound]?.products || [];
                          const updatedProducts = checked
                            ? [...currentProducts, product.value]
                            : currentProducts.filter((p: string) => p !== product.value);

                          await handleRoundCustomerInfoUpdate(caseId, currentRound, {
                            products: updatedProducts,
                          });
                        }}
                      />
                      <Label
                        htmlFor={`product-${caseId}-${currentRound}-${product.value}`}
                        className="text-sm font-normal"
                      >
                        {product.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 피부 타입 체크박스 */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                피부 타입{' '}
                <span className="text-xs text-gray-500">
                  (
                  {(currentRounds[caseId] || 1) === 1
                    ? '1회차 (초기)'
                    : `${(currentRounds[caseId] || 1) - 1}회차`}
                  )
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {SYSTEM_OPTIONS.skinTypes.map(skinType => {
                  const currentRound = currentRounds[caseId] || 1;
                  const roundInfo = case_.roundCustomerInfo?.[currentRound];
                  const isChecked = roundInfo?.skinTypes?.includes(skinType.value) || false;

                  return (
                    <div key={skinType.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skintype-${caseId}-${currentRound}-${skinType.value}`}
                        checked={isChecked}
                        onCheckedChange={async checked => {
                          setCases(prev =>
                            prev.map(c => {
                              if (c._id !== caseId && c.id !== caseId) return c;

                              const currentSkinTypes =
                                c.roundCustomerInfo?.[currentRound]?.skinTypes || [];
                              const updatedSkinTypes = checked
                                ? [...currentSkinTypes, skinType.value]
                                : currentSkinTypes.filter(s => s !== skinType.value);

                              return {
                                ...c,
                                roundCustomerInfo: {
                                  ...c.roundCustomerInfo,
                                  [currentRound]: {
                                    ...c.roundCustomerInfo?.[currentRound],
                                    skinTypes: updatedSkinTypes,
                                    name: c.roundCustomerInfo?.[currentRound]?.name ?? '',
                                    products: c.roundCustomerInfo?.[currentRound]?.products ?? [],
                                  },
                                },
                              };
                            })
                          );

                          // 서버 업데이트
                          const currentSkinTypes =
                            case_.roundCustomerInfo?.[currentRound]?.skinTypes || [];
                          const updatedSkinTypes = checked
                            ? [...currentSkinTypes, skinType.value]
                            : currentSkinTypes.filter((s: string) => s !== skinType.value);

                          await handleRoundCustomerInfoUpdate(caseId, currentRound, {
                            skinTypes: updatedSkinTypes,
                          });
                        }}
                      />
                      <Label
                        htmlFor={`skintype-${caseId}-${currentRound}-${skinType.value}`}
                        className="text-sm font-normal"
                      >
                        {skinType.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 메모 */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700">메모</Label>
              <Textarea
                value={case_.roundCustomerInfo?.[currentRounds[caseId] || 1]?.memo || ''}
                onChange={e => {
                  const currentRound = currentRounds[caseId] || 1;
                  setCases(prev =>
                    prev.map(c => {
                      if (c._id !== caseId && c.id !== caseId) return c;
                      return {
                        ...c,
                        roundCustomerInfo: {
                          ...c.roundCustomerInfo,
                          [currentRound]: {
                            ...c.roundCustomerInfo?.[currentRound],
                            memo: e.target.value,
                            name: c.roundCustomerInfo?.[currentRound]?.name ?? '',
                            products: c.roundCustomerInfo?.[currentRound]?.products ?? [],
                            skinTypes: c.roundCustomerInfo?.[currentRound]?.skinTypes ?? [],
                          },
                        },
                      };
                    })
                  );
                }}
                onBlur={e => {
                  const currentRound = currentRounds[caseId] || 1;
                  setCases(prev =>
                    prev.map(c => {
                      if (c._id !== caseId && c.id !== caseId) return c;
                      return {
                        ...c,
                        roundCustomerInfo: {
                          ...c.roundCustomerInfo,
                          [currentRound]: {
                            ...c.roundCustomerInfo?.[currentRound],
                            memo: e.target.value,
                            name: c.roundCustomerInfo?.[currentRound]?.name ?? '',
                            products: c.roundCustomerInfo?.[currentRound]?.products ?? [],
                            skinTypes: c.roundCustomerInfo?.[currentRound]?.skinTypes ?? [],
                          },
                        },
                      };
                    })
                  );
                  handleRoundCustomerInfoUpdate(caseId, currentRound, { memo: e.target.value });
                }}
                rows={3}
                className="mt-1"
                placeholder="고객에 대한 메모를 입력하세요..."
              />
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default CaseCard;
