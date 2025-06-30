import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { checkAuthSupabase } from '@/lib/auth';
import { safeParseStringArray } from '@/types/clinical';
import type { ClinicalCase, PhotoSlot, RoundCustomerInfo } from '@/types/clinical';

export interface UsePersonalPageStateProps {
  initialRound?: number;
}

export const usePersonalPageState = ({ initialRound = 1 }: UsePersonalPageStateProps = {}) => {
  const router = useRouter();

  /** 1) 기존 useState 들 - Personal용으로 수정 */
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(initialRound); // Personal은 단일 케이스이므로 단수형
  const [hasUnsavedPersonalCase, setHasUnsavedPersonalCase] = useState(false);
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [inputDebounceTimers, setInputDebounceTimers] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{[caseId:string]: 'idle' | 'saving' | 'saved' | 'error'}>({});

  /** Refs - 그대로 이식 */
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const casesRef = useRef<ClinicalCase[]>([]);

  /** Helper functions */
  const isPersonalCase = (caseId: string) => caseId.startsWith('new-personal-');

  /** 2) useEffect들 - Personal용으로 수정 */

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await checkAuthSupabase(['kol', 'test']);
        if (!user) {
          router.push('/signin');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('인증 확인 중 오류:', error);
        router.push('/signin');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 사용자 상호작용 감지 훅
  useEffect(() => {
    const interactiveElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
    
    const checkFocusState = () => {
      const activeElement = document.activeElement;
      const isInputFocused = !!(activeElement &&
        interactiveElements.includes(activeElement.tagName) &&
        activeElement !== document.body);
      
      console.log('포커스 상태 변경:', { 
        activeElement: activeElement?.tagName, 
        isInputFocused,
        id: activeElement?.id || 'no-id'
      });
      
      setIsUserInteracting(isInputFocused);
    };

    const handleUserActivity = (event: Event) => {
      const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'input', 'change'];
      if (!interactionEvents.includes(event.type)) return;

      console.log('사용자 활동 감지:', event.type);
      setIsUserInteracting(true);
      
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
      
      userActivityTimeoutRef.current = setTimeout(() => {
        const activeElement = document.activeElement;
        const isInputFocused = !!(activeElement &&
          interactiveElements.includes(activeElement.tagName) &&
          activeElement !== document.body);
          
        if (!isInputFocused) {
          console.log('사용자 활동 타임아웃 - 상호작용 상태 해제');
          setIsUserInteracting(false);
        }
      }, 500);
    };

    document.addEventListener('focusin', checkFocusState);
    document.addEventListener('focusout', checkFocusState);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
    document.addEventListener('input', handleUserActivity);
    document.addEventListener('change', handleUserActivity);

    checkFocusState();

    return () => {
      document.removeEventListener('focusin', checkFocusState);
      document.removeEventListener('focusout', checkFocusState);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('input', handleUserActivity);
      document.removeEventListener('change', handleUserActivity);
      
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
    };
  }, []);

  // 임시저장된 개인 케이스 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedPersonalCase = localStorage.getItem('unsavedPersonalCase');
      if (savedPersonalCase) {
        try {
          const parsedCase = JSON.parse(savedPersonalCase);
          setCases(prev => {
            const hasExistingPersonalCase = prev.some(case_ => isPersonalCase(case_.id));
            if (hasExistingPersonalCase) {
              return prev;
            }
            return [parsedCase, ...prev];
          });
          setCurrentRound(initialRound);
          setHasUnsavedPersonalCase(true);
        } catch (error) {
          console.error('Failed to parse saved personal case:', error);
          localStorage.removeItem('unsavedPersonalCase');
        }
      }
    }
  }, [user, initialRound]);

  // 개인 케이스 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (hasUnsavedPersonalCase) {
        const personalCase = cases.find(case_ => isPersonalCase(case_.id));
        if (personalCase) {
          localStorage.setItem('unsavedPersonalCase', JSON.stringify(personalCase));
        } else {
          localStorage.removeItem('unsavedPersonalCase');
        }
      } else {
        localStorage.removeItem('unsavedPersonalCase');
      }
    }
  }, [cases, hasUnsavedPersonalCase]);

  // 실제 개인 케이스 데이터 로드 (본인 케이스만)
  useEffect(() => {
    const loadCases = async () => {
      if (!user) return;
      
      try {
        const { fetchCases } = await import('@/lib/clinical-photos');
        const allCasesData = await fetchCases();
        
        // 본인 케이스만 필터링
        const personalCasesData = allCasesData.filter(case_ => 
          case_.customerName?.trim().toLowerCase() === '본인'
        );
        
        console.log('전체 케이스:', allCasesData.length, '본인 케이스:', personalCasesData.length);
        
        const transformedCases: ClinicalCase[] = await Promise.all(personalCasesData.map(async case_ => {
          const productTypes = [];
          if (case_.cureBooster) productTypes.push('cure_booster');
          if (case_.cureMask) productTypes.push('cure_mask');
          if (case_.premiumMask) productTypes.push('premium_mask');
          if (case_.allInOneSerum) productTypes.push('all_in_one_serum');
          
          const skinTypeData = [];
          if (case_.skinRedSensitive) skinTypeData.push('red_sensitive');
          if (case_.skinPigment) skinTypeData.push('pigment');
          if (case_.skinPore) skinTypeData.push('pore');
          if (case_.skinTrouble) skinTypeData.push('acne_trouble');
          if (case_.skinWrinkle) skinTypeData.push('wrinkle');
          if (case_.skinEtc) skinTypeData.push('other');
          
          let photos: PhotoSlot[] = [];
          try {
            const { fetchPhotos } = await import('@/lib/clinical-photos-api');
            const photoData = await fetchPhotos(case_.id);
            photos = photoData.map(p => ({
              id: p.id,
              roundDay: p.roundDay,
              angle: p.angle as 'front' | 'left' | 'right',
              imageUrl: p.imageUrl,
              uploaded: true
            }));
          } catch (error) {
            console.error(`Failed to load photos for case ${case_.id}:`, error);
          }

          const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};
          try {
            const { fetchRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
            const roundData = await fetchRoundCustomerInfo(case_.id);
            roundData.forEach(round => {
              roundCustomerInfo[round.round_number] = {
                age: round.age,
                gender: round.gender,
                treatmentType: round.treatment_type || '',
                products: safeParseStringArray(round.products),
                skinTypes: safeParseStringArray(round.skin_types),
                memo: round.memo || '',
                date: round.treatment_date || ''
              };
            });
          } catch (error) {
            console.error(`Failed to load round info for case ${case_.id}:`, error);
          }

          if (!roundCustomerInfo[1]) {
            roundCustomerInfo[1] = {
              age: undefined,
              gender: undefined,
              treatmentType: '',
              products: productTypes,
              skinTypes: skinTypeData,
              memo: case_.treatmentPlan || '',
              date: case_.createdAt.split('T')[0],
            };
          } else {
            if ((!roundCustomerInfo[1].products || roundCustomerInfo[1].products.length === 0) && productTypes.length > 0) {
              roundCustomerInfo[1].products = productTypes;
            }
            if ((!roundCustomerInfo[1].skinTypes || roundCustomerInfo[1].skinTypes.length === 0) && skinTypeData.length > 0) {
              roundCustomerInfo[1].skinTypes = skinTypeData;
            }
          }
          
          return {
            id: case_.id.toString(),
            customerName: case_.customerName,
            status: (case_.status === 'archived' || (case_.status as any) === 'cancelled')
              ? 'active'
              : (case_.status as 'active' | 'completed'),
            createdAt: case_.createdAt ? case_.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            consentReceived: case_.consentReceived,
            consentImageUrl: case_.consentImageUrl,
            photos: photos,
            customerInfo: {
              name: case_.customerName,
              age: roundCustomerInfo[1]?.age,
              gender: roundCustomerInfo[1]?.gender,
              products: productTypes,
              skinTypes: skinTypeData,
              memo: case_.treatmentPlan || ''
            },
            roundCustomerInfo: roundCustomerInfo,
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
          } as ClinicalCase;
        }));
        
        setCases(transformedCases as ClinicalCase[]);
        
        // Personal은 단일 케이스이므로 currentRound 설정
        if (transformedCases.length > 0) {
          setCurrentRound(initialRound);
        }
      } catch (error) {
        console.error('Failed to load personal cases:', error);
        setCases([]);
      }
    };

    loadCases();
  }, [user, initialRound]);

  // 스크롤 기반 숫자 애니메이션
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    let throttleTimeout: NodeJS.Timeout | null = null;
    let isScrolling = false;
    
    const handleScroll = () => {
      console.log('스크롤 이벤트 감지됨', { isUserInteracting });
      
      if (isUserInteracting) {
        console.log('사용자 상호작용 중 - 스크롤 애니메이션 차단');
        return;
      }
      
      if (!isScrolling && !throttleTimeout) {
        isScrolling = true;
        console.log('의도적 스크롤 감지 - 숫자 애니메이션 시작');
        
        const currentCases = casesRef.current;
        if (currentCases && currentCases.length > 0) {
          setNumberVisibleCards(new Set(currentCases.map(c => c.id)));
        }
        
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 150);
      }
      
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        console.log('스크롤 멈춤 - 숫자 애니메이션 종료');
        setNumberVisibleCards(new Set());
        isScrolling = false;
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isUserInteracting]);

  // 초기 애니메이션 테스트
  useEffect(() => {
    if (cases.length > 0 && !isUserInteracting) {
      console.log('초기 애니메이션 테스트 시작', { casesLength: cases.length, isUserInteracting });
      
      const initialAnimationTimer = setTimeout(() => {
        if (!isUserInteracting) {
          setNumberVisibleCards(new Set(cases.map(c => c.id)));
          
          setTimeout(() => {
            setNumberVisibleCards(new Set());
          }, 2000);
        } else {
          console.log('초기 애니메이션 차단 - 사용자 상호작용 중');
        }
      }, 1000);
      
      return () => {
        clearTimeout(initialAnimationTimer);
      };
    }
  }, [cases.length, isUserInteracting]);

  // cases 상태를 ref에 동기화
  useEffect(() => {
    casesRef.current = cases;
  }, [cases]);

  // 컴포넌트 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(inputDebounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [inputDebounceTimers]);

  /** 3) 상태 setter / 헬퍼 반환 */
  return {
    // States
    user,
    setUser,
    isLoading,
    setIsLoading,
    cases,
    setCases,
    currentRound,
    setCurrentRound,
    hasUnsavedPersonalCase,
    setHasUnsavedPersonalCase,
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
    isPersonalCase,
  };
}; 