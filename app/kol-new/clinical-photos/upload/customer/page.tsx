'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { fetchCases, updateCase } from '@/lib/clinical-photos-api';
import { useUser, useClerk } from '@clerk/nextjs';
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
import KolHeader from "../../../../components/layout/KolHeader";
import KolSidebar from "../../../../components/layout/KolSidebar";
import KolFooter from "../../../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import KolMobileMenu from "../../../../components/layout/KolMobileMenu";
import PhotoRoundCarousel from "../../components/PhotoRoundCarousel";
import CaseStatusTabs from "../../components/CaseStatusTabs";

// 시스템 상수 정의
const SYSTEM_OPTIONS = {
  genders: [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'other', label: '기타' }
  ] as const,
  
  treatmentTypes: [
    { value: '10GF', label: '10GF 마이크로젯 케어' },
    { value: 'realafter', label: '리얼에프터 케어' }
  ] as const,
  
  products: [
    { value: 'cure_booster', label: '큐어 부스터' },
    { value: 'cure_mask', label: '큐어 마스크' },
    { value: 'premium_mask', label: '프리미엄 마스크' },
    { value: 'all_in_one_serum', label: '올인원 세럼' }
  ] as const,
  
  skinTypes: [
    { value: 'red_sensitive', label: '붉고 예민함' },
    { value: 'pigment', label: '색소 / 미백' },
    { value: 'pore', label: '모공 늘어짐' },
    { value: 'acne_trouble', label: '트러블 / 여드름' },
    { value: 'wrinkle', label: '주름 / 탄력' },
    { value: 'other', label: '기타' }
  ] as const
} as const;

// 문자열 혹은 JSON 문자열/배열을 안전하게 string[]로 변환
function safeParseStringArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as string[];
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // JSON.parse 실패 – fallback 처리
    }
    return input
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

// 고객 정보 관련 타입
interface CustomerInfo {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
}

// 회차별 고객 정보 타입
interface RoundCustomerInfo {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
  date?: string; // 회차별 날짜
}

// 케이스 데이터 타입
// CaseStatusTabs에서 사용하는 타입과 맞추기 위한 타입 정의
type CaseStatus = 'active' | 'completed' | 'archived' | 'cancelled';

interface ClinicalCase {
  id: string;
  customerName: string;
  status: CaseStatus;
  createdAt: string;
  consentReceived: boolean;
  consentImageUrl?: string;
  photos: PhotoSlot[];
  customerInfo: CustomerInfo;
  roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo };
  // 본래 API와 일치하는 boolean 필드 추가
  // 플레이어 제품 관련 필드
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;
  // 고객 피부 타입 관련 필드
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploaded: boolean;
}

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

export default function CustomerClinicalUploadPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ kol?: KolInfo } | null>(null);
  
  // 케이스 관리 상태
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const [consentViewModal, setConsentViewModal] = useState<{ isOpen: boolean; imageUrl?: string }>({ isOpen: false });
  const [hasUnsavedNewCustomer, setHasUnsavedNewCustomer] = useState(false);
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  
  // IME 상태 관리 (한글 입력 문제 해결) 및 debounce
  const [isComposing, setIsComposing] = useState(false);
  const [inputDebounceTimers, setInputDebounceTimers] = useState<{[key: string]: NodeJS.Timeout}>({});
  const mainContentRef = useRef<HTMLElement>(null);
  const casesRef = useRef<ClinicalCase[]>([]);

  // 사용자 상호작용 상태 추적 (Focus State + User Activity)
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [saveStatus, setSaveStatus] = useState<{[caseId:string]: 'idle' | 'saving' | 'saved' | 'error'}>({});

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

    // 사용자 활동 감지 (마우스, 키보드, 터치)
    const handleUserActivity = (event: Event) => {
      // 특정 이벤트 타입에 대해서만 상호작용으로 간주
      const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'input', 'change'];
      if (!interactionEvents.includes(event.type)) return;

      console.log('사용자 활동 감지:', event.type);
      setIsUserInteracting(true);
      
      // 기존 타이머 클리어
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
      
      // 활동 후 500ms 경과 시 상호작용 상태 해제
      userActivityTimeoutRef.current = setTimeout(() => {
        // 여전히 포커스된 요소가 있는지 재확인
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

    // 이벤트 리스너 등록
    document.addEventListener('focusin', checkFocusState);
    document.addEventListener('focusout', checkFocusState);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
    document.addEventListener('input', handleUserActivity);
    document.addEventListener('change', handleUserActivity);

    // 초기 포커스 상태 확인
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

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      try {
        const userRole = user.publicMetadata?.role as string || "kol";
        console.log('사용자 역할:', userRole);
        // test 역할과 kol 역할 모두 임상사진 페이지 접근 허용
        setIsKol(userRole === "kol" || userRole === "test");
        setLoading(false);
      } catch (err) {
        console.error('사용자 역할 확인 중 오류:', err);
        setIsKol(true);
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol !== null) {
      const fetchDashboardData = async () => {
        try {
          console.log('임상관리(고객) - 대시보드 데이터 로드 시작...');
          const dashboardResponse = await fetch('/api/kol-new/dashboard');
          
          if (!dashboardResponse.ok) {
            console.error('대시보드 API 에러');
            return;
          }
          
          const dashboardResult = await dashboardResponse.json();
          console.log('임상관리(고객) - 대시보드 데이터 로드 완료');
          setDashboardData(dashboardResult);
        } catch (err) {
          console.error('대시보드 데이터 로드 중 오류:', err);
        }
      };
      
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn, isKol]);

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 임시저장된 새 고객 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded && isSignedIn && isKol) {
      const savedNewCustomer = localStorage.getItem('unsavedNewCustomer');
      if (savedNewCustomer) {
        try {
          const parsedCase = JSON.parse(savedNewCustomer);
          // 기존 케이스에 새 고객이 이미 있는지 확인
          setCases(prev => {
            const hasExistingNewCustomer = prev.some(case_ => isNewCustomer(case_.id));
            if (hasExistingNewCustomer) {
              return prev; // 이미 새 고객이 있으면 추가하지 않음
            }
            return [parsedCase, ...prev];
          });
          setCurrentRounds(prev => ({ ...prev, [parsedCase.id]: 1 }));
          setHasUnsavedNewCustomer(true);
        } catch (error) {
          console.error('Failed to parse saved new customer:', error);
          localStorage.removeItem('unsavedNewCustomer');
        }
      }
    }
  }, [isLoaded, isSignedIn, isKol]);

  // 새 고객 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (hasUnsavedNewCustomer) {
        const newCustomerCase = cases.find(case_ => isNewCustomer(case_.id));
        if (newCustomerCase) {
          localStorage.setItem('unsavedNewCustomer', JSON.stringify(newCustomerCase));
        } else {
          // 새 고객이 없으면 localStorage에서 제거
          localStorage.removeItem('unsavedNewCustomer');
        }
      } else {
        // hasUnsavedNewCustomer가 false면 localStorage에서 제거
        localStorage.removeItem('unsavedNewCustomer');
      }
    }
  }, [cases, hasUnsavedNewCustomer]);

  // 실제 케이스 데이터 로드
  useEffect(() => {
    const loadCases = async () => {
      if (!isLoaded || !isSignedIn || !isKol) return;
      
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
        
        // API 응답 데이터를 컴포넌트 형식에 맞게 변환
        const transformedCases: ClinicalCase[] = await Promise.all(casesData.map(async case_ => {
          // 체크박스 관련 제품 데이터 처리
          const productTypes = [];
          if (case_.cureBooster) productTypes.push('cure_booster');
          if (case_.cureMask) productTypes.push('cure_mask');
          if (case_.premiumMask) productTypes.push('premium_mask');
          if (case_.allInOneSerum) productTypes.push('all_in_one_serum');
          
          // 체크박스 관련 피부타입 데이터 처리
          const skinTypeData = [];
          if (case_.skinRedSensitive) skinTypeData.push('red_sensitive');
          if (case_.skinPigment) skinTypeData.push('pigment');
          if (case_.skinPore) skinTypeData.push('pore');
          if (case_.skinTrouble) skinTypeData.push('acne_trouble');
          if (case_.skinWrinkle) skinTypeData.push('wrinkle');
          if (case_.skinEtc) skinTypeData.push('other');
          
          // 사진 데이터 로드
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

          // 회차별 고객 정보 로드
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

          // 기본 회차 정보가 없으면 생성 (또는 제품/피부타입 정보가 비어있을 때 기본값 채우기)
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
            // DB에 값이 없을 때만 기본값 보완
            if ((!roundCustomerInfo[1].products || roundCustomerInfo[1].products.length === 0) && productTypes.length > 0) {
              roundCustomerInfo[1].products = productTypes;
            }
            if ((!roundCustomerInfo[1].skinTypes || roundCustomerInfo[1].skinTypes.length === 0) && skinTypeData.length > 0) {
              roundCustomerInfo[1].skinTypes = skinTypeData;
            }
          }
          
          // 변환된 케이스 데이터 반환
          return {
            id: case_.id.toString(),
            customerName: case_.customerName,
            status: (case_.status === 'archived' || (case_.status as any) === 'cancelled')
              ? 'active'
              : (case_.status as 'active' | 'completed'),
            createdAt: case_.createdAt.split('T')[0],
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
            // 본래 API의 boolean 필드를 그대로 설정
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
        
        setCases(transformedCases);
        
        // 초기 현재 회차 설정
        const initialRounds: { [caseId: string]: number } = {};
        transformedCases.forEach(case_ => {
          initialRounds[case_.id] = 1;
        });
        setCurrentRounds(initialRounds);
      } catch (error) {
        console.error('Failed to load cases:', error);
        setCases([]); // 에러 시 빈 배열
      }
    };

    loadCases();
  }, [isLoaded, isSignedIn, isKol]);

  // 스크롤 기반 숫자 애니메이션 (사용자 상호작용 중이 아닐 때만 표시)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    let throttleTimeout: NodeJS.Timeout | null = null;
    let isScrolling = false;
    
    const handleScroll = () => {
      console.log('스크롤 이벤트 감지됨', { isUserInteracting }); // 디버깅용
      
      // 사용자 상호작용 중이면 애니메이션 비활성화
      if (isUserInteracting) {
        console.log('사용자 상호작용 중 - 스크롤 애니메이션 차단');
        return;
      }
      
      // 스크롤 시작 시에만 숫자 표시 (throttling으로 성능 향상)
      if (!isScrolling && !throttleTimeout) {
        isScrolling = true;
        console.log(' 의도적 스크롤 감지 - 숫자 애니메이션 시작'); // 디버깅용
        
        // 현재 cases 상태를 ref로 접근하여 애니메이션 표시
        const currentCases = casesRef.current;
        if (currentCases && currentCases.length > 0) {
          setNumberVisibleCards(new Set(currentCases.map(c => c.id)));
        }
        
        // throttling: 150ms 동안 추가 실행 방지 (더 안정적인 감지)
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 150);
      }
      
      // 스크롤이 멈추면 숫자 숨기기 (디바운싱)
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        console.log(' 스크롤 멈춤 - 숫자 애니메이션 종료'); // 디버깅용
        setNumberVisibleCards(new Set());
        isScrolling = false;
      }, 800); // 0.8초 후 숫자 숨김 (조금 더 길게)
    };

    // 스크롤 이벤트 리스너 등록 (항상 등록)
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isUserInteracting]); // isUserInteracting 의존성 추가

  // 초기 애니메이션 테스트 (케이스 로드 후 한 번만 실행, 사용자 상호작용 중이 아닐 때만)
  useEffect(() => {
    if (cases.length > 0 && !isUserInteracting) {
      console.log(' 초기 애니메이션 테스트 시작', { casesLength: cases.length, isUserInteracting });
      
      // 약간의 지연 후 애니메이션 시작 (페이지 로드 완료 후)
      const initialAnimationTimer = setTimeout(() => {
        // 다시 한 번 사용자 상호작용 상태 확인
        if (!isUserInteracting) {
          setNumberVisibleCards(new Set(cases.map(c => c.id)));
          
          // 2초 후 숨김
          setTimeout(() => {
            setNumberVisibleCards(new Set());
          }, 2000);
        } else {
          console.log('초기 애니메이션 차단 - 사용자 상호작용 중');
        }
      }, 1000); // 1초 지연
      
      return () => {
        clearTimeout(initialAnimationTimer);
      };
    }
  }, [cases.length, isUserInteracting]); // cases.length와 isUserInteracting 의존성 추가

  // cases 상태를 ref에 동기화 (스크롤 애니메이션에서 사용)
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
  }, []);

  // 케이스 상태 변경 핸들러
  const handleCaseStatusChange = async (caseId: string, status: 'active' | 'completed') => {
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
      alert('케이스 상태 변경에 실패했습니다. 다시 시도해주세요.');
      // 오류 발생 시 상태 되돌리기
      refreshCases();
    }
  };

  // 동의 상태 변경 핸들러
  const handleConsentChange = async (caseId: string, consentReceived: boolean) => {
    try {
      // 동의서가 업로드되어 있는데 미동의로 변경하려는 경우 알림 표시
      const currentCase = cases.find(case_ => case_.id === caseId);
      if (!consentReceived && currentCase?.consentImageUrl) {
        toast.warning('동의서를 먼저 삭제한 후 미동의로 변경해주세요', {
          description: '업로드된 동의서가 있습니다',
          duration: 3000,
        });
        return; // 변경하지 않고 종료
      }
      
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        const { updateCase } = await import('@/lib/clinical-photos-api');
        const updateData: any = { consentReceived };
        
        // 동의 취소 시 동의서 이미지도 제거
        if (!consentReceived) {
          updateData.consentImageUrl = undefined;
        }
        
        await updateCase(parseInt(caseId), updateData);
      }
      
      // 로컬 상태 업데이트
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_, 
              consentReceived,
              consentImageUrl: consentReceived ? case_.consentImageUrl : undefined 
            }
          : case_
      ));
      
      console.log(`동의 상태가 ${consentReceived ? '동의' : '미동의'}로 변경되었습니다.`);
    } catch (error) {
      console.error('동의 상태 변경 실패:', error);
      toast.error('동의 상태 변경에 실패했습니다. 다시 시도해주세요.');
      // 오류 발생 시 상태 되돌리기
      refreshCases();
    }
  };

  // 동의서 업로드 상태 관리
  const [consentUploading, setConsentUploading] = useState<{ [caseId: string]: boolean }>({});

  // 동의서 업로드 핸들러
  const handleConsentUpload = (caseId: string) => {
    // 이미 업로드 중이면 무시
    if (consentUploading[caseId]) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // 파일 유효성 검사
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          alert('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
          return;
        }

        // 파일 크기 제한 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          alert('파일 크기는 10MB 이하여야 합니다.');
          return;
        }

        // 업로드 시작
        setConsentUploading(prev => ({ ...prev, [caseId]: true }));

        try {
          // 새 고객인 경우 임시 처리
          if (isNewCustomer(caseId)) {
            const imageUrl = URL.createObjectURL(file);
            
            // 해당 케이스의 동의서 업데이트 (새 고객)
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, consentImageUrl: imageUrl, consentReceived: true }
                : case_
            ));
            console.log('동의서가 임시로 저장되었습니다. 고객 정보를 저장하면 실제 업로드됩니다.');
            return;
          }
          
          // 실제 케이스의 경우 Supabase에 업로드
          const { uploadConsentImage, fetchCase } = await import('@/lib/clinical-photos-api');
          const imageUrl = await uploadConsentImage(parseInt(caseId), file);
          
          // 업로드 성공 후 해당 케이스 정보를 데이터베이스에서 다시 불러오기
          try {
            const updatedCase = await fetchCase(parseInt(caseId));
            if (updatedCase) {
              setCases(prev => prev.map(case_ => 
                case_.id === caseId 
                  ? { 
                      ...case_, 
                      consentImageUrl: updatedCase.consentImageUrl, 
                      consentReceived: updatedCase.consentReceived 
                    }
                  : case_
              ));
              console.log('동의서 정보를 데이터베이스에서 새로고침했습니다.');
            } else {
              // 케이스 조회 실패 시 기존 방식으로 업데이트
              setCases(prev => prev.map(case_ => 
                case_.id === caseId 
                  ? { ...case_, consentImageUrl: undefined, consentReceived: false }
                  : case_
              ));
            }
          } catch (refreshError) {
            console.error('동의서 정보 새로고침 실패:', refreshError);
            // 새로고침 실패 시 기존 방식으로 로컬 업데이트
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, consentImageUrl: undefined, consentReceived: false }
                : case_
            ));
          }
          
          console.log('동의서가 성공적으로 업로드되었습니다.');
          toast.success('동의서가 성공적으로 업로드되었습니다.');
        } catch (error) {
          console.error('동의서 업로드 실패:', error);
          alert(`동의서 업로드에 실패했습니다: ${(error as any).message || '알 수 없는 오류'}`);
          
          // 에러 발생 시 동의 상태 되돌리기
          setCases(prev => prev.map(case_ => 
            case_.id === caseId 
              ? { ...case_, consentReceived: false, consentImageUrl: undefined }
              : case_
          ));
        } finally {
          // 업로드 완료
          setConsentUploading(prev => ({ ...prev, [caseId]: false }));
        }
      }
    };
    input.click();
  };

  // 동의서 삭제 핸들러
  const handleConsentDelete = async (caseId: string) => {
    try {
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        // 동의서 파일 삭제 API 호출
        const response = await fetch(`/api/kol-new/clinical-photos/consent/${caseId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '동의서 삭제에 실패했습니다.');
        }
        
        // 삭제 성공 후 해당 케이스 정보를 데이터베이스에서 다시 불러오기
        try {
          const { fetchCase } = await import('@/lib/clinical-photos-api');
          const updatedCase = await fetchCase(parseInt(caseId));
          if (updatedCase) {
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { 
                    ...case_, 
                    consentImageUrl: undefined, 
                    consentReceived: false 
                  }
                : case_
            ));
            console.log('동의서 정보를 데이터베이스에서 새로고침했습니다.');
          } else {
            // 케이스 조회 실패 시 기존 방식으로 업데이트
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, consentImageUrl: undefined, consentReceived: false }
                : case_
            ));
          }
        } catch (refreshError) {
          console.error('동의서 정보 새로고침 실패:', refreshError);
          // 새로고침 실패 시 기존 방식으로 로컬 업데이트
          setCases(prev => prev.map(case_ => 
            case_.id === caseId 
              ? { ...case_, consentImageUrl: undefined, consentReceived: false }
              : case_
          ));
        }
      } else {
        // 새 고객의 경우 로컬 상태만 업데이트
        setCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { ...case_, consentImageUrl: undefined, consentReceived: false }
            : case_
        ));
      }
      
      console.log('동의서가 성공적으로 삭제되었습니다.');
      toast.success('동의서가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('동의서 삭제 실패:', error);
      toast.error(`동의서 삭제에 실패했습니다: ${(error as any).message || '알 수 없는 오류'}`);
    }
  };

  // 동의서 보기 핸들러
  const handleConsentView = (imageUrl: string) => {
    setConsentViewModal({ isOpen: true, imageUrl });
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = async (caseId: string, roundDay: number, angle: string, file?: File): Promise<void> => {
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
  };

  // 사진 삭제 핸들러
  const handlePhotoDelete = async (caseId: string, roundDay: number, angle: string): Promise<void> => {
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
  };

  // 기본 고객정보 업데이트 핸들러 (이름, 나이, 성별) - IME 처리 개선
  const handleBasicCustomerInfoUpdate = async (caseId: string, customerInfo: Partial<Pick<CustomerInfo, 'name' | 'age' | 'gender'>>) => {
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
  };

  // 회차별 고객정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모) - IME 처리 개선
  const handleRoundCustomerInfoUpdate = async (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
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
  };
  
  // 본래 API와 연동하는 체크박스 업데이트 함수
  const updateCaseCheckboxes = async (caseId: string, updates: Partial<{
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
      // 시쪁적 UI 업데이트를 위한 로칼 상태 업데이트 (오프티미스틱 UI)
      setCases(prev => prev.map(case_ => 
        case_.id === caseId 
          ? { 
              ...case_,
              // 본래 API 스키마와 일치하는 이름으로 boolean 필드 업데이트
              ...updates 
            }
          : case_
      ));
      
      // 새 고객이 아닌 경우에만 실제 API 호출
      if (!isNewCustomer(caseId)) {
        await enqueue(caseId, async () => {
          const { updateCase } = await import('@/lib/clinical-photos-api');
          await updateCase(parseInt(caseId), updates);
        });
      }
      
      markSaved(caseId);
      console.log('체크박스 정보가 저장되었습니다');

    } catch (error) {
      console.error('체크박스 업데이트 오류:', error);
      markError(caseId);
      // 오류 발생 시 로칼 상태 되돌리기
      // 불러온 데이터를 우리 케이스 구조에 맞게 변환해야 함
      refreshCases();
      
      toast.error('체크박스 정보 저장에 실패했습니다. 다시 시도해주세요.');
      // 필요 시 데이터 새로고침
      refreshCases();
    }
  };

  // 현재 회차 변경 핸들러
  const handleCurrentRoundChange = (caseId: string, roundDay: number) => {
    setCurrentRounds(prev => ({
      ...prev,
      [caseId]: roundDay
    }));
  };

  // 케이스 데이터 새로고침
  const refreshCases = async () => {
    try {
      // 실제 API 호출로 데이터를 새로 불러오기
      const { fetchCases } = await import('@/lib/clinical-photos');
      const casesData = await fetchCases();
      
      // 데이터 변환 로직 재사용
      const transformedCases: ClinicalCase[] = await Promise.all(casesData.map(async case_ => {
        // 제품 데이터 처리
        const productTypes = [];
        if (case_.cureBooster) productTypes.push('cure_booster');
        if (case_.cureMask) productTypes.push('cure_mask');
        if (case_.premiumMask) productTypes.push('premium_mask');
        if (case_.allInOneSerum) productTypes.push('all_in_one_serum');
        
        // 피부타입 데이터 처리
        const skinTypeData = [];
        if (case_.skinRedSensitive) skinTypeData.push('red_sensitive');
        if (case_.skinPigment) skinTypeData.push('pigment');
        if (case_.skinPore) skinTypeData.push('pore');
        if (case_.skinTrouble) skinTypeData.push('acne_trouble');
        if (case_.skinWrinkle) skinTypeData.push('wrinkle');
        if (case_.skinEtc) skinTypeData.push('other');
        
        // 사진 데이터 로드
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

        // 회차별 고객 정보 로드
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

        // 기본 회차 정보가 없으면 생성 (또는 누락된 제품/피부타입 기본값 보완)
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
          createdAt: case_.createdAt.split('T')[0],
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
        };
      }));
      
      setCases(transformedCases);
      console.log('케이스 데이터 새로고침 완료');
    } catch (error) {
      console.error('케이스 데이터 새로고침 실패:', error);
    }
  };

  // 새 고객 추가 핸들러
  const handleAddCustomer = () => {
    if (hasUnsavedNewCustomer) return;
    
    const newCase: ClinicalCase = {
      id: `new-customer-${Date.now()}`,
      customerName: '',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      consentReceived: false,
      consentImageUrl: undefined,
      photos: [],
      customerInfo: {
        name: '',
        products: [],
        skinTypes: [],
        memo: ''
      },
      roundCustomerInfo: {
        1: {
          age: undefined,
          gender: undefined,
          treatmentType: '',
          products: [],
          skinTypes: [],
          memo: '',
          date: new Date().toISOString().split('T')[0]
        }
      }
    };

    setCases(prev => [newCase, ...prev]);
    setCurrentRounds(prev => ({ ...prev, [newCase.id]: 1 }));
    setHasUnsavedNewCustomer(true);
    
    // 부드러운 스크롤 애니메이션으로 새 카드로 이동
    setTimeout(() => {
      // 새로 생성된 카드를 찾아서 스크롤
      const newCard = document.querySelector(`[data-case-id="${newCase.id}"]`);
      if (newCard) {
        // 카드 강조 효과를 위한 임시 스타일 추가
        newCard.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-70', 'shadow-xl');
        
        // 애니메이션과 함께 스크롤
        newCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // 깜빡임 효과로 카드 강조
        let blinks = 0;
        const blinkInterval = setInterval(() => {
          if (blinks >= 4) {
            clearInterval(blinkInterval);
            // 강조 효과 제거
            setTimeout(() => {
              newCard.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-70', 'shadow-xl');
            }, 500);
            return;
          }
          
          if (blinks % 2 === 0) {
            newCard.classList.add('ring-offset-2', 'ring-offset-blue-100');
          } else {
            newCard.classList.remove('ring-offset-2', 'ring-offset-blue-100');
          }
          blinks++;
        }, 300);
      } else {
        // fallback: 여러 방법으로 스크롤 시도
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 400);
  };

  // 새 고객 저장 핸들러
  const handleSaveNewCustomer = async (caseId: string) => {
    try {
      const newCustomerCase = cases.find(case_ => case_.id === caseId);
      if (!newCustomerCase || !newCustomerCase.customerInfo.name.trim()) {
        alert('고객 이름을 입력해주세요.');
        return;
      }
      
      // Supabase에 새 케이스 생성
      const { createCase } = await import('@/lib/clinical-photos-api');
      const createdCase = await createCase({
        customerName: newCustomerCase.customerInfo.name,
        caseName: `${newCustomerCase.customerInfo.name} 임상케이스`,
        concernArea: '',
        treatmentPlan: newCustomerCase.customerInfo.memo || '',
        consentReceived: newCustomerCase.consentReceived
      });
      
      if (createdCase) {
        // 동의서 이미지가 있는 경우 실제 업로드
        if (newCustomerCase.consentImageUrl && newCustomerCase.consentImageUrl.startsWith('blob:')) {
          try {
            // blob URL에서 File 객체 복원
            const response = await fetch(newCustomerCase.consentImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'consent.jpg', { type: 'image/jpeg' });
            
            const { uploadConsentImage } = await import('@/lib/clinical-photos-api');
            const actualImageUrl = await uploadConsentImage(createdCase.id, file);
            
            // 케이스 정보에 실제 이미지 URL 업데이트
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, consentImageUrl: actualImageUrl }
                : case_
            ));
          } catch (error) {
            console.error('동의서 업로드 실패:', error);
            alert('동의서 업로드에 실패했습니다. 나중에 다시 업로드해주세요.');
          }
        }

        // 체크박스 데이터 업데이트
        const checkboxUpdates: any = {
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
        };
        
        // undefined 제거
        Object.keys(checkboxUpdates).forEach(key => {
          if (checkboxUpdates[key] === undefined) {
            delete checkboxUpdates[key];
          }
        });
        
        if (Object.keys(checkboxUpdates).length > 0) {
          const { updateCase } = await import('@/lib/clinical-photos-api');
          await updateCase(createdCase.id, checkboxUpdates);
        }
        
        // 로컬 상태 업데이트
        setCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { ...case_, id: createdCase.id.toString() }
            : case_
        ));
        
        setHasUnsavedNewCustomer(false);
        
        // localStorage에서 임시저장 데이터 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('unsavedNewCustomer');
        }
        
        console.log('새 고객이 성공적으로 저장되었습니다.');
      }
    } catch (error) {
      console.error('새 고객 저장 실패:', error);
      alert('새 고객 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 케이스 삭제 핸들러 (새 고객 + 실제 케이스)
  const handleDeleteCase = async (caseId: string) => {
    try {
      // AlertDialog에서 이미 확인됨

      // 새 고객인 경우
      if (isNewCustomer(caseId)) {
        console.log('Deleting new customer:', caseId);
        setCases(prev => {
          const filtered = prev.filter(case_ => case_.id !== caseId);
          console.log('Cases after delete:', filtered.map(c => c.id));
          return filtered;
        });
        setCurrentRounds(prev => {
          const newRounds = { ...prev };
          delete newRounds[caseId];
          return newRounds;
        });
        setHasUnsavedNewCustomer(false);
        
        // localStorage에서 임시저장 데이터 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('unsavedNewCustomer');
          console.log('localStorage cleared');
        }
        
        toast.success('새 고객이 삭제되었습니다.');
        return;
      }

      // 실제 케이스인 경우 API 호출로 삭제
      const { deleteCase } = await import('@/lib/clinical-photos-api');
      const success = await deleteCase(parseInt(caseId));
      
      if (success) {
        // 로컬 상태에서 제거
        setCases(prev => prev.filter(case_ => case_.id !== caseId));
        setCurrentRounds(prev => {
          const newRounds = { ...prev };
          delete newRounds[caseId];
          return newRounds;
        });
        
        console.log('케이스가 성공적으로 삭제되었습니다.');
        toast.success('케이스가 성공적으로 삭제되었습니다.');
      } else {
        throw new Error('케이스 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('케이스 삭제 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(`케이스 삭제 실패: ${errorMessage}`);
    }
  };

  // 새 고객 삭제 핸들러 (하위 호환성을 위해 유지)
  const handleDeleteNewCustomer = (caseId: string) => {
    handleDeleteCase(caseId);
  };

  // 새 고객 케이스인지 확인하는 함수
  const isNewCustomer = (caseId: string) => caseId.startsWith('new-customer-');

  // 전체 저장 핸들러
  const handleSaveAll = async (caseId: string) => {
    markSaving(caseId);
    try {
      const targetCase = cases.find(c => c.id === caseId);
      if (!targetCase) return;

      // 새 고객 케이스라면 기존 저장 로직 재사용
      if (isNewCustomer(caseId)) {
        await handleSaveNewCustomer(caseId);
        return;
      }

      const roundDay = currentRounds[caseId] || 1;
      const roundInfo = targetCase.roundCustomerInfo[roundDay];

      // 기본 정보, 회차별 정보, 체크박스 정보 저장
      await Promise.all([
        handleBasicCustomerInfoUpdate(caseId, {
          name: targetCase.customerInfo.name,
          age: targetCase.customerInfo.age,
          gender: targetCase.customerInfo.gender,
        }),
        roundInfo
          ? handleRoundCustomerInfoUpdate(caseId, roundDay, roundInfo)
          : Promise.resolve(),
        updateCaseCheckboxes(caseId, {
          cureBooster: targetCase.cureBooster,
          cureMask: targetCase.cureMask,
          premiumMask: targetCase.premiumMask,
          allInOneSerum: targetCase.allInOneSerum,
          skinRedSensitive: targetCase.skinRedSensitive,
          skinPigment: targetCase.skinPigment,
          skinPore: targetCase.skinPore,
          skinTrouble: targetCase.skinTrouble,
          skinWrinkle: targetCase.skinWrinkle,
          skinEtc: targetCase.skinEtc,
        }),
      ]);

      markSaved(caseId);
      toast.success('전체저장되었습니다!');
    } catch (error) {
      console.error('전체 저장 실패:', error);
      markError(caseId);
      toast.error('전체 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null || loading) {
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

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (!isKol) {
    return redirect('/');
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <KolHeader 
        userName={user?.firstName || "KOL"}
        shopName={dashboardData?.kol?.shopName || "로딩 중..."}
        userImage={user?.imageUrl}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop Only */}
        <KolSidebar />

        {/* Main Content */}
        <main ref={mainContentRef} className="flex-1 overflow-auto bg-soksok-light-blue/10">
          <div className="mx-auto max-w-4xl">
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

                      {/* 두 번째 줄: 동의서 상태 메타정보 */}
                      {case_.consentReceived && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          {case_.consentImageUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="text-xs text-purple-700 bg-biofox-lavender/20 px-2 py-1 rounded-full hover:bg-biofox-lavender/30 transition-colors flex items-center gap-1">
                                  📎 동의서 업로드됨
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
                                <DialogHeader>
                                  <DialogTitle>동의서 보기</DialogTitle>
                                  <DialogDescription>
                                    {case_.customerName}님의 동의서
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <img
                                    src={case_.consentImageUrl}
                                    alt="동의서"
                                    className="w-full h-auto max-h-96 object-contain rounded-lg border"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConsentUpload(case_.id)}
                                      disabled={consentUploading[case_.id]}
                                      className="flex items-center gap-1"
                                    >
                                      {consentUploading[case_.id] ? (
                                        <>
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"></div>
                                          업로드 중...
                                        </>
                                      ) : (
                                        <>
                                          <Edit className="h-3 w-3" />
                                          수정
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        handleConsentDelete(case_.id);
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      삭제
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                className="text-xs text-biofox-blue-violet bg-soksok-light-blue px-2 py-1 rounded-full hover:bg-soksok-light-blue/80 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleConsentUpload(case_.id)}
                                disabled={consentUploading[case_.id]}
                              >
                                {consentUploading[case_.id] ? (
                                  <>
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"></div>
                                    업로드 중...
                                  </>
                                ) : (
                                  <>
                                    📎 동의서 업로드
                                  </>
                                )}
                              </button>
                              {!consentUploading[case_.id] && (
                                <span className="text-xs text-orange-600">
                                  ⚠️ 업로드 필요
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* 블록 1: 임상사진 업로드 */}
                      <div className="space-y-3">
                        <PhotoRoundCarousel
                          caseId={case_.id}
                          photos={case_.photos}
                          onPhotoUpload={(roundDay, angle, file) => handlePhotoUpload(case_.id, roundDay, angle, file)}
                          onPhotoDelete={(roundDay, angle) => handlePhotoDelete(case_.id, roundDay, angle)}
                          isCompleted={case_.status === 'completed'}
                          onRoundChange={(roundDay) => handleCurrentRoundChange(case_.id, roundDay)}
                          onPhotosRefresh={() => refreshCases()}
                        />
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

            <div className="mt-6 px-4 md:px-6">
              <KolFooter />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger className="block sm:hidden">
          <div className="flex items-center justify-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu 
            userName={user?.firstName || dashboardData?.kol?.name || "KOL"}
            shopName={dashboardData?.kol?.shopName || "임상사진 업로드"}
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

    </div>
  );
}