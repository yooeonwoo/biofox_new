'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ClinicalCase, CustomerInfo, RoundCustomerInfo } from '@/types/clinical';
import {
  useCreateClinicalCaseConvex,
  useUpdateClinicalCaseStatusConvex,
  useDeleteClinicalCaseConvex,
  useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoConvex,
} from '@/lib/clinical-photos-hooks';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
// toConvexId 제거 - string ID를 직접 사용

interface UseCustomerCaseHandlersParams {
  user: any;
  cases: ClinicalCase[];
  setCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  currentRounds: { [caseId: string]: number };
  setCurrentRounds: React.Dispatch<React.SetStateAction<{ [caseId: string]: number }>>;
  isComposing: boolean;
  debouncedUpdate: (key: string, updateFn: () => void, delay?: number) => void;
  saveStatus: { [caseId: string]: 'idle' | 'saving' | 'saved' | 'error' };
  markSaving: (caseId: string) => void;
  markSaved: (caseId: string) => void;
  markError: (caseId: string) => void;
  enqueue: (caseId: string, task: () => Promise<void>) => Promise<void>;
  hasUnsavedNewCustomer: boolean;
  setHasUnsavedNewCustomer: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Customer 페이지 전용 핸들러 집합 - Convex 버전
 */
export function useCustomerCaseHandlers({
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
}: UseCustomerCaseHandlersParams) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Convex mutations
  const createCase = useCreateClinicalCaseConvex();
  const updateCaseStatus = useUpdateClinicalCaseStatusConvex();
  const deleteCase = useDeleteClinicalCaseConvex();
  const uploadPhoto = useUploadClinicalPhotoConvex();
  const deletePhoto = useDeleteClinicalPhotoConvex();

  // 추가 mutation (나중에 구현 필요)
  const updateCaseFields = useMutation(api.clinical.updateClinicalCase);
  const saveRoundInfo = useMutation(api.clinical.saveRoundCustomerInfo);

  // 새 고객 여부 확인 함수
  const isNewCustomer = useCallback((caseId: string) => caseId.startsWith('new-customer-'), []);

  // 로그아웃 함수
  const handleSignOut = useCallback(async () => {
    try {
      // TODO: Supabase 로그아웃 호출
      router.push('/signin');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  }, [router]);

  // 케이스 상태 변경 핸들러
  const handleCaseStatusChange = useCallback(
    async (caseId: string, status: 'active' | 'completed') => {
      try {
        // 새 고객이 아닌 경우에만 실제 API 호출
        if (!isNewCustomer(caseId)) {
          const convexStatus = status === 'active' ? 'in_progress' : 'completed';
          await updateCaseStatus.mutateAsync({ caseId, status: convexStatus });
        }

        // 로컬 상태 업데이트
        setCases(prev => prev.map(case_ => (case_.id === caseId ? { ...case_, status } : case_)));

        console.log(`케이스 상태가 ${status}로 변경되었습니다.`);
      } catch (error) {
        console.error('케이스 상태 변경 실패:', error);
        toast.error('케이스 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, isNewCustomer, updateCaseStatus]
  );

  // 동의서 상태 변경 핸들러
  const handleConsentChange = useCallback(
    async (caseId: string, consentReceived: boolean) => {
      try {
        // 새 고객이 아닌 경우에만 실제 API 호출
        if (!isNewCustomer(caseId)) {
          // TODO: Convex mutation으로 동의서 상태 업데이트
          console.log('Consent update not implemented yet');
        }

        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ =>
            case_.id === caseId
              ? {
                  ...case_,
                  consentReceived,
                  // 동의가 false로 변경되면 관련 데이터도 리셋
                  ...(consentReceived === false ? { consentImageUrl: undefined } : {}),
                }
              : case_
          )
        );

        console.log(`동의서 상태가 ${consentReceived ? '동의' : '미동의'}로 변경되었습니다.`);
      } catch (error) {
        console.error('동의서 상태 변경 실패:', error);
        toast.error('동의서 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, isNewCustomer]
  );

  // 사진 업로드 핸들러
  const handlePhotoUpload = useCallback(
    async (caseId: string, roundDay: number, angle: string, file?: File): Promise<void> => {
      console.log('Photo upload:', { caseId, roundDay, angle });

      if (file) {
        try {
          let imageUrl: string;

          // 새 고객인 경우 임시 처리
          if (isNewCustomer(caseId)) {
            imageUrl = URL.createObjectURL(file);

            // 해당 케이스의 사진 업데이트 (새 고객)
            setCases(prev =>
              prev.map(case_ => {
                if (case_.id === caseId) {
                  // 기존 사진 찾기
                  const existingPhotoIndex = case_.photos.findIndex(
                    p => p.roundDay === roundDay && p.angle === angle
                  );

                  const newPhoto = {
                    id: `${caseId}-${roundDay}-${angle}`,
                    roundDay: roundDay,
                    angle: angle as 'front' | 'left' | 'right',
                    imageUrl: imageUrl,
                    uploaded: true,
                  };

                  let updatedPhotos;
                  if (existingPhotoIndex >= 0) {
                    // 기존 사진 교체
                    updatedPhotos = [...case_.photos];
                    updatedPhotos[existingPhotoIndex] = newPhoto;
                  } else {
                    // 새 사진 추가
                    updatedPhotos = [...case_.photos, newPhoto];
                  }

                  return {
                    ...case_,
                    photos: updatedPhotos,
                  };
                }
                return case_;
              })
            );
          } else {
            // 실제 케이스의 경우 Convex 스토리지에 업로드
            const result = await uploadPhoto.mutateAsync({
              caseId,
              roundNumber: roundDay,
              angle,
              file,
            });

            // 업로드 성공 후 로컬 상태 업데이트
            // Convex 실시간 동기화로 자동 업데이트되므로 별도 처리 불필요
            console.log('Photo uploaded successfully:', result);
          }

          console.log('사진이 성공적으로 업로드되었습니다.');
          toast.success('사진이 성공적으로 업로드되었습니다.');
        } catch (error) {
          console.error('사진 업로드 실패:', error);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          toast.error(`사진 업로드 실패: ${errorMessage}`);
          throw error;
        }
      }
    },
    [setCases, isNewCustomer, uploadPhoto]
  );

  // 사진 삭제 핸들러
  const handlePhotoDelete = useCallback(
    async (caseId: string, roundDay: number, angle: string): Promise<void> => {
      try {
        // 새 고객이 아닌 경우에만 실제 삭제 API 호출
        if (!isNewCustomer(caseId)) {
          // 사진 ID 찾기
          const targetCase = cases.find(c => c.id === caseId);
          const photo = targetCase?.photos.find(p => p.roundDay === roundDay && p.angle === angle);

          if (photo?.photoId) {
            await deletePhoto.mutateAsync(photo.photoId);
          }
        } else {
          // 새 고객의 경우 로컬 상태만 업데이트
          setCases(prev =>
            prev.map(case_ => {
              if (case_.id === caseId) {
                const updatedPhotos = case_.photos.filter(
                  p => !(p.roundDay === roundDay && p.angle === angle)
                );
                return {
                  ...case_,
                  photos: updatedPhotos,
                };
              }
              return case_;
            })
          );
        }

        console.log('사진이 성공적으로 삭제되었습니다.');
        toast.success('사진이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('사진 삭제 실패:', error);
        toast.error('사진 삭제에 실패했습니다. 다시 시도해주세요.');
        throw error;
      }
    },
    [cases, setCases, isNewCustomer, deletePhoto]
  );

  // 기본 고객정보 업데이트 핸들러 (이름, 나이, 성별) - IME 처리 개선
  const handleBasicCustomerInfoUpdate = useCallback(
    async (
      caseId: string,
      customerInfo: Partial<Pick<CustomerInfo, 'name' | 'age' | 'gender'>>
    ) => {
      markSaving(caseId);
      try {
        // IME 입력 중이면 로컬 상태만 업데이트
        if (isComposing && customerInfo.name !== undefined) {
          setCases(prev =>
            prev.map(case_ =>
              case_.id === caseId
                ? ({
                    ...case_,
                    customerName: customerInfo.name || case_.customerName,
                    customerInfo: { ...case_.customerInfo, ...customerInfo },
                  } as ClinicalCase)
                : case_
            )
          );
          return;
        }

        // 새 고객이 아닌 경우에만 실제 API 호출
        if (!isNewCustomer(caseId)) {
          // TODO: Convex mutation으로 업데이트
          console.log('Customer info update not implemented yet');
        }

        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ =>
            case_.id === caseId
              ? ({
                  ...case_,
                  customerName: customerInfo.name || case_.customerName,
                  customerInfo: { ...case_.customerInfo, ...customerInfo },
                  roundCustomerInfo: {
                    ...case_.roundCustomerInfo,
                    [currentRounds[caseId] || 1]: {
                      ...(case_.roundCustomerInfo?.[currentRounds[caseId] || 1] || {}),
                      age:
                        customerInfo.age !== undefined
                          ? customerInfo.age
                          : case_.roundCustomerInfo?.[currentRounds[caseId] || 1]?.age,
                      gender:
                        customerInfo.gender !== undefined
                          ? customerInfo.gender
                          : case_.roundCustomerInfo?.[currentRounds[caseId] || 1]?.gender,
                    },
                  },
                } as ClinicalCase)
              : case_
          )
        );

        markSaved(caseId);
        console.log('기본 고객 정보가 업데이트되었습니다.');
      } catch (error) {
        console.error('기본 고객 정보 업데이트 실패:', error);
        markError(caseId);
        // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
      }
    },
    [setCases, currentRounds, markSaving, markSaved, markError, isComposing, isNewCustomer]
  );

  // 회차별 고객정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모) - IME 처리 개선
  const handleRoundCustomerInfoUpdate = useCallback(
    async (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
      markSaving(caseId);
      try {
        // IME 입력 중이면 로컬 상태만 업데이트
        if (isComposing && roundInfo.memo !== undefined) {
          setCases(prev =>
            prev.map(case_ =>
              case_.id === caseId
                ? ({
                    ...case_,
                    roundCustomerInfo: {
                      ...case_.roundCustomerInfo,
                      [roundDay]: {
                        treatmentType: '',
                        memo: '',
                        date: '',
                        products: [],
                        skinTypes: [],
                        ...(case_.roundCustomerInfo?.[roundDay] || {}),
                        ...roundInfo,
                      },
                    },
                  } as ClinicalCase)
                : case_
            )
          );
          markSaved(caseId);
          return;
        }

        // 새 고객이 아닌 경우에만 실제 API 호출
        if (!isNewCustomer(caseId)) {
          // TODO: Convex mutation으로 업데이트
          console.log('Round info update not implemented yet');
        }

        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ =>
            case_.id === caseId
              ? {
                  ...case_,
                  roundCustomerInfo: {
                    ...case_.roundCustomerInfo,
                    [roundDay]: {
                      treatmentType: '',
                      memo: '',
                      date: '',
                      products: [],
                      skinTypes: [],
                      ...(case_.roundCustomerInfo?.[roundDay] || {}),
                      ...roundInfo,
                    },
                  },
                }
              : case_
          )
        );

        markSaved(caseId);
        console.log('회차별 고객 정보가 업데이트되었습니다.');
      } catch (error) {
        console.error('회차별 고객 정보 업데이트 실패:', error);
        markError(caseId);
        // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
      }
    },
    [setCases, enqueue, markSaving, markSaved, markError, isComposing, isNewCustomer]
  );

  // 체크박스 업데이트 핸들러
  const updateCaseCheckboxes = useCallback(
    async (
      caseId: string,
      updates: Partial<{
        cureBooster: boolean;
        cureMask: boolean;
        premiumMask: boolean;
        allInOneSerum: boolean;
        skinRedSensitive: boolean;
        skinPigment: boolean;
        skinPore: boolean;
        skinTrouble: boolean;
        skinWrinkle: boolean;
        skinEtc: boolean;
      }>
    ) => {
      try {
        // 새 고객이 아닌 경우에만 실제 API 호출
        if (!isNewCustomer(caseId)) {
          await updateCaseFields({
            caseId: caseId as Id<'clinical_cases'>,
            updates: updates as any,
          });
        }

        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ => (case_.id === caseId ? { ...case_, ...updates } : case_))
        );

        console.log('체크박스 상태가 업데이트되었습니다.');
      } catch (error) {
        console.error('체크박스 업데이트 실패:', error);
        // 조용히 실패 처리
      }
    },
    [setCases, isNewCustomer, updateCaseFields]
  );

  // 현재 회차 변경 핸들러
  const handleCurrentRoundChange = useCallback(
    (caseId: string, roundDay: number) => {
      setCurrentRounds(prev => ({ ...prev, [caseId]: roundDay }));
    },
    [setCurrentRounds]
  );

  // 케이스 새로고침 핸들러
  const refreshCases = useCallback(async () => {
    // Convex는 실시간 동기화를 제공하므로 특별한 새로고침 로직이 필요 없음
    console.log('Cases are automatically synced with Convex');
  }, []);

  // 새 고객 추가 핸들러
  const handleAddCustomer = useCallback(() => {
    // 이미 임시저장된 새 고객이 있는지 확인
    const hasNewCustomer = cases.some(case_ => isNewCustomer(case_.id));
    if (hasNewCustomer) {
      toast.error('이미 등록 중인 새 고객이 있습니다. 먼저 저장하거나 취소해주세요.');
      return;
    }

    const newCustomerId = `new-customer-${Date.now()}`;
    const newCase: ClinicalCase = {
      id: newCustomerId,
      customerName: '',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0] || '',
      consentReceived: false,
      consentImageUrl: undefined,
      photos: [],
      customerInfo: {
        name: '',
        age: undefined,
        gender: undefined,
        products: [],
        skinTypes: [],
        memo: '',
      },
      roundCustomerInfo: {
        1: {
          treatmentType: '',
          products: [],
          skinTypes: [],
          memo: '',
          date: new Date().toISOString().split('T')[0],
        } as RoundCustomerInfo,
      },
      cureBooster: false,
      cureMask: false,
      premiumMask: false,
      allInOneSerum: false,
      skinRedSensitive: false,
      skinPigment: false,
      skinPore: false,
      skinTrouble: false,
      skinWrinkle: false,
      skinEtc: false,
    };

    setCases(prev => [newCase, ...prev]);
    setCurrentRounds(prev => ({ ...prev, [newCustomerId]: 1 }));
    setHasUnsavedNewCustomer(true);
  }, [cases, setCases, setCurrentRounds, setHasUnsavedNewCustomer, isNewCustomer]);

  // 새 고객 저장 핸들러
  const handleSaveNewCustomer = useCallback(
    async (caseId: string) => {
      const newCustomerCase = cases.find(c => c.id === caseId);
      if (!newCustomerCase || !isNewCustomer(caseId)) return;

      // 필수 정보 검증
      if (!newCustomerCase.customerInfo.name?.trim()) {
        toast.error('고객 이름을 입력해주세요.');
        return;
      }

      try {
        markSaving(caseId);

        // 1. 새 케이스 생성
        const createdCase = await createCase.mutateAsync({
          customerName: newCustomerCase.customerInfo.name,
          caseName: `${newCustomerCase.customerInfo.name} 임상 케이스`,
          concernArea: newCustomerCase.roundCustomerInfo[1]?.treatmentType || '',
          treatmentPlan: newCustomerCase.roundCustomerInfo[1]?.memo || '',
          consentReceived: newCustomerCase.consentReceived,
          // 체크박스 데이터는 metadata로 저장
          metadata: {
            cureBooster: newCustomerCase.cureBooster,
            cureMask: newCustomerCase.cureMask,
            premiumMask: newCustomerCase.premiumMask,
            allInOneSerum: newCustomerCase.allInOneSerum,
            skinRedSensitive: newCustomerCase.skinRedSensitive,
            skinPigment: newCustomerCase.skinPigment,
            skinPore: newCustomerCase.skinPore,
            skinTrouble: newCustomerCase.skinTrouble,
            skinWrinkle: newCustomerCase.skinWrinkle,
            skinEtc: newCustomerCase.skinEtc,
          },
        });

        const newCaseId = createdCase.id.toString();

        // 2. 회차별 고객 정보 저장
        // TODO: 라운드 정보 저장 mutation 구현 필요

        // 3. 로컬 상태 업데이트 (새 고객 → 실제 케이스로 변환)
        setCases(prev =>
          prev.map(case_ =>
            case_.id === caseId
              ? {
                  ...case_,
                  id: newCaseId,
                  createdAt: createdCase.createdAt,
                }
              : case_
          )
        );

        // 4. 현재 회차 정보 업데이트
        setCurrentRounds(prev => {
          const newRounds = { ...prev };
          delete newRounds[caseId];
          newRounds[newCaseId] = 1;
          return newRounds;
        });

        // 5. 임시저장 상태 해제
        setHasUnsavedNewCustomer(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('unsavedNewCustomer');
        }

        markSaved(newCaseId);
        toast.success('새 고객이 성공적으로 저장되었습니다.');
        console.log('새 고객 저장 완료:', newCaseId);
      } catch (error) {
        console.error('새 고객 저장 실패:', error);
        markError(caseId);
        toast.error('고객 저장에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [
      cases,
      setCases,
      setCurrentRounds,
      setHasUnsavedNewCustomer,
      markSaving,
      markSaved,
      markError,
      isNewCustomer,
      createCase,
    ]
  );

  // 케이스 삭제 핸들러
  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      if (isNewCustomer(caseId)) {
        handleDeleteNewCustomer(caseId);
        return;
      }

      try {
        await deleteCase.mutateAsync(caseId);

        // 로컬 상태에서 케이스 제거
        setCases(prev => prev.filter(case_ => case_.id !== caseId));

        // 현재 회차 정보도 제거
        setCurrentRounds(prev => {
          const newRounds = { ...prev };
          delete newRounds[caseId];
          return newRounds;
        });

        console.log('케이스가 성공적으로 삭제되었습니다.');
        toast.success('케이스가 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('케이스 삭제 실패:', error);
        toast.error('케이스 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, setCurrentRounds, isNewCustomer, deleteCase]
  );

  // 새 고객 삭제 핸들러
  const handleDeleteNewCustomer = useCallback(
    (caseId: string) => {
      setCases(prev => prev.filter(case_ => case_.id !== caseId));
      setCurrentRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[caseId];
        return newRounds;
      });
      setHasUnsavedNewCustomer(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('unsavedNewCustomer');
      }
    },
    [setCases, setCurrentRounds, setHasUnsavedNewCustomer]
  );

  // 전체 저장 핸들러
  const handleSaveAll = useCallback(
    async (caseId: string) => {
      if (isNewCustomer(caseId)) {
        await handleSaveNewCustomer(caseId);
      } else {
        console.log('기존 케이스는 실시간으로 저장됩니다.');
        toast.success('데이터가 저장되었습니다.');
      }
    },
    [handleSaveNewCustomer, isNewCustomer]
  );

  return {
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
    isNewCustomer,
    handleSaveAll,
  };
}
