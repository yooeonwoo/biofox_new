import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClinicalCasesConvex } from '@/lib/clinical-photos-hooks';
import { enrichCasesWithRoundInfo } from './useCasesWithRoundInfo';
import type { ClinicalCase } from '@/types/clinical';

export const useCustomerPageState = () => {
  const router = useRouter();

  // 실제 인증 정보 사용
  const { user: authUser, profile, isLoading: authLoading } = useAuth();

  /** 1) 기존 useState 들 - 그대로 이식 */
  const [user, setUser] = useState<any>(null);
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [inputDebounceTimers, setInputDebounceTimers] = useState<{ [key: string]: NodeJS.Timeout }>(
    {}
  );
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    [caseId: string]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});

  // 로컬 케이스 상태 추가 (Convex 데이터와 동기화)
  const [localCases, setLocalCases] = useState<ClinicalCase[]>([]);

  /** Refs - 그대로 이식 */
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const casesRef = useRef<ClinicalCase[]>([]);
  const prevCasesRef = useRef<ClinicalCase[]>([]); // 이전 cases 추적용

  // Convex 훅으로 케이스 데이터 로드
  const { data: convexCases = [], isLoading: convexCasesLoading } = useClinicalCasesConvex(
    profile?._id, // profileId 전달
    undefined // status
  );

  // 고객 케이스만 필터링 (본인 제외) 및 라운드 정보 통합
  const cases = useMemo(() => {
    const customerCases = convexCases.filter(
      case_ =>
        case_.customerName?.trim().toLowerCase() !== '본인' && !case_.customerName?.includes('본인')
    );
    return enrichCasesWithRoundInfo(customerCases);
  }, [convexCases]);

  // Convex 데이터가 변경되면 로컬 상태 업데이트 - 실제 변경이 있을 때만
  useEffect(() => {
    // 이전 cases와 현재 cases의 ID 비교
    const prevIds = prevCasesRef.current.map(c => c.id).join(',');
    const currentIds = cases.map(c => c.id).join(',');

    if (prevIds !== currentIds || prevCasesRef.current.length !== cases.length) {
      setLocalCases(cases);
      prevCasesRef.current = cases;
    }
  }, [cases]);

  // 사용자 인증 확인 - 실제 인증 정보 사용
  useEffect(() => {
    if (!authLoading) {
      if (authUser && profile) {
        // 실제 사용자 정보로 설정
        setUser({
          id: authUser.id,
          name: profile.name || authUser.email,
          email: authUser.email,
          role: profile.role,
          kolId: profile._id,
        });
      } else if (!authUser) {
        // 인증되지 않은 경우 로그인 페이지로
        router.push('/signin');
      }
    }
  }, [authUser, profile, authLoading, router]);

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

  // 케이스별 현재 라운드 초기화
  useEffect(() => {
    const initialRounds: { [caseId: string]: number } = {};
    localCases.forEach(case_ => {
      initialRounds[case_.id] = 1;
    });
    setCurrentRounds(prev => ({ ...prev, ...initialRounds }));
  }, [localCases]);

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
        console.log(' 의도적 스크롤 감지 - 숫자 애니메이션 시작');

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
        console.log(' 스크롤 멈춤 - 숫자 애니메이션 종료');
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
    if (localCases.length > 0 && !isUserInteracting) {
      console.log(' 초기 애니메이션 테스트 시작', {
        casesLength: localCases.length,
        isUserInteracting,
      });

      const initialAnimationTimer = setTimeout(() => {
        if (!isUserInteracting) {
          setNumberVisibleCards(new Set(localCases.map(c => c.id)));

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

  // cases 상태를 ref에 동기화
  // ref 업데이트는 부수 효과이므로 useEffect 없이 직접 할당
  casesRef.current = localCases;

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
    isLoading: authLoading || convexCasesLoading,
    setIsLoading: () => {}, // deprecated
    cases: localCases,
    setCases: setLocalCases, // 실제 setState 함수 반환
    currentRounds,
    setCurrentRounds,
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
  };
};
