'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Search, 
  CoinsIcon,
  TrendingUp,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  FileText
} from "lucide-react";
import SalesChart from "@/components/sales-chart";
import StoreRankingTable from "@/components/store-ranking-table";
import UpcomingTasks from "@/components/upcoming-tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import KolHeader from "../components/layout/KolHeader";
import KolSidebar from "../components/layout/KolSidebar";
import KolFooter from "../components/layout/KolFooter";
import MetricCard from "../components/dashboard/MetricCard";
import { Separator } from "@/components/ui/separator";

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
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [shopsData, setShopsData] = useState<ShopData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchData = async () => {
        try {
          setLoading(true);
          // 대시보드 데이터 로드
          const dashboardResponse = await fetch('/api/kol-new/dashboard');
          if (!dashboardResponse.ok) throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
          const dashboardResult = await dashboardResponse.json();
          setDashboardData(dashboardResult);

          // 전문점 데이터 로드
          const shopsResponse = await fetch('/api/kol-new/shops');
          if (!shopsResponse.ok) throw new Error('전문점 데이터를 불러오는데 실패했습니다.');
          const shopsResult = await shopsResponse.json();
          setShopsData(shopsResult);

          // 영업 일지 데이터 로드
          const activityResponse = await fetch('/api/kol-new/activities'); 
          if (!activityResponse.ok) {
            throw new Error('영업 일지 데이터를 불러오는데 실패했습니다.');
          }
          const activityResult = await activityResponse.json();
          
          // 영업 일지 데이터 포맷팅
          const formattedActivities = activityResult.map((act: any) => {
            // 날짜 포맷팅
            const activityDate = new Date(act.activity_date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - activityDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
              id: act.id,
              shopId: act.shop_id,
              shopName: act.shop_name, // API에서 전달받는 경우
              activityDate: new Date(act.activity_date).toLocaleDateString('ko-KR'),
              content: act.content,
              createdAt: new Date(act.created_at).toLocaleDateString('ko-KR'),
              timeAgo: diffDays === 0 ? '오늘' : `${diffDays}일 전`,
              icon: act.shop_id ? 
                <Store className="h-4 w-4 text-blue-500" /> : 
                <ClipboardList className="h-4 w-4 text-purple-500" />
            };
          });
          
          setActivityData(formattedActivities);

          setLoading(false);
        } catch (err: unknown) {
          console.error('데이터 로드 에러:', err);
          setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isLoaded, isSignedIn, isKol]);

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
            <CardTitle className="text-center text-destructive">에러 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-lg md:text-xl font-bold">당월 매출:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold">
                        {dashboardData?.sales?.currentMonth?.toLocaleString() || 0}만
                      </span>
                    </div>
                    <div className="rounded-full bg-yellow-100 p-1 sm:p-1.5 text-yellow-700">
                       <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  {dashboardData?.sales?.growth && (
                    <div className="mt-1 flex items-center text-[10px] sm:text-xs text-green-600">
                      <TrendingUp className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span>전월 대비 {dashboardData.sales.growth.toLocaleString()}만 증가</span>
                    </div>
                  )}
                  
                  {/* 구분선 스타일 강화 */}
                  <div className="my-3 sm:my-4 h-[1px] bg-gray-200" />

                  {/* 당월 수당 섹션 */}
                   <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-lg md:text-xl font-bold">당월 수당:</span>
                      <span className="text-sm sm:text-lg md:text-xl font-bold">
                        {dashboardData?.allowance?.currentMonth?.toLocaleString() || 0}만
                      </span>
                    </div>
                    <div className="rounded-full bg-purple-100 p-1 sm:p-1.5 text-purple-700">
                       <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  {dashboardData?.allowance?.growth && (
                    <div className="mt-1 flex items-center text-[10px] sm:text-xs text-green-600">
                      <TrendingUp className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span>전월 대비 {dashboardData.allowance.growth.toLocaleString()}만 증가</span>
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
                <CardTitle className="text-sm sm:text-base md:text-lg">나의 월별 매출 및 수당</CardTitle>
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
    </div>
  );
}