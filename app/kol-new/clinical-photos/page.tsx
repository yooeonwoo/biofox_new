'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KolHeader from "../../components/layout/KolHeader";
import KolSidebar from "../../components/layout/KolSidebar";
import KolFooter from "../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../../components/layout/KolMobileMenu";
import { fetchCases, ClinicalCase } from "@/lib/clinical-photos";

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

// 체크 아이템 컴포넌트
interface CheckItemProps {
  label: string;
  checked?: boolean;
}

const CheckItem: React.FC<CheckItemProps> = ({ label, checked }) => {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${checked ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
      {checked && <Check size={12} className="text-blue-600" />}
      <span>{label}</span>
    </div>
  );
};

// 플레이어 제품 체크박스 컴포넌트
interface PlayerProductsProps {
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;
}

const PlayerProducts: React.FC<PlayerProductsProps> = ({ 
  cureBooster, 
  cureMask, 
  premiumMask, 
  allInOneSerum 
}) => {
  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-gray-500 mb-1">플레이어 제품</div>
      <div className="flex flex-wrap gap-1">
        <CheckItem label="큐어 부스터" checked={cureBooster} />
        <CheckItem label="큐어 마스크" checked={cureMask} />
        <CheckItem label="프리미엄 마스크" checked={premiumMask} />
        <CheckItem label="올인원 세럼" checked={allInOneSerum} />
      </div>
    </div>
  );
};

// 고객 피부타입 체크박스 컴포넌트
interface SkinTypesProps {
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

const SkinTypes: React.FC<SkinTypesProps> = ({
  skinRedSensitive,
  skinPigment,
  skinPore,
  skinTrouble,
  skinWrinkle,
  skinEtc
}) => {
  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-gray-500 mb-1">고객 피부타입</div>
      <div className="flex flex-wrap gap-1">
        <CheckItem label="붉고 예민함" checked={skinRedSensitive} />
        <CheckItem label="색소/피멘" checked={skinPigment} />
        <CheckItem label="모공 늘어짐" checked={skinPore} />
        <CheckItem label="트러블/여드름" checked={skinTrouble} />
        <CheckItem label="주름/탄력" checked={skinWrinkle} />
        <CheckItem label="기타" checked={skinEtc} />
      </div>
    </div>
  );
};

export default function ClinicalPhotosPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ kol?: KolInfo } | null>(null);

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
          console.log('임상관리 - 대시보드 데이터 로드 시작...');
          const dashboardResponse = await fetch('/api/kol-new/dashboard');
          
          if (!dashboardResponse.ok) {
            console.error('대시보드 API 에러');
            return;
          }
          
          const dashboardResult = await dashboardResponse.json();
          console.log('임상관리 - 대시보드 데이터 로드 완료');
          setDashboardData(dashboardResult);
        } catch (err) {
          console.error('대시보드 데이터 로드 중 오류:', err);
        }
      };
      
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn, isKol]);

  // 케이스 목록 조회
  useEffect(() => {
    const loadCases = async () => {
      if (!isKol || loading) return;
      
      console.log('임상사진: 사용자 로딩 완료, 케이스 로드 시작');
      setCasesLoading(true);
      try {
        // 디버깅: 사용자 API 호출 확인
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        console.log('임상사진: 사용자 정보', userData);

        const casesData = await fetchCases();
        console.log('임상사진: 조회된 케이스 수', casesData.length);
        console.log('임상사진: 케이스 데이터 샘플', casesData.slice(0, 1));
        setCases(casesData);
      } catch (error) {
        console.error('임상사진: 케이스 로드 실패:', error);
      } finally {
        setCasesLoading(false);
      }
    };

    loadCases();
  }, [isKol, loading]);

  // 케이스 통계 계산
  const personalCases = cases.filter(c => c.customerName === "본인");
  const customerCases = cases.filter(c => c.customerName !== "본인");
  
  const personalProgress = personalCases.length > 0 
    ? Math.round((personalCases.filter(c => c.status === 'completed').length / personalCases.length) * 100)
    : 0;
    
  const customerProgress = customerCases.length > 0
    ? Math.round((customerCases.filter(c => c.status === 'completed').length / customerCases.length) * 100)
    : 0;

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
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
            <p className="text-center text-muted-foreground">임상사진 페이지를 준비하는 중입니다.</p>
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
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {/* 헤더 영역 */}
            <div className="mb-6">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">임상사진 관리</h1>
                <p className="text-sm text-muted-foreground mt-1">관리 전후 사진을 체계적으로 관리하세요</p>
              </div>
            </div>

            {/* 진행 현황 카드 영역 */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 본인 임상 카드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">본인 임상</CardTitle>
                  <CardDescription>내 관리 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>진행률</span>
                        <span className="font-medium">{casesLoading ? '-' : `${personalProgress}%`}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${personalProgress}%` }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {casesLoading ? '로딩 중...' : `${personalCases.length}개 케이스`}
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/kol-new/clinical-photos/upload/personal">
                        <Plus className="mr-2 h-4 w-4" />
                        업로드하기
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 고객 임상 카드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">고객 임상</CardTitle>
                  <CardDescription>고객 관리 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>진행률</span>
                        <span className="font-medium">{casesLoading ? '-' : `${customerProgress}%`}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${customerProgress}%` }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {casesLoading ? '로딩 중...' : `${customerCases.length}개 케이스`}
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/kol-new/clinical-photos/upload/customer">
                        <Plus className="mr-2 h-4 w-4" />
                        업로드하기
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            



            {/* Footer */}
            <KolFooter />
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
            shopName={"임상관리"}
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}