'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  ClinicalCase,
  CustomerInfo,
  RoundCustomerInfo,
  RoundInfo,
  PhotoSlot,
  PhotoAngleSimple,
} from '@/types/clinical';
import { convertAngleToBackend } from '@/types/clinical';
import {
  useCreateClinicalCaseConvex,
  useUpdateClinicalCaseStatusConvex,
  useDeleteClinicalCaseConvex,
  useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoConvex,
  useUpdateClinicalCaseConvex,
  useSaveRoundCustomerInfoConvex,
} from '@/lib/clinical-photos-hooks';
import { Id } from '@/convex/_generated/dataModel';
import { retry, OptimisticUpdate, showErrorToast } from '@/lib/utils/error-handling';
import { validateField, isCaseDataComplete } from '@/lib/utils/validation';
import { useConcurrentModificationDetection } from '@/hooks/useConcurrentModificationDetection';

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
  profileId?: Id<'profiles'>; // 프로필 ID 추가
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
  profileId,
}: UseCustomerCaseHandlersParams) {
  const router = useRouter();

  // Convex mutations
  const createCase = useCreateClinicalCaseConvex();
  const updateCaseStatus = useUpdateClinicalCaseStatusConvex();
  const deleteCase = useDeleteClinicalCaseConvex();
  const uploadPhoto = useUploadClinicalPhotoConvex();
  const deletePhoto = useDeleteClinicalPhotoConvex();
  const updateCaseFields = useUpdateClinicalCaseConvex();
  const saveRoundInfo = useSaveRoundCustomerInfoConvex();

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
        // Convex에 상태 업데이트
        const convexStatus = status === 'active' ? 'in_progress' : 'completed';
        await updateCaseStatus.mutateAsync({
          caseId: caseId as Id<'clinical_cases'>,
          status: convexStatus,
          profileId,
        });

        // 로컬 상태 업데이트
        setCases(prev => prev.map(case_ => (case_.id === caseId ? { ...case_, status } : case_)));

        console.log(`케이스 상태가 ${status}로 변경되었습니다.`);
      } catch (error) {
        console.error('케이스 상태 변경 실패:', error);
        toast.error('케이스 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, updateCaseStatus]
  );

  // 동의서 상태 변경 핸들러
  const handleConsentChange = useCallback(
    async (caseId: string, consentReceived: boolean) => {
      try {
        // 로컬 상태 업데이트 (낙관적 업데이트)
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

        // Convex에 상태 업데이트
        markSaving(caseId);
        try {
          await updateCaseFields.mutateAsync({
            caseId: caseId as Id<'clinical_cases'>,
            updates: {
              consent_status: consentReceived ? 'consented' : 'no_consent',
              consent_date: consentReceived ? Date.now() : undefined,
            },
            profileId: profileId as Id<'profiles'> | undefined,
          });
          markSaved(caseId);
          toast.success(`동의서 상태가 ${consentReceived ? '동의' : '미동의'}로 변경되었습니다.`);
        } catch (error) {
          markError(caseId);
          // 실패 시 롤백
          setCases(prev =>
            prev.map(case_ =>
              case_.id === caseId
                ? {
                    ...case_,
                    consentReceived: !consentReceived,
                    ...(consentReceived === true ? { consentImageUrl: undefined } : {}),
                  }
                : case_
            )
          );
          throw error;
        }
      } catch (error) {
        console.error('동의서 상태 변경 실패:', error);
        toast.error('동의서 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, updateCaseFields, markSaving, markSaved, markError, profileId]
  );

  // 사진 업로드 핸들러
  const handlePhotoUpload = useCallback(
    async (caseId: string, roundDay: number, angle: string, file: File) => {
      if (file) {
        try {
          // Convex에 사진 업로드
          const uploadedPhoto = await uploadPhoto.mutateAsync({
            caseId,
            roundNumber: roundDay,
            angle,
            file,
            profileId, // profileId 추가
          });

          // 로컬 상태 업데이트
          setCases(prev =>
            prev.map(case_ => {
              if (case_.id === caseId) {
                // 기존 사진 찾기 (안전 접근)
                const existingPhotoIndex = (case_.photos ?? []).findIndex(
                  p => p.roundDay === roundDay && p.angle === angle
                );

                const updatedPhotos = [...(case_.photos ?? [])];
                const newPhoto: PhotoSlot = {
                  id: `${caseId}-${roundDay}-${angle}`,
                  roundDay,
                  angle: convertAngleToBackend(angle as PhotoAngleSimple), // ✅ 변환 함수 사용
                  imageUrl: URL.createObjectURL(file), // 임시 URL 사용
                  uploaded: true,
                  photoId: uploadedPhoto as unknown as string,
                };

                if (existingPhotoIndex >= 0) {
                  updatedPhotos[existingPhotoIndex] = newPhoto;
                } else {
                  updatedPhotos.push(newPhoto);
                }

                return { ...case_, photos: updatedPhotos };
              }
              return case_;
            })
          );

          console.log(`사진이 업로드되었습니다: Round ${roundDay}, ${angle}`);
          toast.success('사진이 업로드되었습니다.');
        } catch (error) {
          console.error('사진 업로드 실패:', error);
          toast.error('사진 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      }
    },
    [setCases, uploadPhoto]
  );

  // 사진 삭제 핸들러
  const handlePhotoDelete = useCallback(
    async (caseId: string, roundDay: number, angle: string) => {
      try {
        // 사진 ID 찾기 (안전 접근)
        const targetCase = cases.find(c => c.id === caseId);
        const targetPhoto = targetCase?.photos?.find(
          p => p.roundDay === roundDay && p.angle === angle
        );

        if (targetPhoto?.photoId) {
          // Convex에서 사진 삭제
          await deletePhoto.mutateAsync(targetPhoto.photoId);
        }

        // 로컬 상태에서 사진 제거 (안전 접근)
        setCases(prev =>
          prev.map(case_ => {
            if (case_.id === caseId) {
              const updatedPhotos = (case_.photos ?? []).filter(
                p => !(p.roundDay === roundDay && p.angle === angle)
              );
              return { ...case_, photos: updatedPhotos };
            }
            return case_;
          })
        );

        console.log(`사진이 삭제되었습니다: Round ${roundDay}, ${angle}`);
        toast.success('사진이 삭제되었습니다.');
      } catch (error) {
        console.error('사진 삭제 실패:', error);
        toast.error('사진 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [cases, setCases, deletePhoto]
  );

  // 기본 고객 정보 업데이트 핸들러 - 개선된 검증과 에러 처리
  const handleBasicCustomerInfoUpdate = useCallback(
    (caseId: string, field: keyof CustomerInfo, value: any) => {
      // 입력값 검증 (빈 값은 허용하되, 유효하지 않은 값만 검증)
      if (value && value.toString().trim()) {
        const validationError = validateField(field === 'name' ? 'customerName' : field, value);
        if (validationError && !validationError.includes('입력하세요')) {
          toast.error(validationError);
          return;
        }
      }

      // 이전 값 저장 (롤백용)
      const previousCase = cases.find(c => c.id === caseId);
      if (!previousCase) return;

      const previousValue = previousCase.customerInfo?.[field];
      const previousCustomerName = previousCase.customerName;

      // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
      setCases(prev =>
        prev.map(case_ => {
          if (case_.id === caseId) {
            const updatedCase = {
              ...case_,
              customerInfo: { ...(case_.customerInfo ?? {}), [field]: value },
              customerName: field === 'name' ? value : case_.customerName,
            };
            return updatedCase;
          }
          return case_;
        })
      );

      // 디바운싱으로 Convex에 저장
      debouncedUpdate(`customer-info-${caseId}-${field}`, async () => {
        if (!isComposing) {
          markSaving(caseId);
          try {
            // 현재 케이스 데이터 가져오기
            const currentCase = cases.find(c => c.id === caseId);
            if (!currentCase) {
              throw new Error('Case not found');
            }

            // 메타데이터 구성
            const updatedMetadata = {
              ...currentCase.metadata,
              customerInfo: {
                ...currentCase.metadata?.customerInfo,
                [field]: value,
              },
            };

            // 재시도 로직과 함께 Convex에 업데이트
            await retry(
              async () =>
                updateCaseFields.mutateAsync({
                  caseId: caseId as Id<'clinical_cases'>,
                  updates: {
                    name: field === 'name' ? value : undefined,
                    gender: field === 'gender' ? value : undefined,
                    age: field === 'age' ? value : undefined,
                    metadata: updatedMetadata,
                  },
                  profileId: profileId as Id<'profiles'> | undefined,
                }),
              {
                maxAttempts: 2,
                delay: 500,
              }
            );
            markSaved(caseId);
          } catch (error) {
            markError(caseId);

            // 실패 시 롤백
            setCases(prev =>
              prev.map(case_ => {
                if (case_.id === caseId) {
                  return {
                    ...case_,
                    customerInfo: { ...case_.customerInfo, [field]: previousValue },
                    customerName: field === 'name' ? previousCustomerName : case_.customerName,
                  };
                }
                return case_;
              })
            );

            showErrorToast(error, '고객 정보 저장에 실패했습니다.');
          }
        }
      });
    },
    [
      setCases,
      cases,
      markSaving,
      markSaved,
      markError,
      isComposing,
      debouncedUpdate,
      updateCaseFields,
      profileId,
    ]
  );

  // 회차별 고객 정보 업데이트 핸들러
  const handleRoundCustomerInfoUpdate = useCallback(
    (
      caseId: string,
      roundNumber: number,
      field: keyof RoundInfo, // ✅ RoundInfo 타입으로 변경
      value: any,
      currentRounds: { [key: string]: number }
    ) => {
      enqueue(caseId, async () => {
        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ => {
            if (case_.id === caseId) {
              const currentRoundInfo = case_.roundCustomerInfo?.[roundNumber] || {
                products: [],
                skinTypes: [],
                memo: '',
                date: new Date().toISOString().split('T')[0],
              };

              const updatedRoundInfo = {
                ...(case_.roundCustomerInfo ?? {}),
                [roundNumber]: {
                  ...currentRoundInfo,
                  [field]: value,
                },
              };
              return { ...case_, roundCustomerInfo: updatedRoundInfo };
            }
            return case_;
          })
        );

        // 디바운싱으로 Convex에 저장
        debouncedUpdate(`round-info-${caseId}-${roundNumber}-${field}`, async () => {
          if (!isComposing) {
            markSaving(caseId);
            try {
              // 현재 케이스 데이터 가져오기
              const currentCase = cases.find(c => c.id === caseId);
              if (!currentCase) {
                throw new Error('Case not found');
              }

              // 회차별 정보 구성 (안전 접근)
              const currentRoundInfo = currentCase.roundCustomerInfo?.[roundNumber] || {
                products: [],
                skinTypes: [],
                memo: '',
                date: new Date().toISOString().split('T')[0],
              };

              const updatedRoundInfo = {
                ...currentRoundInfo,
                [field]: value,
              };

              // saveRoundInfo mutation 사용하여 라운드별 정보 저장
              await saveRoundInfo.mutateAsync({
                caseId: caseId as Id<'clinical_cases'>,
                roundNumber: roundNumber,
                info: {
                  age: currentCase.customerInfo?.age,
                  gender: currentCase.customerInfo?.gender,
                  treatmentType: updatedRoundInfo.treatmentType,
                  treatmentDate: updatedRoundInfo.date,
                  products: updatedRoundInfo.products || [],
                  skinTypes: updatedRoundInfo.skinTypes || [],
                  memo: updatedRoundInfo.memo || '',
                },
                profileId: profileId as Id<'profiles'> | undefined,
              });
              markSaved(caseId);
            } catch (error) {
              markError(caseId);
              console.error('회차 정보 업데이트 실패:', error);
              console.error('caseId:', caseId);
              console.error('field:', field);
              console.error('value:', value);
              console.error('profileId:', profileId);
              const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
              toast.error(`회차 정보 저장 실패: ${errorMessage}`);
            }
          }
        });
      });
    },
    [
      setCases,
      cases,
      enqueue,
      markSaving,
      markSaved,
      markError,
      isComposing,
      debouncedUpdate,
      updateCaseFields,
      profileId,
    ]
  );

  // 체크박스 업데이트 핸들러
  const updateCaseCheckboxes = useCallback(
    (caseId: string, checkboxes: Partial<ClinicalCase>) => {
      // 로컬 상태 업데이트
      setCases(prev =>
        prev.map(case_ => (case_.id === caseId ? { ...case_, ...checkboxes } : case_))
      );

      // Convex에 저장
      debouncedUpdate(`checkboxes-${caseId}`, async () => {
        try {
          // 현재 케이스 데이터 가져오기
          const currentCase = cases.find(c => c.id === caseId);
          if (!currentCase) {
            throw new Error('Case not found');
          }

          // 체크박스 필드만 추출
          const checkboxFields = {
            cureBooster: checkboxes.cureBooster,
            cureMask: checkboxes.cureMask,
            premiumMask: checkboxes.premiumMask,
            allInOneSerum: checkboxes.allInOneSerum,
            skinRedSensitive: checkboxes.skinRedSensitive,
            skinPigment: checkboxes.skinPigment,
            skinPore: checkboxes.skinPore,
            skinTrouble: checkboxes.skinTrouble,
            skinWrinkle: checkboxes.skinWrinkle,
            skinEtc: checkboxes.skinEtc,
          };

          // undefined 값 제거
          const filteredCheckboxes = Object.entries(checkboxFields).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {} as any);

          // 메타데이터 구성
          const updatedMetadata = {
            ...currentCase.metadata,
            ...filteredCheckboxes,
          };

          await updateCaseFields.mutateAsync({
            caseId: caseId as Id<'clinical_cases'>,
            updates: {
              metadata: updatedMetadata,
            },
            profileId: profileId as Id<'profiles'> | undefined,
          });
        } catch (error) {
          console.error('체크박스 업데이트 실패:', error);
          console.error('caseId:', caseId);
          console.error('checkboxes:', checkboxes);
          console.error('profileId:', profileId);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          toast.error(`체크박스 저장 실패: ${errorMessage}`);
        }
      });
    },
    [setCases, cases, updateCaseFields, debouncedUpdate, profileId]
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
    toast.info('데이터가 실시간으로 동기화됩니다.');
  }, []);

  // 새 고객 추가 핸들러 - 개선된 에러 처리와 재시도
  const handleAddCustomer = useCallback(async () => {
    console.log('[handleAddCustomer] 시작');

    if (!user) {
      console.error('[handleAddCustomer] 사용자 없음');
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!profileId) {
      console.error('[handleAddCustomer] 프로필 ID 없음');
      toast.error('프로필 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('[handleAddCustomer] 프로필 ID:', profileId);

    // 낙관적 업데이트 준비
    const tempId = `temp-${Date.now()}`;
    const tempCase: ClinicalCase = {
      id: tempId,
      customerName: '새 고객', // 빈 문자열 대신 기본값 설정
      status: 'active',
      createdAt: new Date().toISOString(),
      consentReceived: false,
      photos: [],
      customerInfo: {
        name: '새 고객', // 빈 문자열 대신 기본값 설정
        age: undefined,
        gender: undefined,
        products: [],
        skinTypes: [],
        memo: '',
      },
      roundCustomerInfo: {
        1: {
          name: '새 고객', // ✅ 기본값 추가
          treatmentType: '',
          products: [], // ✅ 기본값 유지
          skinTypes: [], // ✅ 기본값 유지
          memo: '',
          date: new Date().toISOString().split('T')[0],
        },
      },
    };

    // 낙관적 업데이트 적용
    setCases(prev => [tempCase, ...prev]);
    setCurrentRounds(prev => ({ ...prev, [tempId]: 1 }));

    try {
      console.log('[handleAddCustomer] Convex mutation 호출 중...', {
        customerName: '새 고객',
        profileId: profileId,
      });

      // 재시도 로직과 함께 Convex에 케이스 생성
      const newCase = await retry(
        async () =>
          createCase.mutateAsync({
            profileId, // profileId를 객체 내부로 이동
            customerName: '새 고객', // 빈 문자열 대신 기본값 설정
            caseName: '새 고객 케이스',
            concernArea: '',
            treatmentPlan: '',
            consentReceived: false,
            metadata: {
              // 기본 고객 정보
              customerInfo: {
                name: '새 고객', // 빈 문자열 대신 기본값 설정
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
                },
              },
            },
          }),
        {
          maxAttempts: 3,
          onRetry: attempt => {
            toast.loading(`새 고객 추가 중... (재시도 ${attempt}/3)`);
          },
        }
      );

      console.log('[handleAddCustomer] Convex mutation 성공:', newCase);

      // 성공 시 임시 ID를 실제 ID로 교체
      setCases(prev =>
        prev.map(c =>
          c.id === tempId ? { ...c, id: newCase!._id, customerName: newCase!.name } : c
        )
      );
      setCurrentRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[tempId];
        newRounds[newCase!._id] = 1;
        return newRounds;
      });

      toast.success('새 고객이 추가되었습니다.');
    } catch (error) {
      console.error('[handleAddCustomer] 에러 발생:', error);
      console.error('[handleAddCustomer] 에러 상세:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        data: (error as any)?.data,
      });

      // 낙관적 업데이트 롤백
      setCases(prev => prev.filter(c => c.id !== tempId));
      setCurrentRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[tempId];
        return newRounds;
      });

      // 사용자에게 구체적인 에러 메시지 표시
      showErrorToast(error, '새 고객 추가에 실패했습니다.');
    }
  }, [user, profileId, createCase, setCases, setCurrentRounds]);

  // 케이스 삭제 핸들러 - 개선된 낙관적 업데이트와 에러 처리
  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      // 삭제할 케이스 백업 (롤백용)
      const caseToDelete = cases.find(c => c.id === caseId);
      const currentRound = currentRounds[caseId];

      if (!caseToDelete) return;

      // 낙관적 업데이트 - 즉시 UI에서 제거
      setCases(prev => prev.filter(case_ => case_.id !== caseId));
      setCurrentRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[caseId];
        return newRounds;
      });

      try {
        // 재시도 로직과 함께 Convex에서 삭제
        await retry(
          async () =>
            deleteCase.mutateAsync({
              caseId: caseId as Id<'clinical_cases'>,
              profileId,
            }),
          {
            maxAttempts: 2,
            delay: 500,
            onRetry: attempt => {
              toast.loading(`케이스 삭제 중... (재시도 ${attempt}/2)`);
            },
          }
        );

        toast.success('케이스가 삭제되었습니다.');
      } catch (error) {
        // 실패 시 롤백
        setCases(prev =>
          [...prev, caseToDelete].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
        );
        if (currentRound !== undefined) {
          setCurrentRounds(prev => ({ ...prev, [caseId]: currentRound }));
        }

        showErrorToast(error, '케이스 삭제에 실패했습니다.');
      }
    },
    [deleteCase, setCases, setCurrentRounds, cases, currentRounds]
  );

  // 전체 저장 핸들러 - 단순화 (실시간 저장이므로 확인 메시지만)
  const handleSaveAll = useCallback(async (caseId: string) => {
    toast.success('모든 변경사항이 자동으로 저장되었습니다.');
  }, []);

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
    handleDeleteCase,
    handleSaveAll,
  };
}
