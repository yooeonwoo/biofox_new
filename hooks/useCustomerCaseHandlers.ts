'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ClinicalCase, CustomerInfo, RoundCustomerInfo } from '@/types/clinical';

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
 * Customer 페이지 전용 핸들러 집합
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

  // 새 고객 여부 확인 함수
  const isNewCustomer = useCallback((caseId: string) => caseId.startsWith('new-customer-'), []);

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

  // 케이스 상태 변경 핸들러
  const handleCaseStatusChange = useCallback(async (caseId: string, status: 'active' | 'completed') => {
    try {
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        const { updateCase } = await import('@/lib/clinical-photos-api');
        await updateCase(parseInt(caseId), { status });
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId ? { ...case_, status } : case_
      ));
      
      console.log(`케이스 상태가 ${status}로 변경되었습니다.`);
    } catch (error) {
      console.error('케이스 상태 변경 실패:', error);
      toast.error('케이스 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  }, [setCases, isNewCustomer]);

  // 동의서 상태 변경 핸들러
  const handleConsentChange = useCallback(async (caseId: string, consentReceived: boolean) => {
    try {
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        const { updateCase } = await import('@/lib/clinical-photos-api');
        await updateCase(parseInt(caseId), { consentReceived });
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_, 
              consentReceived,
              // 동의가 false로 변경되면 관련 데이터도 리셋
              ...(consentReceived === false ? { consentImageUrl: undefined } : {})
            }
          : case_
      ));
      
      console.log(`동의서 상태가 ${consentReceived ? '동의' : '미동의'}로 변경되었습니다.`);
    } catch (error) {
      console.error('동의서 상태 변경 실패:', error);
      toast.error('동의서 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  }, [setCases, isNewCustomer]);

  // 사진 업로드 핸들러
  const handlePhotoUpload = useCallback(async (caseId: string, roundDay: number, angle: string, file?: File): Promise<void> => {
    console.log('Photo upload:', { caseId, roundDay, angle });
    
    if (file) {
      try {
        let imageUrl: string;
        
        // 새 고객인 경우 임시 처리
        if (isNewCustomer(caseId)) {
          imageUrl = URL.createObjectURL(file);
          
          // 해당 케이스의 사진 업데이트 (새 고객)
          setCases(prev => prev.map(case_ => {
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
                uploaded: true
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
                photos: updatedPhotos
              };
            }
            return case_;
          }));
        } else {
          // 실제 케이스의 경우 Supabase에 업로드
          const { uploadPhoto, fetchPhotos } = await import('@/lib/clinical-photos-api');
          imageUrl = await uploadPhoto(parseInt(caseId), roundDay, angle, file);
          console.log('Received imageUrl from upload:', imageUrl);
          
          // 업로드 성공 후 해당 케이스의 사진 목록을 데이터베이스에서 다시 불러오기
          try {
            const updatedPhotos = await fetchPhotos(parseInt(caseId));
            const photoSlots = updatedPhotos.map(p => ({
              id: p.id,
              roundDay: p.roundDay,
              angle: p.angle as 'front' | 'left' | 'right',
              imageUrl: p.imageUrl,
              uploaded: true
            }));
            
            // 해당 케이스의 사진만 업데이트
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, photos: photoSlots }
                : case_
            ));
            
            console.log('사진 목록을 데이터베이스에서 새로고침했습니다.');
          } catch (refreshError) {
            console.error('사진 목록 새로고침 실패:', refreshError);
            // 새로고침 실패 시 기존 방식으로 로컬 업데이트
            setCases(prev => prev.map(case_ => {
              if (case_.id === caseId) {
                const existingPhotoIndex = case_.photos.findIndex(
                  p => p.roundDay === roundDay && p.angle === angle
                );
                
                const newPhoto = {
                  id: `${caseId}-${roundDay}-${angle}`,
                  roundDay: roundDay,
                  angle: angle as 'front' | 'left' | 'right',
                  imageUrl: imageUrl,
                  uploaded: true
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
            }));
          }
        }
        
        console.log('사진이 성공적으로 업로드되었습니다.');
        toast.success('사진이 성공적으로 업로드되었습니다.');
      } catch (error) {
        console.error('사진 업로드 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        toast.error(`사진 업로드 실패: ${errorMessage}`);
        
        // 상세 오류 정보 로깅
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        throw error;
      }
    }
  }, [setCases, isNewCustomer]);

  // 사진 삭제 핸들러
  const handlePhotoDelete = useCallback(async (caseId: string, roundDay: number, angle: string): Promise<void> => {
    try {
      // 새 고객이 아닌 경우에만 실제 삭제 API 호출
      if (!isNewCustomer(caseId)) {
        const { deletePhoto, fetchPhotos } = await import('@/lib/clinical-photos-api');
        await deletePhoto(parseInt(caseId), roundDay, angle);
        
        // 삭제 성공 후 해당 케이스의 사진 목록을 데이터베이스에서 다시 불러오기
        try {
          const updatedPhotos = await fetchPhotos(parseInt(caseId));
          const photoSlots = updatedPhotos.map(p => ({
            id: p.id,
            roundDay: p.roundDay,
            angle: p.angle as 'front' | 'left' | 'right',
            imageUrl: p.imageUrl,
            uploaded: true
          }));
          
          // 해당 케이스의 사진만 업데이트
          setCases(prev => prev.map(case_ => 
            case_.id === caseId 
              ? { ...case_, photos: photoSlots }
              : case_
          ));
          
          console.log('사진 목록을 데이터베이스에서 새로고침했습니다.');
        } catch (refreshError) {
          console.error('사진 목록 새로고침 실패:', refreshError);
          // 새로고침 실패 시 기존 방식으로 로컬 업데이트
          setCases(prev => prev.map(case_ => {
            if (case_.id === caseId) {
              const updatedPhotos = case_.photos.filter(
                p => !(p.roundDay === roundDay && p.angle === angle)
              );
              return { ...case_, photos: updatedPhotos };
            }
            return case_;
          }));
        }
      } else {
        // 새 고객의 경우 로컬 상태만 업데이트
        setCases(prev => prev.map(case_ => {
          if (case_.id === caseId) {
            const updatedPhotos = case_.photos.filter(
              p => !(p.roundDay === roundDay && p.angle === angle)
            );
            return {
              ...case_,
              photos: updatedPhotos
            };
          }
          return case_;
        }));
      }
      
      console.log('사진이 성공적으로 삭제되었습니다.');
      toast.success('사진이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      toast.error('사진 삭제에 실패했습니다. 다시 시도해주세요.');
      throw error;
    }
  }, [setCases, isNewCustomer]);

  // 기본 고객정보 업데이트 핸들러 (이름, 나이, 성별) - IME 처리 개선
  const handleBasicCustomerInfoUpdate = useCallback(async (caseId: string, customerInfo: Partial<Pick<CustomerInfo, 'name' | 'age' | 'gender'>>) => {
    markSaving(caseId);
    try {
      // IME 입력 중이면 로컬 상태만 업데이트
      if (isComposing && customerInfo.name !== undefined) {
        setCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { 
                ...case_, 
                customerName: customerInfo.name || case_.customerName,
                customerInfo: { ...case_.customerInfo, ...customerInfo } 
              }
            : case_
        ));
        return;
      }

      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        const { updateCase, saveRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
        const updateData: any = {};
        
        if (customerInfo.name) {
          updateData.customerName = customerInfo.name;
        }
        
        if (Object.keys(updateData).length > 0) {
          await updateCase(parseInt(caseId), updateData);
        }

        // 나이, 성별이 있으면 round_customer_info에 저장
        if (customerInfo.age !== undefined || customerInfo.gender !== undefined) {
          const currentRound = currentRounds[caseId] || 1;
          await saveRoundCustomerInfo(parseInt(caseId), currentRound, {
            age: customerInfo.age,
            gender: customerInfo.gender,
          });
        }
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_, 
              customerName: customerInfo.name || case_.customerName,
              customerInfo: { ...case_.customerInfo, ...customerInfo },
              roundCustomerInfo: {
                ...case_.roundCustomerInfo,
                [currentRounds[caseId] || 1]: {
                  ...case_.roundCustomerInfo[currentRounds[caseId] || 1],
                  age: customerInfo.age !== undefined ? customerInfo.age : case_.roundCustomerInfo[currentRounds[caseId] || 1]?.age,
                  gender: customerInfo.gender !== undefined ? customerInfo.gender : case_.roundCustomerInfo[currentRounds[caseId] || 1]?.gender,
                }
              }
            }
          : case_
      ));
      
      markSaved(caseId);
      console.log('기본 고객 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('기본 고객 정보 업데이트 실패:', error);
      markError(caseId);
      // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
    }
  }, [setCases, currentRounds, markSaving, markSaved, markError, isComposing, isNewCustomer]);

  // 회차별 고객정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모) - IME 처리 개선
  const handleRoundCustomerInfoUpdate = useCallback(async (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
    markSaving(caseId);
    try {
      // IME 입력 중이면 로컬 상태만 업데이트
      if (isComposing && roundInfo.memo !== undefined) {
        setCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { 
                ...case_, 
                roundCustomerInfo: {
                  ...case_.roundCustomerInfo,
                  [roundDay]: { 
                    treatmentType: '',
                    memo: '',
                    date: '',
                    ...case_.roundCustomerInfo[roundDay],
                    ...roundInfo 
                  }
                }
              }
            : case_
        ));
        markSaved(caseId);
        return;
      }

      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        await enqueue(caseId, async () => {
          const { updateCase, saveRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
          const updateData: any = {};
          if (roundInfo.memo !== undefined) {
            updateData.treatmentPlan = roundInfo.memo;
          }
          if (Object.keys(updateData).length > 0) {
            await updateCase(parseInt(caseId), updateData);
          }
          await saveRoundCustomerInfo(parseInt(caseId), roundDay, {
            age: roundInfo.age,
            gender: roundInfo.gender,
            treatmentType: roundInfo.treatmentType,
            treatmentDate: roundInfo.date,
            products: roundInfo.products,
            skinTypes: roundInfo.skinTypes,
            memo: roundInfo.memo,
          });
        });
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_, 
              roundCustomerInfo: {
                ...case_.roundCustomerInfo,
                [roundDay]: { 
                  treatmentType: '',
                  memo: '',
                  date: '',
                  ...case_.roundCustomerInfo[roundDay],
                  ...roundInfo 
                }
              }
            }
          : case_
      ));
      
      markSaved(caseId);
      console.log('회차별 고객 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('회차별 고객 정보 업데이트 실패:', error);
      markError(caseId);
      // 조용히 실패 처리 (사용자 경험 방해하지 않도록)
    }
  }, [setCases, enqueue, markSaving, markSaved, markError, isComposing, isNewCustomer]);

  // 체크박스 업데이트 핸들러
  const updateCaseCheckboxes = useCallback(async (caseId: string, updates: Partial<{
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
  }>) => {
    try {
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        const { updateCase } = await import('@/lib/clinical-photos-api');
        await updateCase(parseInt(caseId), updates);
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { ...case_, ...updates }
          : case_
      ));
      
      console.log('체크박스 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('체크박스 업데이트 실패:', error);
      // 조용히 실패 처리
    }
  }, [setCases, isNewCustomer]);

  // 현재 회차 변경 핸들러
  const handleCurrentRoundChange = useCallback((caseId: string, roundDay: number) => {
    setCurrentRounds(prev => ({ ...prev, [caseId]: roundDay }));
  }, [setCurrentRounds]);

  // 케이스 새로고침 핸들러
  const refreshCases = useCallback(async () => {
    if (!user) return;
    
    try {
      // fetchCases API를 사용해서 실제 데이터 가져오기
      const { fetchCases } = await import('@/lib/clinical-photos');
      const allCasesData = await fetchCases();
      
      // 고객 케이스만 필터링 (본인 케이스 제외)
      const casesData = allCasesData.filter(case_ => 
        case_.customerName?.trim().toLowerCase() !== '본인' && 
        !case_.customerName?.includes('본인')
      );
      
      console.log('전체 케이스:', allCasesData.length, '고객 케이스:', casesData.length);
      
      // 새 고객 케이스 보존
      const newCustomerCase = cases.find(c => isNewCustomer(c.id));
      
      // API 응답 데이터를 컴포넌트 형식에 맞게 변환
      const { safeParseStringArray } = await import('@/types/clinical');
      const transformedCases: ClinicalCase[] = await Promise.all(casesData.map(async case_ => {
        // 간략화된 변환 로직
        return {
          id: case_.id.toString(),
          customerName: case_.customerName,
          status: (case_.status === 'archived' || (case_.status as any) === 'cancelled')
            ? 'active'
            : (case_.status as 'active' | 'completed'),
          createdAt: case_.createdAt.split('T')[0],
          consentReceived: case_.consentReceived,
          consentImageUrl: case_.consentImageUrl,
          photos: [],
          customerInfo: {
            name: case_.customerName,
            age: undefined,
            gender: undefined,
            products: [],
            skinTypes: [],
            memo: case_.treatmentPlan || ''
          },
          roundCustomerInfo: {},
          cureBooster: case_.cureBooster || false,
          cureMask: case_.cureMask || false,
          premiumMask: case_.premiumMask || false,
          allInOneSerum: case_.allInOneSerum || false,
          skinRedSensitive: case_.skinRedSensitive || false,
          skinPigment: case_.skinPigment || false,
          skinPore: case_.skinPore || false,
          skinTrouble: case_.skinTrouble || false,
          skinWrinkle: case_.skinWrinkle || false,
          skinEtc: case_.skinEtc || false
        };
      }));
      
      // 새 고객이 있으면 맨 앞에 추가
      const finalCases = newCustomerCase ? [newCustomerCase, ...transformedCases] : transformedCases;
      setCases(finalCases);
      
    } catch (error) {
      console.error('케이스 새로고침 실패:', error);
    }
  }, [user, cases, setCases, isNewCustomer]);

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
      createdAt: new Date().toISOString().split('T')[0],
      consentReceived: false,
      consentImageUrl: undefined,
      photos: [],
      customerInfo: {
        name: '',
        age: undefined,
        gender: undefined,
        products: [],
        skinTypes: [],
        memo: ''
      },
      roundCustomerInfo: {
        1: {
          treatmentType: '',
          products: [],
          skinTypes: [],
          memo: '',
          date: new Date().toISOString().split('T')[0]
        }
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
      skinEtc: false
    };

    setCases(prev => [newCase, ...prev]);
    setCurrentRounds(prev => ({ ...prev, [newCustomerId]: 1 }));
    setHasUnsavedNewCustomer(true);
  }, [cases, setCases, setCurrentRounds, setHasUnsavedNewCustomer, isNewCustomer]);

  // 새 고객 저장 핸들러
  const handleSaveNewCustomer = useCallback(async (caseId: string) => {
    const newCustomerCase = cases.find(c => c.id === caseId);
    if (!newCustomerCase || !isNewCustomer(caseId)) return;

    // 필수 정보 검증
    if (!newCustomerCase.customerInfo.name?.trim()) {
      toast.error('고객 이름을 입력해주세요.');
      return;
    }

    try {
      markSaving(caseId);
      
      const { createCase, saveRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
      
      // 1. 새 케이스 생성
      const createdCase = await createCase({
        customerName: newCustomerCase.customerInfo.name,
        consentReceived: newCustomerCase.consentReceived,
        status: newCustomerCase.status,
        treatmentPlan: newCustomerCase.roundCustomerInfo[1]?.memo || '',
        cureBooster: newCustomerCase.cureBooster,
        cureMask: newCustomerCase.cureMask,
        premiumMask: newCustomerCase.premiumMask,
        allInOneSerum: newCustomerCase.allInOneSerum,
        skinRedSensitive: newCustomerCase.skinRedSensitive,
        skinPigment: newCustomerCase.skinPigment,
        skinPore: newCustomerCase.skinPore,
        skinTrouble: newCustomerCase.skinTrouble,
        skinWrinkle: newCustomerCase.skinWrinkle,
        skinEtc: newCustomerCase.skinEtc
      });

      const newCaseId = createdCase.id.toString();

      // 2. 회차별 고객 정보 저장
      const roundInfo = newCustomerCase.roundCustomerInfo[1];
      if (roundInfo) {
        await saveRoundCustomerInfo(createdCase.id, 1, {
          age: newCustomerCase.customerInfo.age,
          gender: newCustomerCase.customerInfo.gender,
          treatmentType: roundInfo.treatmentType,
          treatmentDate: roundInfo.date,
          products: roundInfo.products,
          skinTypes: roundInfo.skinTypes,
          memo: roundInfo.memo,
        });
      }

      // 3. 로컬 상태 업데이트 (새 고객 → 실제 케이스로 변환)
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_, 
              id: newCaseId,
              createdAt: createdCase.createdAt.split('T')[0]
            }
          : case_
      ));

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
  }, [cases, setCases, setCurrentRounds, setHasUnsavedNewCustomer, markSaving, markSaved, markError, isNewCustomer]);

  // 케이스 삭제 핸들러
  const handleDeleteCase = useCallback(async (caseId: string) => {
    if (isNewCustomer(caseId)) {
      handleDeleteNewCustomer(caseId);
      return;
    }

    try {
      const { deleteCase } = await import('@/lib/clinical-photos-api');
      await deleteCase(parseInt(caseId));
      
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
  }, [setCases, setCurrentRounds, isNewCustomer]);

  // 새 고객 삭제 핸들러
  const handleDeleteNewCustomer = useCallback((caseId: string) => {
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
  }, [setCases, setCurrentRounds, setHasUnsavedNewCustomer]);

  // 전체 저장 핸들러
  const handleSaveAll = useCallback(async (caseId: string) => {
    if (isNewCustomer(caseId)) {
      await handleSaveNewCustomer(caseId);
    } else {
      console.log('기존 케이스는 실시간으로 저장됩니다.');
      toast.success('데이터가 저장되었습니다.');
    }
  }, [handleSaveNewCustomer, isNewCustomer]);

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