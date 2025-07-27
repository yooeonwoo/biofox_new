'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ClinicalCase, CustomerInfo, RoundCustomerInfo } from '@/types/clinical';
import {
  useUpdateClinicalCaseStatusConvex,
  useUploadClinicalPhotoConvex,
  useDeleteClinicalPhotoConvex,
} from '@/lib/clinical-photos-hooks';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface UsePersonalCaseHandlersParams {
  user: any;
  cases: ClinicalCase[];
  setCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  currentRound: number;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
  isComposing: boolean;
  debouncedUpdate: (key: string, updateFn: () => void, delay?: number) => void;
  saveStatus: { [caseId: string]: 'idle' | 'saving' | 'saved' | 'error' };
  markSaving: (caseId: string) => void;
  markSaved: (caseId: string) => void;
  markError: (caseId: string) => void;
  enqueue: (caseId: string, task: () => Promise<void>) => Promise<void>;
  hasUnsavedPersonalCase: boolean;
  setHasUnsavedPersonalCase: React.Dispatch<React.SetStateAction<boolean>>;
  profileId?: Id<'profiles'>; // 프로필 ID 추가
}

/**
 * Personal 페이지 전용 핸들러 집합
 * - 본인 케이스만 처리
 * - 케이스 1개 제한
 */
export function usePersonalCaseHandlers({
  user,
  cases,
  setCases,
  currentRound,
  setCurrentRound,
  isComposing,
  debouncedUpdate,
  saveStatus,
  markSaving,
  markSaved,
  markError,
  enqueue,
  hasUnsavedPersonalCase,
  setHasUnsavedPersonalCase,
  profileId,
}: UsePersonalCaseHandlersParams) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 새 개인 케이스 여부 확인 함수
  const isNewPersonalCase = useCallback((caseId: string) => caseId.startsWith('new-personal-'), []);

  // 로그아웃 함수
  const handleSignOut = useCallback(async () => {
    try {
      // 개발환경에서는 localStorage 클리어
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dev-user');
      }
      router.push('/signin');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  }, [router]);

  // Convex mutations
  const updateCaseStatus = useUpdateClinicalCaseStatusConvex();
  const updateCase = useMutation(api.clinical.updateClinicalCase);
  const uploadPhoto = useUploadClinicalPhotoConvex();
  const deletePhoto = useDeleteClinicalPhotoConvex();
  const saveRoundInfo = useMutation(api.clinical.saveRoundCustomerInfo);

  // 개인 케이스 상태 변경 핸들러
  const handleCaseStatusChange = useCallback(
    async (caseId: string, status: 'active' | 'completed') => {
      try {
        // 새 개인 케이스가 아닌 경우에만 실제 API 호출
        if (!isNewPersonalCase(caseId)) {
          const convexStatus = status === 'active' ? 'in_progress' : 'completed';
          await updateCaseStatus.mutateAsync({
            caseId,
            status: convexStatus,
          });
        }

        // 로컬 상태 업데이트
        setCases(prev => prev.map(case_ => (case_.id === caseId ? { ...case_, status } : case_)));

        console.log(`개인 케이스 상태가 ${status}로 변경되었습니다.`);
      } catch (error) {
        console.error('개인 케이스 상태 변경 실패:', error);
        toast.error('케이스 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [setCases, isNewPersonalCase]
  );

  // 동의서 상태 변경 핸들러
  const handleConsentChange = useCallback(
    async (caseId: string, consentReceived: boolean) => {
      try {
        // 새 개인 케이스가 아닌 경우에만 실제 API 호출
        if (!isNewPersonalCase(caseId)) {
          await updateCase({
            caseId: caseId as Id<'clinical_cases'>,
            updates: {
              consent_status: consentReceived ? 'consented' : 'no_consent',
              consent_date: consentReceived ? Date.now() : undefined,
            },
          });
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
    [setCases, isNewPersonalCase]
  );

  // 사진 업로드 핸들러
  const handlePhotoUpload = useCallback(
    async (caseId: string, roundDay: number, angle: string, file?: File): Promise<void> => {
      console.log('Personal photo upload:', { caseId, roundDay, angle });

      if (file) {
        try {
          let imageUrl: string;

          // 새 개인 케이스인 경우 임시 처리
          if (isNewPersonalCase(caseId)) {
            imageUrl = URL.createObjectURL(file);

            // 해당 케이스의 사진 업데이트 (새 개인 케이스)
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
            // 실제 개인 케이스의 경우 Convex에 업로드
            const result = await uploadPhoto.mutateAsync({
              caseId,
              roundNumber: roundDay,
              angle,
              file,
              profileId, // profileId 전달
            });
            console.log('Upload result:', result);

            // 업로드 성공 후 사진 URL 설정
            imageUrl = URL.createObjectURL(file); // 임시 URL, 실제로는 Convex에서 받은 URL 사용

            // 로컬 상태 업데이트
            setCases(prev =>
              prev.map(case_ => {
                if (case_.id === caseId) {
                  const existingPhotoIndex = case_.photos.findIndex(
                    p => p.roundDay === roundDay && p.angle === angle
                  );

                  const newPhoto = {
                    id: `${caseId}-${roundDay}-${angle}`,
                    roundDay: roundDay,
                    angle: angle as 'front' | 'left' | 'right',
                    imageUrl: imageUrl,
                    uploaded: true,
                    photoId: typeof result === 'string' ? result : (result as any)?._id || '', // Convex에서 받은 ID 저장
                  };

                  let updatedPhotos;
                  if (existingPhotoIndex >= 0) {
                    updatedPhotos = [...case_.photos];
                    updatedPhotos[existingPhotoIndex] = newPhoto;
                  } else {
                    updatedPhotos = [...case_.photos, newPhoto];
                  }

                  return { ...case_, photos: updatedPhotos };
                }
                return case_;
              })
            );
          }

          console.log('개인 사진이 성공적으로 업로드되었습니다.');
          toast.success('사진이 성공적으로 업로드되었습니다.');
        } catch (error) {
          console.error('개인 사진 업로드 실패:', error);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          toast.error(`사진 업로드 실패: ${errorMessage}`);

          // 상세 오류 정보 로깅
          if (error instanceof Error) {
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          }
          throw error;
        }
      }
    },
    [setCases, isNewPersonalCase]
  );

  // 사진 삭제 핸들러
  const handlePhotoDelete = useCallback(
    async (caseId: string, roundDay: number, angle: string): Promise<void> => {
      try {
        // 새 개인 케이스가 아닌 경우에만 실제 삭제 API 호출
        if (!isNewPersonalCase(caseId)) {
          // 사진을 찾아서 삭제
          const case_ = cases.find(c => c.id === caseId);
          const photo = case_?.photos.find(p => p.roundDay === roundDay && p.angle === angle);

          if (photo?.photoId) {
            await deletePhoto.mutateAsync(photo.photoId);
          }

          // 로컬 상태에서 사진 제거
          setCases(prev =>
            prev.map(case_ => {
              if (case_.id === caseId) {
                const updatedPhotos = case_.photos.filter(
                  p => !(p.roundDay === roundDay && p.angle === angle)
                );
                return { ...case_, photos: updatedPhotos };
              }
              return case_;
            })
          );
        } else {
          // 새 개인 케이스의 경우 로컬 상태만 업데이트
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

        console.log('개인 사진이 성공적으로 삭제되었습니다.');
        toast.success('사진이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('개인 사진 삭제 실패:', error);
        toast.error('사진 삭제에 실패했습니다. 다시 시도해주세요.');
        throw error;
      }
    },
    [setCases, isNewPersonalCase]
  );

  // 기본 개인정보 업데이트 핸들러 (나이, 성별) - IME 처리 개선
  const handleBasicPersonalInfoUpdate = useCallback(
    async (caseId: string, personalInfo: Partial<Pick<CustomerInfo, 'age' | 'gender'>>) => {
      markSaving(caseId);
      try {
        // IME 입력 중이면 로컬 상태만 업데이트
        if (isComposing) {
          setCases(prev =>
            prev.map(case_ =>
              case_.id === caseId
                ? {
                    ...case_,
                    customerInfo: { ...case_.customerInfo, ...personalInfo },
                  }
                : case_
            )
          );
          return;
        }

        // 새 개인 케이스가 아닌 경우에만 실제 API 호출
        if (!isNewPersonalCase(caseId)) {
          // 나이, 성별이 있으면 round_customer_info에 저장
          if (personalInfo.age !== undefined || personalInfo.gender !== undefined) {
            await saveRoundInfo({
              caseId: caseId as Id<'clinical_cases'>,
              roundNumber: currentRound,
              info: {
                age: personalInfo.age,
                gender: personalInfo.gender,
              },
            });
          }
        }

        // 로컬 상태 업데이트
        setCases(prev =>
          prev.map(case_ =>
            case_.id === caseId
              ? {
                  ...case_,
                  customerInfo: { ...case_.customerInfo, ...personalInfo },
                  roundCustomerInfo: {
                    ...case_.roundCustomerInfo,
                    [currentRound]: {
                      treatmentType: '',
                      products: [],
                      skinTypes: [],
                      memo: '',
                      date: '',
                      ...case_.roundCustomerInfo[currentRound],
                      age:
                        personalInfo.age !== undefined
                          ? personalInfo.age
                          : case_.roundCustomerInfo[currentRound]?.age,
                      gender:
                        personalInfo.gender !== undefined
                          ? personalInfo.gender
                          : case_.roundCustomerInfo[currentRound]?.gender,
                    },
                  },
                }
              : case_
          )
        );

        markSaved(caseId);
        console.log('기본 개인 정보가 업데이트되었습니다.');
      } catch (error) {
        console.error('기본 개인 정보 업데이트 실패:', error);
        markError(caseId);
        // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
      }
    },
    [setCases, currentRound, markSaving, markSaved, markError, isComposing, isNewPersonalCase]
  );

  // 회차별 개인정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모) - IME 처리 개선
  const handleRoundPersonalInfoUpdate = useCallback(
    async (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
      markSaving(caseId);
      try {
        // IME 입력 중이면 로컬 상태만 업데이트
        if (isComposing && roundInfo.memo !== undefined) {
          setCases(prev =>
            prev.map(case_ =>
              case_.id === caseId
                ? {
                    ...case_,
                    roundCustomerInfo: {
                      ...case_.roundCustomerInfo,
                      [roundDay]: {
                        treatmentType: '',
                        products: [],
                        skinTypes: [],
                        memo: '',
                        date: '',
                        ...case_.roundCustomerInfo[roundDay],
                        ...roundInfo,
                      },
                    },
                  }
                : case_
            )
          );
          markSaved(caseId);
          return;
        }

        // 새 개인 케이스가 아닌 경우에만 실제 API 호출
        if (!isNewPersonalCase(caseId)) {
          await enqueue(caseId, async () => {
            // 메모가 있으면 케이스 업데이트
            if (roundInfo.memo !== undefined) {
              await updateCase({
                caseId: caseId as Id<'clinical_cases'>,
                updates: {
                  treatment_plan: roundInfo.memo,
                },
              });
            }

            // 라운드 정보 저장
            const roundData: any = {};
            if (roundInfo.age !== undefined) roundData.age = roundInfo.age;
            if (roundInfo.gender !== undefined) roundData.gender = roundInfo.gender;
            if (roundInfo.treatmentType !== undefined)
              roundData.treatmentType = roundInfo.treatmentType;
            if (roundInfo.date !== undefined && typeof roundInfo.date === 'string')
              roundData.treatmentDate = roundInfo.date;
            if (roundInfo.products !== undefined) roundData.products = roundInfo.products;
            if (roundInfo.skinTypes !== undefined) roundData.skinTypes = roundInfo.skinTypes;
            if (roundInfo.memo !== undefined) roundData.memo = roundInfo.memo;

            await saveRoundInfo({
              caseId: caseId as Id<'clinical_cases'>,
              roundNumber: roundDay,
              info: roundData,
            });
          });
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
                      products: [],
                      skinTypes: [],
                      memo: '',
                      date: '',
                      ...case_.roundCustomerInfo[roundDay],
                      ...roundInfo,
                    },
                  },
                }
              : case_
          )
        );

        markSaved(caseId);
        console.log('회차별 개인 정보가 업데이트되었습니다.');
      } catch (error) {
        console.error('회차별 개인 정보 업데이트 실패:', error);
        markError(caseId);
        // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
      }
    },
    [setCases, enqueue, markSaving, markSaved, markError, isComposing, isNewPersonalCase]
  );

  // 개인 케이스 추가 핸들러 (Personal은 1개만 허용)
  const handleAddPersonalCase = useCallback(async () => {
    // Personal 페이지에서는 케이스를 1개만 허용
    if (cases.length > 0) {
      toast.warning('본인 케이스는 1개만 생성할 수 있습니다.');
      return;
    }

    const newCaseId = `new-personal-${Date.now()}`;
    const newPersonalCase: ClinicalCase = {
      id: newCaseId,
      customerName: '본인',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0] || '',
      consentReceived: false,
      photos: [],
      customerInfo: {
        name: '본인',
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

    setCases([newPersonalCase]);
    setCurrentRound(1);
    setHasUnsavedPersonalCase(true);

    console.log('새 개인 케이스가 추가되었습니다.');
    toast.success('새 개인 케이스가 추가되었습니다.');
  }, [cases.length, setCases, setCurrentRound, setHasUnsavedPersonalCase]);

  return {
    // 핸들러들
    handleSignOut,
    handleCaseStatusChange,
    handleConsentChange,
    handlePhotoUpload,
    handlePhotoDelete,
    handleBasicPersonalInfoUpdate,
    handleRoundPersonalInfoUpdate,
    handleAddPersonalCase,

    // 헬퍼 함수들
    isNewPersonalCase,
  };
}
