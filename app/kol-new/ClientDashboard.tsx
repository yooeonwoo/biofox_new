'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  CoinsIcon,
  TrendingUp,
  TrendingDown,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  AlertTriangle
} from "lucide-react";
import SalesChart from "../../components/sales-chart";
import StoreRankingTable from "../../components/store-ranking-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import KolHeader from "../components/layout/KolHeader";
import KolSidebar from "../components/layout/KolSidebar";
import KolFooter from "../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../components/layout/KolMobileMenu";
import { useDashboardData } from "@/hooks/useDashboardData";

// 🚀 서버 데이터와 클라이언트 상태를 결합한 하이브리드 컴포넌트

interface ClientDashboardProps {
  initialData: any; // 서버에서 전달받은 초기 데이터
}

// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return "0원";
  
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  
  if (man > 0) {
    if (rest > 0) {
      return `${man.toLocaleString()}만 ${rest}원`;
    }
    return `${man.toLocaleString()}만원`;
  } else {
    return `${value.toLocaleString()}원`;
  }
};

export default function ClientDashboard({ initialData }: ClientDashboardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 🚀 React Query 사용 - 서버 데이터가 있으면 초기값으로 사용
  const { 
    data: dashboardCompleteData, 
    isLoading: loading, 
    error, 
    refetch 
  } = useDashboardData(initialData);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      try {
        const userRole = user.publicMetadata?.role as string || "kol";
        console.log('사용자 역할:', userRole);
        setIsKol(userRole === "kol");
      } catch (err) {
        console.error('사용자 역할 확인 중 오류:', err);
        setIsKol(true);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // 🚀 서버 데이터와 클라이언트 데이터 결합
  const finalData = dashboardCompleteData || initialData;
  const dashboardData = finalData?.dashboard;
  const shopsData = finalData?.shops?.shops || [];
  const activityData = (finalData?.activities || []).map((act: any) => ({
    ...act,
    icon: act.shopId ? 
      <Store className="h-4 w-4 text-blue-500" /> : 
      <ClipboardList className="h-4 w-4 text-purple-500" />
  }));

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 데이터 다시 로드
  const handleRetry = () => {
    refetch();
  };

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">사용자 정보를 확인하는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (!isKol) {
    return redirect('/');
  }

  // 서버 데이터도 없고 클라이언트 로딩 중인 경우
  if (!initialData && loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">데이터 로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">대시보드 정보를 불러오는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러가 발생한 경우
  if (!initialData && error) {
    const errorMessage = error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.';
    
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center items-center text-destructive mb-2">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <CardTitle className="text-center text-destructive">에러 발생</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{errorMessage}</p>
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>가능한 해결책:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
                <li>페이지 새로고침을 시도해보세요.</li>
                <li>로그아웃 후 다시 로그인해보세요.</li>
                <li>계속 오류가 발생하면 관리자에게 문의하세요.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
            >
              로그아웃
            </Button>
            <Button 
              variant="default" 
              onClick={handleRetry}
            >
              다시 시도
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <KolHeader 
        userName={dashboardData?.kol?.name}
        shopName={dashboardData?.kol?.shopName}
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
            <div className="mb-6">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                {dashboardData?.kol?.shopName || "..."} - {dashboardData?.kol?.name || "..."} KOL
                {initialData && (
                  <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                    서버 렌더링
                  </span>
                )}
              </h1>
            </div>

            {/* 상단 메트릭 카드 영역 */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 카드 1: 매출 & 수당 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 w-full overflow-hidden">
                      <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap">당월 매출:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                        {dashboardData?.sales?.currentMonth !== undefined 
                          ? formatToManUnit(dashboardData.sales.currentMonth)
                          : "0원"}
                      </span>
                    </div>
                    <div className="rounded-full bg-yellow-100 p-1 sm:p-1.5 text-yellow-700 flex-shrink-0">
                       <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  
                  <div className="mt-1 invisible h-[21px] sm:h-[24px]">
                    <div className="flex items-center text-[10px] sm:text-xs">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                  
                  <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 w-full overflow-hidden">
                      <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap">당월 수당:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                        {dashboardData?.allowance?.currentMonth !== undefined 
                          ? formatToManUnit(dashboardData.allowance.currentMonth)
                          : "0원"}
                      </span>
                    </div>
                    <div className="rounded-full bg-purple-100 p-1 sm:p-1.5 text-purple-700 flex-shrink-0">
                       <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  {dashboardData?.allowance?.growth !== undefined && (
                    <div className={`mt-1 flex items-center text-[10px] sm:text-xs ${dashboardData.allowance.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.allowance.growth >= 0 ? (
                        <TrendingUp className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                      <span>전월 대비 {Math.abs(dashboardData.allowance.growth) >= 10000 
                        ? formatToManUnit(Math.abs(dashboardData.allowance.growth)) 
                        : Math.abs(dashboardData.allowance.growth).toLocaleString() + '원'} {dashboardData.allowance.growth >= 0 ? '증가' : '감소'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 카드 2: 현황 & 주문 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-lg md:text-xl font-bold">전문점 현황:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold">
                         {dashboardData?.shops?.total || 0}곳
                      </span>
                    </div>
                    <div className="rounded-full bg-blue-100 p-1 sm:p-1.5 text-blue-700">
                       <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] sm:text-xs text-orange-500">
                    최근 전문점 계약 정보를 확인 중입니다.
                  </div>
                  
                  <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />

                   <div className="flex items-center justify-between">
                     <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-lg md:text-xl font-bold">당월 주문 전문점:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold">
                        {dashboardData?.shops?.ordering || 0}곳
                      </span>
                    </div>
                    <div className="rounded-full bg-green-100 p-1 sm:p-1.5 text-green-700">
                       <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] sm:text-xs text-red-500">
                    {dashboardData?.shops?.notOrdering || 0}곳이 아직 주문하지 않았습니다.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 테이블 및 영업 일지 영역 */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 전문점 매출 순위 카드 */}
              <Card className="flex flex-col h-full"> 
                <CardContent className="flex flex-1 flex-col p-0 overflow-auto">
                  <StoreRankingTable shops={shopsData} />
                </CardContent>
                <CardFooter className="mt-auto border-t px-6 py-3">
                  <div className="ml-auto">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/kol-new/stores"> 
                        모든 전문점 보기
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              {/* 내 영업 일지 카드 */}
              <Card className="flex flex-col h-full">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm sm:text-base md:text-lg">내 영업 일지</CardTitle>
                </CardHeader>
                
                <CardContent className="flex flex-1 flex-col">
                  {activityData.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-8">
                      <p className="text-center text-[10px] sm:text-xs md:text-sm text-muted-foreground">영업 일지 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {activityData.slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3 border-b border-gray-100 pb-2">
                          <div className="rounded-full bg-gray-100 p-1.5">
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <p className="font-medium text-xs sm:text-sm">
                                {activity.shopName ? `${activity.shopName} 방문` : '일반 활동'}
                              </p>
                              <span className="text-[10px] sm:text-xs text-gray-500">{activity.timeAgo}</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-700 line-clamp-2 mt-0.5">
                              {activity.content}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                              {activity.activityDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="mt-auto border-t px-6 py-3">
                  <div className="ml-auto">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/kol-new/activities"> 
                        모든 영업 일지 보기
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base md:text-lg">나의 월별 수당</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <SalesChart kolId={dashboardData?.kol?.id} />
                </div>
              </CardContent>
            </Card>

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
            userName={dashboardData?.kol?.name} 
            shopName={dashboardData?.kol?.shopName} 
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}