'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { fetchCases, updateCase } from '@/lib/clinical-photos-api';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
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
        const casesData = await fetchCases();
        
        // 본인 케이스만 찾기 (본인 이름이나 특정 표시가 있는 케이스)
        const personalCase = casesData.find(case_ => case_.customerName === '본인') || casesData[0];
        
        if (personalCase) {
          // 체크박스 관련 제품 데이터 처리
          const productTypes = [];
          if (personalCase.cureBooster) productTypes.push('cure_booster');
          if (personalCase.cureMask) productTypes.push('cure_mask');
          if (personalCase.premiumMask) productTypes.push('premium_mask');
          if (personalCase.allInOneSerum) productTypes.push('allinone_serum');
          
          // 체크박스 관련 피부타입 데이터 처리
          const skinTypeData = [];
          if (personalCase.skinRedSensitive) skinTypeData.push('red_sensitive');
          if (personalCase.skinPigment) skinTypeData.push('pigmentation');
          if (personalCase.skinPore) skinTypeData.push('pores_enlarged');
          if (personalCase.skinTrouble) skinTypeData.push('acne_trouble');
          if (personalCase.skinWrinkle) skinTypeData.push('wrinkles_elasticity');
          if (personalCase.skinEtc) skinTypeData.push('other');
          
          // 사진 데이터 로드
          let photos: PhotoSlot[] = [];
          try {
            const { fetchPhotos } = await import('@/lib/clinical-photos-api');
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
          
          // API 응답 데이터를 컴포넌트 형식에 맞게 변환
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
              memo: personalCase.treatmentPlan || ''
            },
            roundCustomerInfo: {
              1: {
                treatmentType: '',
                products: productTypes,
                skinTypes: skinTypeData,
                memo: personalCase.treatmentPlan || '',
                date: personalCase.createdAt.split('T')[0]
              }
            },
            // 본래 API의 boolean 필드를 그대로 설정
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
        } else {
          // 케이스가 없으면 빈 배열
          setCases([]);
        }
      } catch (error) {
        console.error('Failed to load cases:', error);
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



  // 사진 업로드 핸들러
  const handlePhotoUpload = async (caseId: string, roundDay: number, angle: string, file?: File): Promise<void> => {
    console.log('Photo upload:', { caseId, roundDay, angle });
    
    if (file) {
      try {
        // 실제 케이스의 경우 Supabase에 업로드
        const { uploadPhoto } = await import('@/lib/clinical-photos-api');
        await uploadPhoto(parseInt(caseId), roundDay, angle, file);
        
        // 업로드 후 사진 목록 다시 로드
        const { fetchPhotos } = await import('@/lib/clinical-photos-api');
        const photos = await fetchPhotos(parseInt(caseId));
        
        // 업로드된 사진의 URL 찾기
        const uploadedPhoto = photos.find(p => p.roundDay === roundDay && p.angle === angle);
        const imageUrl = uploadedPhoto?.imageUrl || URL.createObjectURL(file);
        
        // 해당 케이스의 사진 업데이트
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
        
        console.log('사진이 성공적으로 업로드되었습니다.');
      } catch (error) {
        console.error('사진 업로드 실패:', error);
        alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
        throw error;
      }
    }
  };

  // 사진 삭제 핸들러
  const handlePhotoDelete = async (caseId: string, roundDay: number, angle: string): Promise<void> => {
    try {
      // 실제 삭제 API 호출
      const { deletePhoto } = await import('@/lib/clinical-photos-api');
      await deletePhoto(parseInt(caseId), roundDay, angle);
      
      // 로컬 상태 업데이트
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
      
      console.log('사진이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.');
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

  // 🚀 본인 정보 저장 함수 (날짜, 관리유형, 특이사항)
  const savePersonalInfo = async (caseId: string) => {
    try {
      const currentRound = currentRounds[caseId] || 1;
      const case_ = cases.find(c => c.id === caseId);
      
      if (!case_) {
        throw new Error('케이스를 찾을 수 없습니다.');
      }

      const roundInfo = case_.roundCustomerInfo[currentRound];
      
      if (!roundInfo) {
        throw new Error('회차 정보를 찾을 수 없습니다.');
      }

      // 저장할 데이터 준비
      const updateData = {
        treatmentPlan: roundInfo.memo || '', // 특이사항을 treatmentPlan에 저장
        // 날짜와 관리유형은 추가 필드로 저장 (API 스키마에 따라 조정 필요)
        ...(roundInfo.date && { treatmentDate: roundInfo.date }),
        ...(roundInfo.treatmentType && { treatmentType: roundInfo.treatmentType })
      };

      // API 호출하여 서버에 저장
      await updateCase(parseInt(caseId), updateData);
      
      console.log('본인 정보가 성공적으로 저장되었습니다.');
      alert('본인 정보가 저장되었습니다!');
      
    } catch (error) {
      console.error('본인 정보 저장 실패:', error);
      alert('정보 저장에 실패했습니다. 다시 시도해주세요.');
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
      await updateCase(parseInt(caseId), updates);
      
      console.log('체크박스 정보가 저장되었습니다');

    } catch (error) {
      console.error('체크박스 업데이트 오류:', error);
      // 오류 발생 시 로칼 상태 되돌리기
      // 페이지 리로드
      window.location.reload();
      
      console.error('체크박스 정보 저장 중 오류가 발생하였습니다');
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
      
      // 본인 케이스만 찾기
      const personalCase = casesData.find(case_ => case_.customerName === '본인') || casesData[0];
      
      if (personalCase) {
        // 제품 데이터 처리
        const productTypes = [];
        if (personalCase.cureBooster) productTypes.push('cure_booster');
        if (personalCase.cureMask) productTypes.push('cure_mask');
        if (personalCase.premiumMask) productTypes.push('premium_mask');
        if (personalCase.allInOneSerum) productTypes.push('allinone_serum');
        
        // 피부타입 데이터 처리
        const skinTypeData = [];
        if (personalCase.skinRedSensitive) skinTypeData.push('red_sensitive');
        if (personalCase.skinPigment) skinTypeData.push('pigmentation');
        if (personalCase.skinPore) skinTypeData.push('pores_enlarged');
        if (personalCase.skinTrouble) skinTypeData.push('acne_trouble');
        if (personalCase.skinWrinkle) skinTypeData.push('wrinkles_elasticity');
        if (personalCase.skinEtc) skinTypeData.push('other');
        
        // 사진 데이터 로드
        let photos: PhotoSlot[] = [];
        try {
          const { fetchPhotos } = await import('@/lib/clinical-photos-api');
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
            memo: personalCase.treatmentPlan || ''
          },
          roundCustomerInfo: {
            1: {
              treatmentType: '',
              products: productTypes,
              skinTypes: skinTypeData,
              memo: personalCase.treatmentPlan || '',
              date: personalCase.createdAt.split('T')[0]
            }
          },
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
        setCases([]);
      }
    } catch (error) {
      console.error('케이스 데이터 새로고침 실패:', error);
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
                      {/* 첫 번째 줄: 본인 임상사진 + 진행중/완료 */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg font-medium text-gray-800 truncate">본인 임상사진</span>
                        </div>

                        {/* 진행중/완료 탭 */}
                        <div className="flex-shrink-0">
                          <CaseStatusTabs
                            status={case_.status}
                            onStatusChange={(status) => handleCaseStatusChange(case_.id, status)}
                          />
                        </div>
                      </div>
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-biofox-blue-violet">본인 정보</h3>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-biofox-blue-violet/20">
                            {currentRounds[case_.id] || 1}회차
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 날짜 */}
                          <div className="flex items-center">
                            <Label htmlFor={`date-${case_.id}`} className="text-xs font-medium w-14 shrink-0 text-gray-600">날짜</Label>
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
                          
                          {/* 관리 유형 */}
                          <div className="flex items-center">
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

                          {/* 🚀 본인 정보 저장 버튼 */}
                          <div className="pt-2">
                            <Button
                              onClick={() => savePersonalInfo(case_.id)}
                              className="w-full h-8 text-xs bg-biofox-blue-violet hover:bg-biofox-blue-violet/90 text-white"
                              size="sm"
                            >
                              <Save className="mr-1 h-3 w-3" />
                              본인 정보 저장
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* 블록 3: 홈케어 제품 */}
                      <div className="space-y-2 border-2 border-biofox-blue-violet/20 rounded-lg p-4 bg-biofox-blue-violet/5">
                        <Label className="text-sm font-medium text-biofox-blue-violet">홈케어 제품</Label>
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
                            // 제품 데이터를 직접 boolean 필드로 매핑
                            let isSelected = false;
                            let fieldName = '';
                            
                            switch(product.value) {
                              case 'cure_booster':
                                isSelected = case_.cureBooster || false;
                                fieldName = 'cureBooster';
                                break;
                              case 'cure_mask':
                                isSelected = case_.cureMask || false;
                                fieldName = 'cureMask';
                                break;
                              case 'premium_mask':
                                isSelected = case_.premiumMask || false;
                                fieldName = 'premiumMask';
                                break;
                              case 'allinone_serum':
                                isSelected = case_.allInOneSerum || false;
                                fieldName = 'allInOneSerum';
                                break;
                            }
                            
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
                                  onCheckedChange={(checked) => {
                                    // 백엔드 boolean 필드 직접 업데이트
                                    const updates = { [fieldName]: checked };
                                    updateCaseCheckboxes(case_.id, updates);
                                    
                                    // 기존 products 배열도 함께 업데이트 (기존 기능 유지)
                                    const currentProducts = currentRoundInfo.products || [];
                                    const newProducts = checked
                                      ? [...currentProducts, product.value]
                                      : currentProducts.filter(p => p !== product.value);
                                    handleRoundCustomerInfoUpdate(case_.id, currentRound, { products: newProducts });
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
                        <Label className="text-sm font-medium text-biofox-blue-violet">고객 피부타입</Label>
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
                            
                            // 피부타입 데이터를 직접 boolean 필드로 매핑
                            let isSelected = false;
                            let fieldName = '';
                            
                            switch(skinType.value) {
                              case 'red_sensitive':
                                isSelected = case_.skinRedSensitive || false;
                                fieldName = 'skinRedSensitive';
                                break;
                              case 'pigmentation':
                                isSelected = case_.skinPigment || false;
                                fieldName = 'skinPigment';
                                break;
                              case 'pores_enlarged':
                                isSelected = case_.skinPore || false;
                                fieldName = 'skinPore';
                                break;
                              case 'acne_trouble':
                                isSelected = case_.skinTrouble || false;
                                fieldName = 'skinTrouble';
                                break;
                              case 'wrinkles_elasticity':
                                isSelected = case_.skinWrinkle || false;
                                fieldName = 'skinWrinkle';
                                break;
                              case 'other':
                                isSelected = case_.skinEtc || false;
                                fieldName = 'skinEtc';
                                break;
                            }
                            
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
                                  onCheckedChange={(checked) => {
                                    // 백엔드 boolean 필드 직접 업데이트
                                    const updates = { [fieldName]: checked };
                                    updateCaseCheckboxes(case_.id, updates);
                                    
                                    // 기존 skinTypes 배열도 함께 업데이트 (기존 기능 유지)
                                    const currentSkinTypes = currentRoundInfo.skinTypes || [];
                                    const newSkinTypes = checked
                                      ? [...currentSkinTypes, skinType.value]
                                      : currentSkinTypes.filter(s => s !== skinType.value);
                                    handleRoundCustomerInfoUpdate(case_.id, currentRound, { skinTypes: newSkinTypes });
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
                      <div className="space-y-3 border-2 border-biofox-blue-violet/20 rounded-lg p-4 bg-biofox-blue-violet/5">
                        <Label htmlFor={`memo-${case_.id}`} className="text-sm font-medium text-biofox-blue-violet">특이사항</Label>
                        <Textarea
                          id={`memo-${case_.id}`}
                          value={case_.roundCustomerInfo[currentRounds[case_.id] || 1]?.memo || ''}
                          onChange={(e) => 
                            handleRoundCustomerInfoUpdate(case_.id, currentRounds[case_.id] || 1, { memo: e.target.value })
                          }
                          placeholder="해당 회차 관련 특이사항을 입력하세요..."
                          className="w-full min-h-[80px] border-gray-200 focus:border-biofox-blue-violet focus:ring-1 focus:ring-biofox-blue-violet/30 transition-all duration-200"
                        />
                        
                        {/* 🚀 전체 정보 저장 버튼 */}
                        <Button
                          onClick={() => savePersonalInfo(case_.id)}
                          className="w-full h-9 text-sm bg-biofox-blue-violet hover:bg-biofox-blue-violet/90 text-white"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          전체 정보 저장
                        </Button>
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