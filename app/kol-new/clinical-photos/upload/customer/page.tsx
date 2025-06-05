'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft, Camera, Plus, Calendar, User, Scissors, Eye, Trash2, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
    { value: 'cure_mask', label: '큐어 마스크팩' },
    { value: 'premium_mask', label: '프리미엄 마스크팩' },
    { value: 'allinone_serum', label: '올인원 세럼' }
  ] as const,
  
  skinTypes: [
    { value: 'red_sensitive', label: '붉고 예민함' },
    { value: 'pigmentation', label: '색소 / 미백' },
    { value: 'pores_enlarged', label: '모공 늘어짐' },
    { value: 'acne_trouble', label: '트러블 / 여드름' },
    { value: 'wrinkles_elasticity', label: '주름 / 탄력' },
    { value: 'other', label: '기타' }
  ] as const
} as const;

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
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
  date?: string; // 회차별 날짜
}

// 케이스 데이터 타입
interface ClinicalCase {
  id: string;
  customerName: string;
  status: 'active' | 'completed';
  createdAt: string;
  consentReceived: boolean;
  consentImageUrl?: string;
  photos: PhotoSlot[];
  customerInfo: CustomerInfo;
  roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo };
}

interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploaded: boolean;
}

export default function CustomerClinicalUploadPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 케이스 관리 상태
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const [consentViewModal, setConsentViewModal] = useState<{ isOpen: boolean; imageUrl?: string }>({ isOpen: false });
  const [hasUnsavedNewCustomer, setHasUnsavedNewCustomer] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());
  const mainContentRef = useRef<HTMLElement>(null);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      try {
        const userRole = user.publicMetadata?.role as string || "kol";
        console.log('사용자 역할:', userRole);
        setIsKol(userRole === "kol");
        setLoading(false);
      } catch (err) {
        console.error('사용자 역할 확인 중 오류:', err);
        setIsKol(true);
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user]);

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

  // 목 데이터 로드 (추후 API로 대체)
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      // 임시 목 데이터
      const mockCases: ClinicalCase[] = [
        {
          id: 'case-1',
          customerName: '김고객',
          status: 'active',
          createdAt: '2025-06-05',
          consentReceived: true,
          consentImageUrl: '/images/sample-consent.jpg',
          photos: [
            { id: 'p1', roundDay: 1, angle: 'front', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
            { id: 'p2', roundDay: 1, angle: 'left', uploaded: false },
            { id: 'p3', roundDay: 1, angle: 'right', uploaded: false },
            { id: 'p4', roundDay: 2, angle: 'front', uploaded: false },
          ],
          customerInfo: {
            name: '김고객',
            age: 32,
            gender: 'female',
            treatmentType: '10GF',
            products: ['cure_booster', 'premium_mask'],
            skinTypes: ['red_sensitive', 'pores_enlarged'],
            memo: '민감한 피부로 관리 시 주의 필요',
          },
          roundCustomerInfo: {
            1: {
              treatmentType: '10GF',
              products: ['cure_booster', 'premium_mask'],
              skinTypes: ['red_sensitive', 'pores_enlarged'],
              memo: '민감한 피부로 관리 시 주의 필요'
            }
          }
        },
        {
          id: 'case-2',
          customerName: '이고객',
          status: 'completed',
          createdAt: '2025-06-03',
          consentReceived: true,
          consentImageUrl: '/images/sample-consent.jpg',
          photos: [
            { id: 'p5', roundDay: 1, angle: 'front', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
            { id: 'p6', roundDay: 1, angle: 'left', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
            { id: 'p7', roundDay: 1, angle: 'right', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
            { id: 'p8', roundDay: 2, angle: 'front', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
          ],
          customerInfo: {
            name: '이고객',
            age: 28,
            gender: 'female',
            treatmentType: 'realafter',
            products: ['cure_mask', 'allinone_serum'],
            skinTypes: ['dull', 'wrinkles'],
            memo: '정기 관리 고객'
          },
          roundCustomerInfo: {
            1: {
              treatmentType: 'realafter',
              products: ['cure_mask', 'allinone_serum'],
              skinTypes: ['dull', 'wrinkles'],
              memo: '정기 관리 고객',
              date: '2025-06-03'
            },
            2: {
              treatmentType: 'realafter',
              products: ['cure_mask'],
              skinTypes: ['wrinkles'],
              memo: '2회차 - 주름 개선 집중',
              date: '2025-06-10'
            }
          }
        },
        {
          id: 'case-3',
          customerName: '박고객',
          status: 'active',
          createdAt: '2025-06-01',
          consentReceived: true,
          // consentImageUrl 없음 - 업로드 필요 표시됨
          photos: [
            { id: 'p9', roundDay: 1, angle: 'front', uploaded: true, imageUrl: '/images/sample-photo.jpg' },
            { id: 'p10', roundDay: 1, angle: 'left', uploaded: false },
            { id: 'p11', roundDay: 1, angle: 'right', uploaded: false },
            { id: 'p12', roundDay: 2, angle: 'front', uploaded: false },
          ],
          customerInfo: {
            name: '박고객',
            age: 45,
            gender: 'male',
            treatmentType: '10GF',
            products: ['cure_booster'],
            skinTypes: ['trouble', 'sagging'],
            memo: ''
          },
          roundCustomerInfo: {
            1: {
              treatmentType: '10GF',
              products: ['cure_booster'],
              skinTypes: ['trouble', 'sagging'],
              memo: '',
              date: '2025-06-01'
            }
          }
        },
        {
          id: 'case-4',
          customerName: '최고객',
          status: 'active',
          createdAt: '2025-06-04',
          consentReceived: false,
          // 미동의 상태 테스트
          photos: [],
          customerInfo: {
            name: '최고객',
            age: 35,
            gender: 'female',
            products: [],
            skinTypes: [],
            memo: ''
          },
          roundCustomerInfo: {}
        }
      ];
      setCases(mockCases);
      
      // 초기 현재 회차 설정
      const initialRounds: { [caseId: string]: number } = {};
      mockCases.forEach(case_ => {
        initialRounds[case_.id] = 1;
      });
      setCurrentRounds(initialRounds);
    }
  }, [isLoaded, isSignedIn, isKol]);

  // Intersection Observer를 사용한 카드 가시성 감지 및 숫자 표시
  useEffect(() => {
    const timeoutRefs = new Map<string, NodeJS.Timeout>();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const caseId = entry.target.getAttribute('data-case-id');
          if (caseId) {
            // 카드 가시성 상태 업데이트
            setVisibleCards(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(caseId);
              } else {
                newSet.delete(caseId);
              }
              return newSet;
            });

            if (entry.isIntersecting) {
              // 기존 타이머가 있다면 클리어
              const existingTimeout = timeoutRefs.get(caseId);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
              }
              
              // 숫자 표시 시작
              setNumberVisibleCards(prev => {
                const newSet = new Set(prev);
                newSet.add(caseId);
                return newSet;
              });
              
              // 1초 후 숫자 숨기기
              const newTimeout = setTimeout(() => {
                setNumberVisibleCards(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(caseId);
                  return newSet;
                });
                timeoutRefs.delete(caseId);
              }, 1000);
              
              timeoutRefs.set(caseId, newTimeout);
              
            } else {
              // 뷰포트에서 벗어나면 숫자 즉시 숨기기
              setNumberVisibleCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(caseId);
                return newSet;
              });
              
              // 관련 타이머 클리어
              const existingTimeout = timeoutRefs.get(caseId);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
                timeoutRefs.delete(caseId);
              }
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    const cardElements = document.querySelectorAll('[data-case-id]');
    cardElements.forEach(card => observer.observe(card));

    return () => {
      observer.disconnect();
      timeoutRefs.forEach(timeout => clearTimeout(timeout));
    };
  }, [cases]);

  // 케이스 상태 변경 핸들러
  const handleCaseStatusChange = (caseId: string, status: 'active' | 'completed') => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId ? { ...case_, status } : case_
    ));
  };

  // 동의 상태 변경 핸들러
  const handleConsentChange = (caseId: string, consentReceived: boolean) => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId 
        ? { 
            ...case_, 
            consentReceived,
            consentImageUrl: consentReceived ? case_.consentImageUrl : undefined 
          }
        : case_
    ));
  };

  // 동의서 업로드 핸들러
  const handleConsentUpload = (caseId: string) => {
    // TODO: 실제 파일 업로드 로직 구현
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // 임시로 URL.createObjectURL 사용
        const imageUrl = URL.createObjectURL(file);
        setCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { ...case_, consentImageUrl: imageUrl }
            : case_
        ));
      }
    };
    input.click();
  };

  // 동의서 삭제 핸들러
  const handleConsentDelete = (caseId: string) => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId 
        ? { ...case_, consentImageUrl: undefined }
        : case_
    ));
  };

  // 동의서 보기 핸들러
  const handleConsentView = (imageUrl: string) => {
    setConsentViewModal({ isOpen: true, imageUrl });
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = (caseId: string, roundDay: number, angle: string) => {
    console.log('Photo upload:', { caseId, roundDay, angle });
    // TODO: 파일 업로드 로직 구현
  };

  // 기본 고객정보 업데이트 핸들러 (이름, 나이, 성별)
  const handleBasicCustomerInfoUpdate = (caseId: string, customerInfo: Partial<Pick<CustomerInfo, 'name' | 'age' | 'gender'>>) => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId 
        ? { 
            ...case_, 
            customerName: customerInfo.name || case_.customerName,
            customerInfo: { ...case_.customerInfo, ...customerInfo } 
          }
        : case_
    ));
  };

  // 회차별 고객정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모)
  const handleRoundCustomerInfoUpdate = (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
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
  };

  // 현재 회차 변경 핸들러
  const handleCurrentRoundChange = (caseId: string, roundDay: number) => {
    setCurrentRounds(prev => ({
      ...prev,
      [caseId]: roundDay
    }));
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
    
    // 새 카드의 숫자도 표시
    setNumberVisibleCards(prev => {
      const newSet = new Set(prev);
      newSet.add(newCase.id);
      return newSet;
    });
    
    // 3초 후 숫자 숨기기
    const hideNumberTimeout = setTimeout(() => {
      setNumberVisibleCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(newCase.id);
        return newSet;
      });
    }, 3000);
    
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
  const handleSaveNewCustomer = (caseId: string) => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId 
        ? { ...case_, id: `case-${Date.now()}` } // ID를 정식 케이스 ID로 변경
        : case_
    ));
    setHasUnsavedNewCustomer(false);
    
    // localStorage에서 임시저장 데이터 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unsavedNewCustomer');
    }
  };

  // 새 고객 삭제 핸들러
  const handleDeleteNewCustomer = (caseId: string) => {
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
  };

  // 새 고객 케이스인지 확인하는 함수
  const isNewCustomer = (caseId: string) => caseId.startsWith('new-customer-');

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
        shopName={"고객 임상사진 업로드"}
        userImage={user?.imageUrl}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop Only */}
        <KolSidebar />

        {/* Main Content */}
        <main ref={mainContentRef} className="flex-1 overflow-auto bg-muted/10">
          <div className="mx-auto max-w-4xl">
            {/* 뒤로가기 헤더 - 고정 */}
            <div className="sticky top-0 z-10 bg-white py-3 px-4 md:px-6 border-b border-gray-200">
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
                    className="flex items-center gap-2"
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
              <div className="space-y-6 p-4 md:p-6 pt-6">
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
                          opacity: visibleCards.has(case_.id) ? 1 : 0.7,
                          y: 0, 
                          scale: visibleCards.has(case_.id) ? 1 : 0.95,
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
                          className={`relative overflow-hidden border-2 transition-all duration-300 shadow-lg ${
                            visibleCards.has(case_.id) 
                              ? 'shadow-xl' 
                              : 'shadow-md'
                          } ${
                            case_.status === 'completed' 
                              ? 'border-green-200 bg-green-50/50' 
                              : 'border-gray-200 bg-white'
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
                              duration: 0.5, 
                              ease: "easeOut",
                              opacity: { 
                                duration: numberVisibleCards.has(case_.id) ? 0.3 : 0.6,
                                ease: numberVisibleCards.has(case_.id) ? "easeOut" : "easeIn"
                              },
                              scale: { duration: 0.4 },
                              rotate: { duration: 0.5 },
                              y: { duration: 0.4 }
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
                                duration: numberVisibleCards.has(case_.id) ? 0.3 : 0.6,
                                ease: numberVisibleCards.has(case_.id) ? "easeOut" : "easeIn"
                              }}
                            >
                              {cases.length - index}
                            </motion.span>
                          </motion.div>
                          
                          {/* 카드 내용 */}
                          <div className="relative" style={{ zIndex: 1 }}>
                    <CardHeader className="pb-4">
                      {/* 첫 번째 줄: 제목과 상태 탭 */}
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {cases.length - index}
                            </div>
                            <span className="text-lg font-semibold truncate">{case_.customerName || '새 고객'}</span>
                            {isNewCustomer(case_.id) && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">새 고객</span>
                            )}
                            {/* 완료 상태인데 동의서가 없으면 경고 */}
                            {case_.status === 'completed' && case_.consentReceived && !case_.consentImageUrl && (
                              <span className="text-orange-500 flex-shrink-0">⚠️</span>
                            )}
                          </CardTitle>
                        </div>
                        
                        {/* 새 고객인 경우 저장/삭제 버튼, 기존 고객인 경우 상태 탭 */}
                        <div className="flex-shrink-0">
                          {isNewCustomer(case_.id) ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveNewCustomer(case_.id)}
                                className="flex items-center gap-1"
                                disabled={!case_.customerInfo.name.trim()}
                              >
                                <Save className="h-3 w-3" />
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteNewCustomer(case_.id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </Button>
                            </div>
                          ) : (
                            <CaseStatusTabs
                              status={case_.status}
                              onStatusChange={(status) => handleCaseStatusChange(case_.id, status)}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* 두 번째 줄: 동의 탭과 동의서 상태 */}
                      <div className="flex items-center gap-3 mb-2">
                        {/* 고객동의 탭 */}
                        <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                          <button
                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                              case_.consentReceived 
                                ? 'bg-green-500 text-white' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => handleConsentChange(case_.id, true)}
                          >
                            동의
                          </button>
                          <button
                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                              !case_.consentReceived 
                                ? 'bg-red-500 text-white' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => handleConsentChange(case_.id, false)}
                          >
                            미동의
                          </button>
                        </div>

                        {/* 동의서 상태 표시 */}
                        {case_.consentReceived && (
                          <div className="flex items-center gap-2">
                            {case_.consentImageUrl ? (
                              <div className="flex items-center gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors flex items-center gap-1">
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
                                          className="flex items-center gap-1"
                                        >
                                          <Edit className="h-3 w-3" />
                                          수정
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
                              </div>
                            ) : (
                              <>
                                <button 
                                  className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 whitespace-nowrap"
                                  onClick={() => handleConsentUpload(case_.id)}
                                >
                                  📎 동의서 업로드
                                </button>
                                <span className="text-xs text-orange-600 whitespace-nowrap">
                                  ⚠️ 업로드 필요
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PhotoRoundCarousel
                        caseId={case_.id}
                        photos={case_.photos}
                        onPhotoUpload={(roundDay, angle) => handlePhotoUpload(case_.id, roundDay, angle)}
                        isCompleted={case_.status === 'completed'}
                        onRoundChange={(roundDay) => handleCurrentRoundChange(case_.id, roundDay)}
                      />
                      
                      {/* 고객 정보 카드 */}
                      <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {cases.length - index}
                          </div>
                          <h3 className="text-lg font-semibold">고객 정보</h3>
                          <span className="text-sm text-gray-500">
                            ({currentRounds[case_.id] || 1}회차)
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 이름 + 나이 */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2" style={{width: '50%'}}>
                              <Label htmlFor={`name-${case_.id}`} className="text-xs font-medium w-10 shrink-0">이름</Label>
                              <Input
                                id={`name-${case_.id}`}
                                value={case_.customerInfo.name}
                                onChange={(e) => handleBasicCustomerInfoUpdate(case_.id, { name: e.target.value })}
                                placeholder="고객 이름"
                                className="flex-1 text-sm h-8"
                              />
                            </div>
                            <div className="flex items-center gap-2" style={{width: '50%'}}>
                              <Label htmlFor={`age-${case_.id}`} className="text-xs font-medium w-10 shrink-0">나이</Label>
                              <Input
                                id={`age-${case_.id}`}
                                type="number"
                                value={case_.customerInfo.age || ''}
                                onChange={(e) => handleBasicCustomerInfoUpdate(case_.id, { 
                                  age: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                placeholder="나이"
                                className="flex-1 text-sm h-8"
                              />
                            </div>
                          </div>
                          
                          {/* 성별 + 날짜 */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2" style={{width: '50%'}}>
                              <Label className="text-xs font-medium w-10 shrink-0">성별</Label>
                              <Select
                                value={case_.customerInfo.gender || ''}
                                onValueChange={(value: 'male' | 'female' | 'other') => 
                                  handleBasicCustomerInfoUpdate(case_.id, { gender: value })
                                }
                              >
                                <SelectTrigger className="flex-1 text-sm h-8">
                                  <SelectValue placeholder="성별 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SYSTEM_OPTIONS.genders.map((gender) => (
                                    <SelectItem key={gender.value} value={gender.value}>
                                      {gender.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2" style={{width: '50%'}}>
                              <Label htmlFor={`date-${case_.id}`} className="text-xs font-medium w-10 shrink-0">날짜</Label>
                              <Input
                                id={`date-${case_.id}`}
                                type="date"
                                value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.date || ''}
                                onChange={(e) => 
                                  handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { date: e.target.value })
                                }
                                className="flex-1 text-sm h-8"
                              />
                            </div>
                          </div>
                          
                          {/* 관리 유형 */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-medium min-w-12 shrink-0">관리유형</Label>
                            <Select
                              value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.treatmentType || ''}
                              onValueChange={(value) => 
                                handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { treatmentType: value })
                              }
                            >
                              <SelectTrigger className="flex-1 text-sm h-8">
                                <SelectValue placeholder="관리 유형 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {SYSTEM_OPTIONS.treatmentTypes.map((treatment) => (
                                  <SelectItem key={treatment.value} value={treatment.value}>
                                    {treatment.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* 홈케어 제품 (멀티셀렉트) */}
                        <div className="space-y-2 mt-4">
                          <Label className="text-sm font-medium">홈케어 제품</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {SYSTEM_OPTIONS.products.map((product) => {
                              const currentRound = currentRounds[case_.id] || 1;
                              const currentRoundInfo = case_.roundCustomerInfo[currentRound] || { 
                                treatmentType: '', 
                                products: [], 
                                skinTypes: [], 
                                memo: '', 
                                date: '' 
                              };
                              
                              return (
                                <div key={product.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`product-${case_.id}-${currentRound}-${product.value}`}
                                    checked={currentRoundInfo.products.includes(product.value)}
                                    onCheckedChange={(checked) => {
                                      const currentProducts = currentRoundInfo.products;
                                      const newProducts = checked
                                        ? [...currentProducts, product.value]
                                        : currentProducts.filter(p => p !== product.value);
                                      handleRoundCustomerInfoUpdate(case_.id, currentRound, { products: newProducts });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`product-${case_.id}-${currentRound}-${product.value}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {product.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* 고객 피부타입 (멀티셀렉트) */}
                        <div className="space-y-2 mt-4">
                          <Label className="text-sm font-medium">고객 피부타입</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {SYSTEM_OPTIONS.skinTypes.map((skinType) => {
                              const currentRound = currentRounds[case_.id] || 1;
                              const currentRoundInfo = case_.roundCustomerInfo[currentRound] || { 
                                treatmentType: '', 
                                products: [], 
                                skinTypes: [], 
                                memo: '', 
                                date: '' 
                              };
                              
                              return (
                                <div key={skinType.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`skin-${case_.id}-${currentRound}-${skinType.value}`}
                                    checked={currentRoundInfo.skinTypes.includes(skinType.value)}
                                    onCheckedChange={(checked) => {
                                      const currentSkinTypes = currentRoundInfo.skinTypes;
                                      const newSkinTypes = checked
                                        ? [...currentSkinTypes, skinType.value]
                                        : currentSkinTypes.filter(s => s !== skinType.value);
                                      handleRoundCustomerInfoUpdate(case_.id, currentRound, { skinTypes: newSkinTypes });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`skin-${case_.id}-${currentRound}-${skinType.value}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {skinType.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* 특이사항 */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor={`memo-${case_.id}`} className="text-sm font-medium">특이사항</Label>
                          <Textarea
                            id={`memo-${case_.id}`}
                            value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.memo || ''}
                            onChange={(e) => 
                              handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { memo: e.target.value })
                            }
                            placeholder="해당 회차 관련 특이사항을 입력하세요..."
                            className="w-full min-h-[80px]"
                          />
                          </div>
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
            userName={user?.firstName || "KOL"}
            shopName={"고객 임상사진 업로드"}
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

    </div>
  );
}