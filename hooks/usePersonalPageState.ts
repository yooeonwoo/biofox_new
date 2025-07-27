import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClinicalCasesConvex, useEnsurePersonalCaseConvex } from '@/lib/clinical-photos-hooks';
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
  const [inputDebounceTimers, setInputDebounceTimers] = useState<{ [key: string]: NodeJS.Timeout }>(
    {}
  );
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    [caseId: string]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});

  /** Refs - 그대로 이식 */
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const casesRef = useRef<ClinicalCase[]>([]);

  /** Helper functions */
  const isPersonalCase = (caseId: string) => caseId.startsWith('new-personal-');

  /** 2) useEffect들 - Personal용으로 수정 */

  // 사용자 인증 확인 - 더미 데이터 사용
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 더미 유저 데이터
        const dummyUser = {
          id: 'dummy-user-id',
          name: '테스트 KOL',
          email: 'test@biofox.com',
          role: 'kol',
          kolId: 1,
        };
        setUser(dummyUser);
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
      const isInputFocused = !!(
        activeElement &&
        interactiveElements.includes(activeElement.tagName) &&
        activeElement !== document.body
      );

      console.log('포커스 상태 변경:', {
        activeElement: activeElement?.tagName,
        isInputFocused,
        id: activeElement?.id || 'no-id',
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
        const isInputFocused = !!(
          activeElement &&
          interactiveElements.includes(activeElement.tagName) &&
          activeElement !== document.body
        );

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
  }, [hasUnsavedPersonalCase]); // cases 의존성 제거하여 무한 루프 방지

  // Convex 훅을 사용하여 개인 케이스 데이터 로드
  const { data: allCases, isLoading: casesLoading, error: casesError } = useClinicalCasesConvex();
  const {
    personalCase,
    isLoading: personalLoading,
    ensurePersonalCaseExists,
  } = useEnsurePersonalCaseConvex();

  // 본인 케이스 필터링 및 데이터 동기화
  useEffect(() => {
    if (!user || casesLoading || personalLoading) return;

    try {
      // 본인 케이스만 필터링
      const personalCases =
        allCases?.filter(case_ => case_.customerName?.trim().toLowerCase() === '본인') || [];

      console.log('본인 케이스 로드:', {
        totalCases: allCases?.length || 0,
        personalCases: personalCases.length,
        personalCase: personalCase?.id,
      });

      // Convex에서 받은 데이터는 이미 UI 타입으로 변환되어 있음
      setCases(personalCases);

      // Personal은 단일 케이스이므로 currentRound 설정
      if (personalCases.length > 0) {
        setCurrentRound(initialRound);
      }
    } catch (error) {
      console.error('Failed to process personal cases:', error);
      setCases([]);
    }
  }, [user, allCases, personalCase, casesLoading, personalLoading, initialRound]);

  // 개인 케이스가 없으면 자동 생성
  useEffect(() => {
    if (!user || casesLoading || personalLoading) return;

    const autoCreatePersonalCase = async () => {
      if (!personalCase && allCases && allCases.length === 0) {
        console.log('개인 케이스가 없어 자동 생성 시도');
        try {
          await ensurePersonalCaseExists();
        } catch (error) {
          console.error('개인 케이스 생성 실패:', error);
        }
      }
    };

    autoCreatePersonalCase();
  }, [user, personalCase, allCases, casesLoading, personalLoading, ensurePersonalCaseExists]);

  // 에러 처리
  useEffect(() => {
    if (casesError) {
      console.error('케이스 로드 에러:', casesError);
    }
  }, [casesError]);

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
  }, [isUserInteracting]); // cases.length 의존성 제거하여 무한 루프 방지

  // cases 상태를 ref에 동기화 - useEffect 없이 직접 할당
  casesRef.current = cases;

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
    isLoading: isLoading || casesLoading || personalLoading,
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
