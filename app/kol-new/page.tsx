'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Search, 
  CoinsIcon,
  TrendingUp,
  TrendingDown,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  FileText,
  AlertTriangle
} from "lucide-react";
import SalesChart from "../../components/sales-chart";
import StoreRankingTable from "../../components/store-ranking-table";
import UpcomingTasks from "../../components/upcoming-tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import KolHeader from "../components/layout/KolHeader";
import KolSidebar from "../components/layout/KolSidebar";
import KolFooter from "../components/layout/KolFooter";
import MetricCard from "../components/dashboard/MetricCard";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../components/layout/KolMobileMenu";

// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return "0원";
  
  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  
  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 510만 4740원)
      return `${man.toLocaleString()}만 ${rest}원`;
    }
    // 나머지가 없는 경우 (예: 500만원)
    return `${man.toLocaleString()}만원`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${value.toLocaleString()}원`;
  }
};

// 대시보드 데이터 타입 정의
interface DashboardData {
  kol: {
    id: number;
    name: string;
    shopName: string;
  };
  sales: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  allowance: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  shops: {
    total: number;
    ordering: number;
    notOrdering: number;
    lastAddedDate?: string;
  };
}

// 전문점 데이터 타입 정의
interface ShopData {
  id: number;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_owner_kol?: boolean;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
  };
}

// 태스크 데이터 타입 정의
interface ActivityData {
  id: number;
  shopId?: number;
  shopName?: string;
  activityDate: string;
  content: string;
  createdAt: string;
  timeAgo: string;
  icon: React.ReactNode;
}

export default function KolNewPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [shopsData, setShopsData] = useState<ShopData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      try {
        const userRole = user.publicMetadata?.role as string || "kol";
        console.log('사용자 역할:', userRole);
        setIsKol(userRole === "kol");
      } catch (err) {
        console.error('사용자 역할 확인 중 오류:', err);
        // 기본값으로 KOL 설정
        setIsKol(true);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          setErrorDetails(null);
          
          console.log('통합 대시보드 API 호출 시작...');
          
          // 🚀 통합 API 호출로 최대 성능 최적화 (단일 요청으로 모든 데이터 로드)
          const completeResponse = await fetch('/api/kol-new/dashboard-complete');
          
          if (!completeResponse.ok) {
            const errorData = await completeResponse.json().catch(() => ({}));
            const errorMessage = errorData.error || '데이터를 불러오는데 실패했습니다.';
            const details = errorData.details || '';
            
            console.error('통합 대시보드 API 에러:', errorMessage, details);
            throw new Error(errorMessage, { cause: details });
          }
          
          const completeResult = await completeResponse.json();
          console.log('통합 대시보드 API 호출 완료');
          
          // 데이터 분해
          const { dashboard: dashboardResult, shops: shopsResult, activities: activityResult } = completeResult;
          
          // 수정: 초기 로딩 시 ordering 값이 activeShopsCount와 일치하도록 확인
          if (dashboardResult.shops) {
            console.log('초기 대시보드 데이터 shops 정보:', dashboardResult.shops);
          }
          
          setDashboardData(dashboardResult);
          console.log('전문점 데이터 구조:', shopsResult);
          
          // 전문점 데이터 가공 - shop_name 및 is_owner_kol 활용하고 매출은 만원 단위로 변환
          // 새로운 API 응답 구조(객체) 또는 이전 구조(배열) 모두 지원
          const shopsData = Array.isArray(shopsResult.shops) 
            ? shopsResult.shops  // 새 구조: { shops: [...], meta: {...} }
            : Array.isArray(shopsResult) 
              ? shopsResult      // 이전 구조: [...] (배열)
              : [];              // 기본값
          
          const formattedShops = shopsData.map((shop: any) => ({
            ...shop,
            shop_name: shop.shop_name || shop.ownerName, // API에서 shop_name을 우선적으로 사용
            sales: {
              ...shop.sales,
              // 숫자 데이터는 그대로 유지하되, StoreRankingTable 컴포넌트에서 표시 시 만원 단위로 보여짐
              total: shop.sales.total,
              product: shop.sales.product,
              device: shop.sales.device
            }
          }));
          
          setShopsData(formattedShops);
          
          // DashboardData의 shops 정보 업데이트
          // dashboardData가 이미 설정되어 있다면 업데이트
          if (dashboardData) {
            // 전문점 메타 데이터가 있으면 사용, 없으면 직접 계산
            if (shopsResult.meta) {
              console.log('대시보드 메타 데이터 상세:', {
                totalShopsCount: shopsResult.meta.totalShopsCount,
                activeShopsCount: shopsResult.meta.activeShopsCount
              });
              
              // 활성 전문점 목록 (매출이 있는 전문점)
              const activeShops = formattedShops.filter((shop: ShopData) => 
                shop.sales.hasOrdered
              );
              console.log('대시보드 직접 계산한 활성 전문점:', activeShops.length);
              console.log('대시보드 활성 전문점 목록:', activeShops.map((shop: ShopData) => ({
                name: shop.shop_name,
                hasOrdered: shop.sales.hasOrdered,
                total: shop.sales.total
              })));
              
              // 이 부분이 중요: shops.ordering에 activeShopsCount를 정확히 할당
              setDashboardData({
                ...dashboardData,
                shops: {
                  total: shopsResult.meta.totalShopsCount || 0,
                  ordering: shopsResult.meta.activeShopsCount || 0, // 활성 전문점 수
                  notOrdering: (shopsResult.meta.totalShopsCount || 0) - (shopsResult.meta.activeShopsCount || 0),
                  lastAddedDate: dashboardData.shops?.lastAddedDate // 기존 값 유지
                }
              });

              // 디버깅 로그 추가
              console.log('대시보드 전문점 데이터 설정:', {
                total: shopsResult.meta.totalShopsCount,
                ordering: shopsResult.meta.activeShopsCount,
                notOrdering: shopsResult.meta.totalShopsCount - shopsResult.meta.activeShopsCount
              });
            } else {
              // 이전 API 구조 호환성 유지 (직접 계산)
              const activeShops = formattedShops.filter((shop: ShopData) => 
                shop.sales.hasOrdered // 매출 여부만 고려
              ).length;
              
              setDashboardData({
                ...dashboardData,
                shops: {
                  total: formattedShops.length,
                  ordering: activeShops,
                  notOrdering: formattedShops.length - activeShops,
                  lastAddedDate: dashboardData.shops?.lastAddedDate // 기존 값 유지
                }
              });
            }
          }

          // 영업 일지 데이터 가공 (통합 API에서 이미 포맷팅됨)
          const formattedActivities = activityResult.map((act: any) => ({
            ...act,
            icon: act.shopId ? 
              <Store className="h-4 w-4 text-blue-500" /> : 
              <ClipboardList className="h-4 w-4 text-purple-500" />
          }));
          
          setActivityData(formattedActivities);
          setLoading(false);
          setRetryCount(0); // 성공 시 재시도 카운트 초기화
        } catch (err: unknown) {
          console.error('데이터 로드 에러:', err);
          
          // 오류 정보 설정
          if (err instanceof Error) {
            setError(err.message);
            setErrorDetails(err.cause as string || '');
          } else {
            setError('데이터를 불러오는데 실패했습니다.');
          }
          
          setLoading(false);
        }
      };
      
      
      fetchData();
    }
  }, [isLoaded, isSignedIn, isKol, retryCount]);

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
      // 로그아웃 후 홈으로 리다이렉트 (선택적)
      // window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 데이터 다시 로드
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
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

  // 데이터 로딩 중인 경우
  if (loading) {
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
  if (error) {
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
            <p className="text-center text-muted-foreground">{error}</p>
            {errorDetails && (
              <p className="text-center text-sm text-gray-500 border-t pt-2">
                {errorDetails}
              </p>
            )}
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{dashboardData?.kol?.shopName || "..."} - {dashboardData?.kol?.name || "..."} KOL</h1>
            </div>

            {/* 상단 메트릭 카드 영역 (2개 카드) */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 카드 1: 매출 & 수당 */}
              <Card>
                <CardContent className="p-4">
                  {/* 당월 매출 섹션 */}
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
                  
                  {/* 빈 공간 추가하여 높이 맞추기 */}
                  <div className="mt-1 invisible h-[21px] sm:h-[24px]">
                    <div className="flex items-center text-[10px] sm:text-xs">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                  
                  {/* 구분선 스타일 강화 */}
                  <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />

                  {/* 당월 수당 섹션 */}
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
                  {/* 전문점 현황 섹션 */}
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
                    {(() => {
                      // 마지막 전문점 추가일 (가정: dashboardData에 lastShopAddedDate가 있음)
                      const lastAddedDate = dashboardData?.shops?.lastAddedDate ? new Date(dashboardData.shops.lastAddedDate) : null;
                      
                      if (!lastAddedDate) return "최근 전문점 계약 정보가 없습니다.";
                      
                      // 오늘 날짜와의 차이 계산
                      const today = new Date();
                      const diffTime = Math.abs(today.getTime() - lastAddedDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return `${diffDays}일 동안 전문점 계약이 없었습니다.`;
                    })()}
                  </div>
                  
                  {/* 구분선 스타일 강화 */}
                  <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />

                  {/* 당월 주문 전문점 섹션 */}
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
              
              {/* 내 영업 일지 카드 - 반응형 높이 */}
              <Card className="flex flex-col h-full">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm sm:text-base md:text-lg">내 영업 일지</CardTitle>
                </CardHeader>
                
                {/* 높이 자동 조절을 위한 flex 구조 적용 */}
                <CardContent className="flex flex-1 flex-col">
                  {activityData.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-8">
                      <p className="text-center text-[10px] sm:text-xs md:text-sm text-muted-foreground">영업 일지 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {activityData.slice(0, 5).map((activity) => (
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
                
                {/* 푸터는 항상 하단에 고정 */}
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