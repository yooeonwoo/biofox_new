'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { fetchCases, updateCase } from '@/lib/clinical-photos';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Camera, Save, Edit, Trash2, Eye } from "lucide-react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import KolHeader from "../../../../components/layout/KolHeader";
import KolSidebar from "../../../../components/layout/KolSidebar";
import KolFooter from "../../../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle as SheetDialogTitle } from "@/components/ui/dialog";
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
type CaseStatus = 'active' | 'completed';

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

export default function PersonalClinicalUploadPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ kol?: KolInfo } | null>(null);
  
  // 케이스 관리 상태
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const mainContentRef = useRef<HTMLElement>(null);
  
  // 동의서 관련 상태
  const [consentViewModal, setConsentViewModal] = useState<{ isOpen: boolean; imageUrl?: string }>({ isOpen: false });
  const [consentUploading, setConsentUploading] = useState<{ [caseId: string]: boolean }>({});
  
  // IME 상태 관리 (한글 입력 문제 해결) 및 debounce
  const [isComposing, setIsComposing] = useState(false);
  const [inputDebounceTimers, setInputDebounceTimers] = useState<{[key: string]: NodeJS.Timeout}>({});
  
  // ---------------- 저장 상태 관리 ----------------
  const [saveStatus, setSaveStatus] = useState<{[caseId:string]: 'idle' | 'saving' | 'saved' | 'error'}>({});
  const markSaving = (caseId:string) => setSaveStatus(prev=>({...prev,[caseId]:'saving'}));
  const markSaved = (caseId:string) => {
    setSaveStatus(prev=>({...prev,[caseId]:'saved'}));
    setTimeout(()=> setSaveStatus(prev=>({...prev,[caseId]:'idle'})), 2000);
  };
  const markError = (caseId:string) => setSaveStatus(prev=>({...prev,[caseId]:'error'}));
  
  // ✅ 케이스별 API 직렬화를 위한 Promise Queue
  const updateQueue = useRef<Record<string, Promise<void>>>({});
  const enqueue = (caseId:string, task:()=>Promise<void>) => {
    updateQueue.current[caseId] = (updateQueue.current[caseId] ?? Promise.resolve())
      .then(task)
      .catch(err => { console.error('enqueue error', err); });
    return updateQueue.current[caseId];
  };

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
          console.log('임상관리(본인) - 대시보드 데이터 로드 시작...');
          const dashboardResponse = await fetch('/api/kol-new/dashboard');
          
          if (!dashboardResponse.ok) {
            console.error('대시보드 API 에러');
            return;
          }
          
          const dashboardResult = await dashboardResponse.json();
          console.log('임상관리(본인) - 대시보드 데이터 로드 완료');
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


  // 실제 케이스 데이터 로드
  useEffect(() => {
    const loadCases = async () => {
      if (!isLoaded || !isSignedIn || !isKol) return;
      
      try {
        // fetchCases API를 사용해서 실제 데이터 가져오기
        const { fetchCases } = await import('@/lib/clinical-photos');
        const allCasesData = await fetchCases();
        
        console.log('전체 케이스 데이터:', allCasesData.map(c => ({ id: c.id, customerName: c.customerName })));
        
        // 본인 케이스만 정확히 찾기 (정확한 매칭)
        const personalCase = allCasesData.find(case_ => 
          case_.customerName?.trim() === '본인'
        );
        
        console.log('찾은 본인 케이스:', personalCase);
        
        // 본인 케이스가 없으면 생성
        if (!personalCase) {
          console.log('본인 케이스가 없어서 생성합니다.');
          
          try {
            const { createCase } = await import('@/lib/clinical-photos');
            const newPersonalCase = await createCase({
              customerName: '본인',
              caseName: '본인 임상 케이스',
              concernArea: '본인 케어',
              treatmentPlan: '개인 관리 계획',
              consentReceived: false,
            });
            
            if (newPersonalCase) {
              console.log('본인 케이스 생성 완료:', newPersonalCase);
              
              // 생성된 케이스를 기반으로 변환
              const transformedCase: ClinicalCase = {
                id: newPersonalCase.id.toString(),
                customerName: '본인',
                status: 'active',
                createdAt: newPersonalCase.createdAt.split('T')[0],
                consentReceived: false,
                consentImageUrl: undefined,
                photos: [],
                customerInfo: {
                  name: '본인',
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
                    date: newPersonalCase.createdAt.split('T')[0]
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
              
              setCases([transformedCase]);
              setCurrentRounds({ [transformedCase.id]: 1 });
              
              toast.success('본인 임상 케이스가 생성되었습니다.');
            } else {
              throw new Error('케이스 생성에 실패했습니다.');
            }
          } catch (createError) {
            console.error('본인 케이스 생성 실패:', createError);
            toast.error('본인 케이스 생성에 실패했습니다.');
            setCases([]);
          }
        } else {
          // 본인 케이스가 존재하는 경우
          console.log('기존 본인 케이스를 로드합니다:', personalCase.id);
          
          // 체크박스 관련 제품 데이터 처리
          const productTypes = [];
          if (personalCase.cureBooster) productTypes.push('cure_booster');
          if (personalCase.cureMask) productTypes.push('cure_mask');
          if (personalCase.premiumMask) productTypes.push('premium_mask');
          if (personalCase.allInOneSerum) productTypes.push('all_in_one_serum');
          
          // 체크박스 관련 피부타입 데이터 처리
          const skinTypeData = [];
          if (personalCase.skinRedSensitive) skinTypeData.push('red_sensitive');
          if (personalCase.skinPigment) skinTypeData.push('pigment');
          if (personalCase.skinPore) skinTypeData.push('pore');
          if (personalCase.skinTrouble) skinTypeData.push('acne_trouble');
          if (personalCase.skinWrinkle) skinTypeData.push('wrinkle');
          if (personalCase.skinEtc) skinTypeData.push('other');
          
          // 사진 데이터 로드
          let photos: PhotoSlot[] = [];
          try {
            const { fetchPhotos } = await import('@/lib/clinical-photos');
            const photoData = await fetchPhotos(personalCase.id);
            photos = photoData.map(p => ({
              id: p.id,
              roundDay: p.roundDay,
              angle: p.angle as 'front' | 'left' | 'right',
              imageUrl: p.imageUrl,
              uploaded: true
            }));
          } catch (error) {
            console.error(`Failed to load photos for case ${personalCase.id}:`, error);
          }
          
          // 회차별 고객 정보 로드
          const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};
          try {
            const { fetchRoundCustomerInfo } = await import('@/lib/clinical-photos');
            const roundData = await fetchRoundCustomerInfo(personalCase.id);
            roundData.forEach(round => {
              roundCustomerInfo[round.round_number] = {
                age: round.age,
                gender: round.gender,
                treatmentType: round.treatment_type || '',
                products: round.products,
                skinTypes: round.skin_types,
                memo: (round.memo || '').replace(/^\[본인\]\s*/, ''),
                date: round.treatment_date || ''
              };
            });
          } catch (error) {
            console.error(`Failed to load round info for case ${personalCase.id}:`, error);
          }
          
          const transformedCase: ClinicalCase = {
            id: personalCase.id.toString(),
            customerName: '본인',
            status: personalCase.status === 'archived' ? 'active' : (personalCase.status as CaseStatus),
            createdAt: personalCase.createdAt.split('T')[0],
            consentReceived: personalCase.consentReceived,
            consentImageUrl: personalCase.consentImageUrl,
            photos: photos,
            customerInfo: {
              name: '본인',
              products: productTypes,
              skinTypes: skinTypeData,
              memo: personalCase.treatmentPlan ? personalCase.treatmentPlan.replace(/^\[본인\]\s*/, '') : ''
            },
            roundCustomerInfo: roundCustomerInfo,
            cureBooster: personalCase.cureBooster || false,
            cureMask: personalCase.cureMask || false,
            premiumMask: personalCase.premiumMask || false,
            allInOneSerum: personalCase.allInOneSerum || false,
            skinRedSensitive: personalCase.skinRedSensitive || false,
            skinPigment: personalCase.skinPigment || false,
            skinPore: personalCase.skinPore || false,
            skinTrouble: personalCase.skinTrouble || false,
            skinWrinkle: personalCase.skinWrinkle || false,
            skinEtc: personalCase.skinEtc || false
          };
          
          setCases([transformedCase]);
          
          // 초기 현재 회차 설정
          setCurrentRounds({ [transformedCase.id]: 1 });
        }
      } catch (error) {
        console.error('Failed to load cases:', error);
        toast.error('케이스 로드에 실패했습니다.');
        setCases([]); // 에러 시 빈 배열
      }
    };

    loadCases();
  }, [isLoaded, isSignedIn, isKol]);


  // 케이스 상태 변경 핸들러
  const handleCaseStatusChange = (caseId: string, status: 'active' | 'completed') => {
    setCases(prev => prev.map(case_ => 
      case_.id === caseId ? { ...case_, status } : case_
    ));
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
      
      // 실제 API 호출
      const { updateCase } = await import('@/lib/clinical-photos');
      const updateData: any = { consentReceived };
      
      // 동의 취소 시 동의서 이미지도 제거
      if (!consentReceived) {
        updateData.consentImageUrl = undefined;
      }
      
      await updateCase(parseInt(caseId), updateData);
      
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
          toast.error('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
          return;
        }

        // 파일 크기 제한 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error('파일 크기는 10MB 이하여야 합니다.');
          return;
        }

        // 업로드 시작
        setConsentUploading(prev => ({ ...prev, [caseId]: true }));

        try {
          // 실제 케이스의 경우 Supabase에 업로드
          const { uploadConsentImage, fetchCase } = await import('@/lib/clinical-photos');
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
                  ? { ...case_, consentImageUrl: imageUrl, consentReceived: true }
                  : case_
              ));
            }
          } catch (refreshError) {
            console.error('동의서 정보 새로고침 실패:', refreshError);
            // 새로고침 실패 시 기존 방식으로 로컬 업데이트
            setCases(prev => prev.map(case_ => 
              case_.id === caseId 
                ? { ...case_, consentImageUrl: imageUrl, consentReceived: true }
                : case_
            ));
          }
          
          console.log('동의서가 성공적으로 업로드되었습니다.');
          toast.success('동의서가 성공적으로 업로드되었습니다.');
        } catch (error) {
          console.error('동의서 업로드 실패:', error);
          toast.error(`동의서 업로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          
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
        const { fetchCase } = await import('@/lib/clinical-photos');
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
      
      console.log('동의서가 성공적으로 삭제되었습니다.');
      toast.success('동의서가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('동의서 삭제 실패:', error);
      toast.error(`동의서 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
        // 실제 케이스의 경우 Supabase에 업로드
        const { uploadPhoto, fetchPhotos } = await import('@/lib/clinical-photos');
        const imageUrl = await uploadPhoto(parseInt(caseId), roundDay, angle, file);
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
        
        console.log('사진이 성공적으로 업로드되었습니다.');
        toast.success('사진이 성공적으로 업로드되었습니다.');
      } catch (error) {
        console.error('사진 업로드 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        toast.error(`사진 업로드 실패: ${errorMessage}`);
        throw error;
      }
    }
  };

  // 사진 삭제 핸들러
  const handlePhotoDelete = async (caseId: string, roundDay: number, angle: string): Promise<void> => {
    try {
      // 실제 삭제 API 호출
      const { deletePhoto, fetchPhotos } = await import('@/lib/clinical-photos');
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
      
      console.log('사진이 성공적으로 삭제되었습니다.');
      toast.success('사진이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      toast.error('사진 삭제에 실패했습니다. 다시 시도해주세요.');
      throw error;
    }
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

  // 회차별 고객정보 업데이트 핸들러 (시술유형, 제품, 피부타입, 메모) - IME 처리 개선
  const handleRoundCustomerInfoUpdate = async (caseId: string, roundDay: number, roundInfo: Partial<RoundCustomerInfo>) => {
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
        markSaved(caseId); // IME 입력 중에도 UI 저장 상태 리셋
        return;
      }

      // 본인 케이스임을 명확히 하기 위해 customerName 확인
      const targetCase = cases.find(case_ => case_.id === caseId);
      if (!targetCase) {
        console.warn('케이스를 찾을 수 없습니다:', caseId);
        return;
      }
      
      // 본인 케이스인지 더 엄격하게 검증
      const isPersonalCase = targetCase.customerName?.trim().toLowerCase() === '본인' ||
                           targetCase.customerName?.trim() === '본인' ||
                           targetCase.customerName?.includes('본인');
      
      if (!isPersonalCase) {
        console.warn('본인 케이스가 아닙니다:', {
          caseId,
          customerName: targetCase.customerName,
          expectedName: '본인'
        });
        toast.error('본인 케이스만 수정할 수 있습니다.');
        return;
      }
      
      console.log('본인 케이스 검증 완료:', {
        caseId,
        customerName: targetCase.customerName
      });

      // 실제 API 호출로 서버에 저장
      const { updateCase, saveRoundCustomerInfo } = await import('@/lib/clinical-photos');
      const updateData: any = {};
      
      // 메모 정보를 treatmentPlan으로 업데이트 (본인 케이스 전용)
      if (roundInfo.memo !== undefined) {
        updateData.treatmentPlan = roundInfo.memo;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateCase(parseInt(caseId), updateData);
      }

      // clinical_round_info 테이블에 회차별 정보 저장 (본인 케이스 전용)
      await saveRoundCustomerInfo(parseInt(caseId), roundDay, {
        age: roundInfo.age,
        gender: roundInfo.gender,
        treatmentType: roundInfo.treatmentType,
        treatmentDate: roundInfo.date,
        products: roundInfo.products,
        skinTypes: roundInfo.skinTypes,
        memo: roundInfo.memo,
      });
      
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
      
      console.log('회차별 본인 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('회차별 본인 정보 업데이트 실패:', error);
      toast.error('정보 저장에 실패했습니다.');
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
      
      // 본래 API 호출을 통해 서버에 업데이트
      // API에서는 caseId를 number로 기대하기 때문에 변환
      await enqueue(caseId, async () => {
        await updateCase(parseInt(caseId), updates);
      });
      
      console.log('체크박스 정보가 저장되었습니다');

    } catch (error) {
      console.error('체크박스 업데이트 오류:', error);
      toast.error('체크박스 정보 저장에 실패했습니다. 다시 시도해주세요.');
      refreshCases();
    }
  };

  // 케이스 삭제 핸들러
  const handleDeleteCase = async (caseId: string) => {
    try {
      // 삭제 확인
      const confirmed = window.confirm('정말로 본인 케이스를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.');
      if (!confirmed) return;

      // 실제 케이스인 경우 API 호출로 삭제
      const { deleteCase } = await import('@/lib/clinical-photos');
      const success = await deleteCase(parseInt(caseId));
      
      if (success) {
        // 로컬 상태에서 제거
        setCases(prev => prev.filter(case_ => case_.id !== caseId));
        setCurrentRounds(prev => {
          const newRounds = { ...prev };
          delete newRounds[caseId];
          return newRounds;
        });
        
        console.log('본인 케이스가 성공적으로 삭제되었습니다.');
        toast.success('본인 케이스가 성공적으로 삭제되었습니다.');
      } else {
        throw new Error('본인 케이스 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('본인 케이스 삭제 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(`본인 케이스 삭제 실패: ${errorMessage}`);
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
      
      console.log('새로고침 - 전체 케이스 데이터:', casesData.map(c => ({ id: c.id, customerName: c.customerName })));
      
      // 본인 케이스만 정확히 찾기
      const personalCase = casesData.find(case_ => 
        case_.customerName?.trim().toLowerCase() === '본인' ||
        case_.customerName?.trim() === '본인' ||
        case_.customerName?.includes('본인')
      );
      
      console.log('새로고침 - 찾은 본인 케이스:', personalCase);
      
      if (personalCase) {
        // 제품 데이터 처리
        const productTypes = [];
        if (personalCase.cureBooster) productTypes.push('cure_booster');
        if (personalCase.cureMask) productTypes.push('cure_mask');
        if (personalCase.premiumMask) productTypes.push('premium_mask');
        if (personalCase.allInOneSerum) productTypes.push('all_in_one_serum');
        
        // 피부타입 데이터 처리
        const skinTypeData = [];
        if (personalCase.skinRedSensitive) skinTypeData.push('red_sensitive');
        if (personalCase.skinPigment) skinTypeData.push('pigment');
        if (personalCase.skinPore) skinTypeData.push('pore');
        if (personalCase.skinTrouble) skinTypeData.push('acne_trouble');
        if (personalCase.skinWrinkle) skinTypeData.push('wrinkle');
        if (personalCase.skinEtc) skinTypeData.push('other');
        
        // 사진 데이터 로드
        let photos: PhotoSlot[] = [];
        try {
          const { fetchPhotos } = await import('@/lib/clinical-photos');
          const photoData = await fetchPhotos(personalCase.id);
          photos = photoData.map(p => ({
            id: p.id,
            roundDay: p.roundDay,
            angle: p.angle as 'front' | 'left' | 'right',
            imageUrl: p.imageUrl,
            uploaded: true
          }));
        } catch (error) {
          console.error(`Failed to load photos for case ${personalCase.id}:`, error);
        }
        
        // 회차별 고객 정보 로드
        const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};
        try {
          const { fetchRoundCustomerInfo } = await import('@/lib/clinical-photos');
          const roundData = await fetchRoundCustomerInfo(personalCase.id);
          roundData.forEach(round => {
            roundCustomerInfo[round.round_number] = {
              age: round.age,
              gender: round.gender,
              treatmentType: round.treatment_type || '',
              products: round.products,
              skinTypes: round.skin_types,
              memo: (round.memo || '').replace(/^\[본인\]\s*/, ''),
              date: round.treatment_date || ''
            };
          });
        } catch (error) {
          console.error(`Failed to load round info for case ${personalCase.id}:`, error);
        }
        
        const transformedCase: ClinicalCase = {
          id: personalCase.id.toString(),
          customerName: '본인',
          status: personalCase.status === 'archived' ? 'active' : (personalCase.status as CaseStatus),
          createdAt: personalCase.createdAt.split('T')[0],
          consentReceived: personalCase.consentReceived,
          consentImageUrl: personalCase.consentImageUrl,
          photos: photos,
          customerInfo: {
            name: '본인',
            products: productTypes,
            skinTypes: skinTypeData,
            memo: personalCase.treatmentPlan ? personalCase.treatmentPlan.replace(/^\[본인\]\s*/, '') : ''
          },
          roundCustomerInfo: roundCustomerInfo,
          cureBooster: personalCase.cureBooster || false,
          cureMask: personalCase.cureMask || false,
          premiumMask: personalCase.premiumMask || false,
          allInOneSerum: personalCase.allInOneSerum || false,
          skinRedSensitive: personalCase.skinRedSensitive || false,
          skinPigment: personalCase.skinPigment || false,
          skinPore: personalCase.skinPore || false,
          skinTrouble: personalCase.skinTrouble || false,
          skinWrinkle: personalCase.skinWrinkle || false,
          skinEtc: personalCase.skinEtc || false
        };
        
        setCases([transformedCase]);
        console.log('케이스 데이터 새로고침 완료');
      } else {
        console.log('새로고침 시 본인 케이스를 찾을 수 없습니다.');
        setCases([]);
      }
    } catch (error) {
      console.error('케이스 데이터 새로고침 실패:', error);
      toast.error('케이스 새로고침에 실패했습니다.');
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
            <p className="text-center text-muted-foreground">본인 임상사진 업로드 페이지를 준비하는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (!isKol) {
    return redirect('/');
  }

  // 전체 저장 핸들러
  const handleSaveAll = async (caseId: string) => {
    markSaving(caseId);
    try {
      const targetCase = cases.find(c => c.id === caseId);
      if (!targetCase) return;

      const roundDay = currentRounds[caseId] || 1;
      const roundInfo = targetCase.roundCustomerInfo[roundDay];

      await Promise.all([
        roundInfo ? handleRoundCustomerInfoUpdate(caseId, roundDay, roundInfo) : Promise.resolve(),
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
              <div className="flex items-center justify-center max-w-2xl mx-auto">
                <Button variant="default" size="sm" asChild>
                  <Link href="/kol-new/clinical-photos">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                  </Link>
                </Button>
              </div>
            </div>

            {/* 케이스 */}
            <div className="space-y-5 p-4 md:p-6 pt-6">
              {cases.length > 0 ? (
                cases.slice(0, 1).map((case_) => (
                  <Card 
                    key={case_.id}
                    className="border transition-all duration-200 shadow-sm hover:shadow-md rounded-xl bg-white border-gray-100"
                  >
                    <div>
                    <CardHeader className="pb-4 bg-gray-50/30 rounded-t-xl">
                      {/* 첫 번째 줄: 본인 임상사진 + 동의/미동의 + 진행중/완료 */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-800 truncate">본인 임상사진</h3>
                          {/* 완료 상태인데 동의서가 없으면 경고 */}
                          {case_.status === 'completed' && case_.consentReceived && !case_.consentImageUrl && (
                            <span className="text-orange-500 flex-shrink-0">⚠️</span>
                          )}
                        </div>
                        
                        {/* 오른쪽 컨트롤 그룹: 동의/미동의 + 진행 상태 + 삭제 */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* 동의/미동의 탭 */}
                          <div className="flex bg-gray-100/70 p-1 rounded-lg">
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
                            status={case_.status}
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
                                    본인 동의서
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
                      <div className="space-y-3 border-2 border-biofox-blue-violet/20 rounded-lg p-4 bg-biofox-blue-violet/5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-biofox-blue-violet">본인 정보</h3>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-biofox-blue-violet/30">
                              {(currentRounds[case_.id] || 1) === 1 ? 'Before' : `${(currentRounds[case_.id] || 1) - 1}회차`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveAll(case_.id)}
                            id={`save-all-${case_.id}`}
                            disabled={saveStatus[case_.id]==='saving'}
                            className="text-xs px-3 py-1 h-7 border-biofox-blue-violet/30 hover:bg-biofox-blue-violet/10 hover:border-biofox-blue-violet/50 transition-all duration-200 cursor-pointer flex items-center gap-1"
                          >
                            {saveStatus[case_.id]==='saving' && (
                              <>
                                <Save className="h-3 w-3 mr-1 animate-spin" /> 저장 중...
                              </>
                            )}
                            {saveStatus[case_.id]==='saved' && (
                              <>✅ 저장됨</>
                            )}
                            {saveStatus[case_.id]==='error' && (
                              <>❌ 오류</>
                            )}
                            {(!saveStatus[case_.id] || saveStatus[case_.id]==='idle') && (
                              <>
                                <Save className="h-3 w-3 mr-1" /> 전체저장
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 날짜 */}
                          <div className="flex items-center">
                            <Label htmlFor={`date-${case_.id}`} className="text-xs font-medium w-14 shrink-0 text-gray-600">날짜</Label>
                            <Input
                              id={`date-${case_.id}`}
                              type="date"
                              value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.date || ''}
                              onChange={async (e) => {
                                const newValue = e.target.value;
                                
                                // 즉시 로컬 상태 업데이트
                                setCases(prev => prev.map(caseItem => 
                                  caseItem.id === case_.id 
                                    ? { 
                                        ...caseItem, 
                                        roundCustomerInfo: {
                                          ...caseItem.roundCustomerInfo,
                                          [currentRounds[case_.id] || 1]: { 
                                            ...caseItem.roundCustomerInfo[currentRounds[case_.id] || 1],
                                            date: newValue
                                          }
                                        }
                                      }
                                    : caseItem
                                ));

                                // 자동 저장
                                try {
                                  await handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { date: newValue });
                                } catch (error) {
                                  console.error('날짜 자동 저장 실패:', error);
                                }
                              }}
                              className="flex-1 text-xs h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                            />
                          </div>
                          
                          {/* 관리 유형 */}
                          <div className="flex items-center">
                            <Label className="text-xs font-medium w-14 shrink-0 text-gray-600">관리유형</Label>
                            <Select
                              value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.treatmentType || ''}
                              onValueChange={async (value) => {
                                // 즉시 로컬 상태 업데이트
                                setCases(prev => prev.map(item => 
                                  item.id === case_.id 
                                    ? { 
                                        ...item, 
                                        roundCustomerInfo: {
                                          ...item.roundCustomerInfo,
                                          [currentRounds[case_.id] || 1]: { 
                                            ...item.roundCustomerInfo[currentRounds[case_.id] || 1],
                                            treatmentType: value
                                          }
                                        }
                                      }
                                    : item
                                ));
                                
                                // 자동 저장
                                try {
                                  await handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { treatmentType: value });
                                } catch (error) {
                                  console.error('관리유형 자동 저장 실패:', error);
                                }
                              }}
                            >
                              <SelectTrigger 
                                data-treatment-select={case_.id}
                                className="flex-1 text-sm h-9 border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                              >
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
                      <div className="space-y-2 border-2 border-biofox-blue-violet/20 rounded-lg p-4 bg-biofox-blue-violet/5">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-biofox-blue-violet">홈케어 제품</Label>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-biofox-blue-violet/30">
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
                                hover:bg-biofox-blue-violet/10
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
                                    // prev 기준 계산
                                    setCases(prev => prev.map(c => {
                                      if (c.id !== case_.id) return c;
                                      const prevRound = c.roundCustomerInfo[currentRound] || { treatmentType:'', products:[], skinTypes:[], memo:'', date:'' };
                                      updatedProducts = isChecked ? [...prevRound.products, product.value] : prevRound.products.filter(p=>p!==product.value);
                                      return { ...c, roundCustomerInfo: { ...c.roundCustomerInfo, [currentRound]: { ...prevRound, products: updatedProducts } } };
                                    }));
                                    
                                    // Boolean 필드 매핑 객체 먼저 선언
                                    const boolUpdates: Partial<{ 
                                      cureBooster: boolean; 
                                      cureMask: boolean; 
                                      premiumMask: boolean; 
                                      allInOneSerum: boolean; 
                                    }> = {};
                                    
                                    // prev 기준 계산 및 상태 반영
                                    switch (product.value) {
                                      case 'cure_booster':
                                        boolUpdates.cureBooster = isChecked;
                                        break;
                                      case 'cure_mask':
                                        boolUpdates.cureMask = isChecked;
                                        break;
                                      case 'premium_mask':
                                        boolUpdates.premiumMask = isChecked;
                                        break;
                                      case 'all_in_one_serum':
                                        boolUpdates.allInOneSerum = isChecked;
                                        break;
                                    }
                                    
                                    // 즉시 로컬 상태 업데이트
                                    setCases(prev => prev.map(c => 
                                      c.id === case_.id 
                                        ? { 
                                            ...c, 
                                            ...boolUpdates,
                                            roundCustomerInfo: {
                                              ...c.roundCustomerInfo,
                                              [currentRound]: {
                                                ...currentRoundInfo,
                                                products: updatedProducts
                                              }
                                            }
                                          }
                                        : c
                                    ));
                                    
                                    // 백그라운드에서 저장
                                    try {
                                      await handleRoundCustomerInfoUpdate(case_.id, currentRound, { 
                                        products: updatedProducts 
                                      });
                                      if (Object.keys(boolUpdates).length > 0) {
                                        updateCaseCheckboxes(case_.id, boolUpdates);
                                      }
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
                                      toast.error('제품 선택 저장에 실패했습니다.');
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
                      <div className="space-y-2 border-2 border-biofox-blue-violet/20 rounded-lg p-4 bg-biofox-blue-violet/5">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-biofox-blue-violet">고객 피부타입</Label>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-biofox-blue-violet/30">
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
                                hover:bg-biofox-blue-violet/10
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
                                    // 현재 회차의 피부타입 목록 업데이트
                                    const updatedSkinTypes = checked
                                      ? [...currentRoundInfo.skinTypes, skinType.value]
                                      : currentRoundInfo.skinTypes.filter(s => s !== skinType.value);
                                    
                                    // Boolean 필드 매핑
                                    const boolUpdates: Partial<{ 
                                      skinRedSensitive: boolean; 
                                      skinPigment: boolean; 
                                      skinPore: boolean; 
                                      skinTrouble: boolean; 
                                      skinWrinkle: boolean; 
                                      skinEtc: boolean; 
                                    }> = {};
                                    switch (skinType.value) {
                                      case 'red_sensitive':
                                        boolUpdates.skinRedSensitive = checked as boolean;
                                        break;
                                      case 'pigment':
                                        boolUpdates.skinPigment = checked as boolean;
                                        break;
                                      case 'pore':
                                        boolUpdates.skinPore = checked as boolean;
                                        break;
                                      case 'acne_trouble':
                                        boolUpdates.skinTrouble = checked as boolean;
                                        break;
                                      case 'wrinkle':
                                        boolUpdates.skinWrinkle = checked as boolean;
                                        break;
                                      case 'other':
                                        boolUpdates.skinEtc = checked as boolean;
                                        break;
                                    }
                                    
                                    // 즉시 로컬 상태 업데이트
                                    setCases(prev => prev.map(c => 
                                      c.id === case_.id 
                                        ? { 
                                            ...c, 
                                            ...boolUpdates,
                                            roundCustomerInfo: {
                                              ...c.roundCustomerInfo,
                                              [currentRound]: {
                                                ...currentRoundInfo,
                                                skinTypes: updatedSkinTypes
                                              }
                                            }
                                          }
                                        : c
                                    ));
                                    
                                    // 백그라운드에서 저장
                                    try {
                                      await handleRoundCustomerInfoUpdate(case_.id, currentRound, { 
                                        skinTypes: updatedSkinTypes 
                                      });
                                      if (Object.keys(boolUpdates).length > 0) {
                                        updateCaseCheckboxes(case_.id, boolUpdates);
                                      }
                                    } catch (error) {
                                      console.error('피부타입 선택 저장 실패:', error);
                                      // 실패 시 상태 되돌리기
                                      const revertedSkinTypes = checked
                                        ? currentRoundInfo.skinTypes.filter(s => s !== skinType.value)
                                        : [...currentRoundInfo.skinTypes, skinType.value];
                                      
                                      setCases(prev => prev.map(c => 
                                        c.id === case_.id 
                                          ? { 
                                              ...c, 
                                              roundCustomerInfo: {
                                                ...c.roundCustomerInfo,
                                                [currentRound]: {
                                                  ...currentRoundInfo,
                                                  skinTypes: revertedSkinTypes
                                                }
                                              }
                                            }
                                          : c
                                      ));
                                      toast.error('피부타입 선택 저장에 실패했습니다.');
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
                        <div className="flex items-center">
                          <Label htmlFor={`memo-${case_.id}`} className="text-sm font-medium text-gray-700">특이사항</Label>
                        </div>
                        <Textarea
                          id={`memo-${case_.id}`}
                          value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.memo || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            
                            // 즉시 로컬 상태 업데이트 (UI 반응성을 위해)
                            setCases(prev => prev.map(caseItem => 
                              caseItem.id === case_.id 
                                ? { 
                                    ...caseItem, 
                                    roundCustomerInfo: {
                                      ...caseItem.roundCustomerInfo,
                                      [currentRounds[case_.id] || 1]: { 
                                        treatmentType: '',
                                        date: '',
                                        ...caseItem.roundCustomerInfo[currentRounds[case_.id] || 1],
                                        memo: newValue
                                      }
                                    }
                                  }
                                : caseItem
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
                            // 한글 입력 완료 후에도 디바운스를 통해 저장하도록 처리
                            const debounceKey = `memo-${case_.id}-${currentRounds[case_.id] || 1}`;
                            debouncedUpdate(debounceKey, () => {
                              handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { memo: e.currentTarget.value });
                            }, 800);
                          }}
                          placeholder="해당 회차 관련 특이사항을 입력하세요..."
                          className="w-full min-h-[80px] border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                        />

                      </div>
                          </CardContent>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 임상 케이스가 없습니다</h3>
                    <p className="text-gray-500 mb-4">본인의 임상 케이스를 등록해보세요</p>
                  </CardContent>
                </Card>
              )}
            </div>

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
          <SheetDialogTitle className="sr-only">모바일 메뉴</SheetDialogTitle>
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