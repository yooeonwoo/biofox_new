'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CoinsIcon,
  TrendingUp,
  TrendingDown,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import SalesChart from '../../components/sales-chart';
import StoreRankingTable from '../../components/store-ranking-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const formatToManUnit = (value: number): string => {
  if (value === 0) return '0원';
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  if (man > 0) {
    if (rest > 0) return `${man.toLocaleString()}만 ${rest}원`;
    return `${man.toLocaleString()}만원`;
  }
  return `${value.toLocaleString()}원`;
};

export default function KolNewPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // 이메일 기반 프로필 조회 (표준 패턴)
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const kolId = profile?._id;
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData(kolId);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      redirect('/');
    }
  }, [isAuthLoading, isAuthenticated]);

  // 로딩 상태 세분화
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">인증 확인 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">사용자 정보를 확인하는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // 프로필 로딩 중
  if (profile === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">프로필 로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">프로필 정보를 불러오는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 프로필을 찾을 수 없는 경우
  if (profile === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex items-center justify-center text-destructive">
              <AlertTriangle className="mr-2 h-8 w-8" />
              <CardTitle className="text-center text-destructive">
                프로필을 찾을 수 없습니다
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              관리자에게 문의하여 프로필을 생성해주세요.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="default" onClick={() => redirect('/signin')} className="w-full">
              로그인 페이지로 이동
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 대시보드 데이터 로딩 중
  if (isLoading) {
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

  if (error) {
    const errorMessage = (error as any)?.message || '데이터를 불러오는데 실패했습니다.';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex items-center justify-center text-destructive">
              <AlertTriangle className="mr-2 h-8 w-8" />
              <CardTitle className="text-center text-destructive">에러 발생</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{errorMessage}</p>
          </CardContent>
          <CardFooter>
            <Button variant="default" onClick={refetch} className="w-full">
              다시 시도
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
          {dashboardData?.kol?.shopName || '...'} - {dashboardData?.kol?.name || '...'} KOL
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex w-full flex-col overflow-hidden md:flex-row md:items-baseline md:gap-2">
                <span className="whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                  당월 매출:
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                  {dashboardData?.stats?.currentMonth?.sales !== undefined
                    ? formatToManUnit(dashboardData.stats.currentMonth.sales)
                    : '0원'}
                </span>
              </div>
              <div className="flex-shrink-0 rounded-full bg-yellow-100 p-1 text-yellow-700 sm:p-1.5">
                <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="invisible mt-1 h-[21px] sm:h-[24px]">
              <div className="flex items-center text-[10px] sm:text-xs">
                <span>&nbsp;</span>
              </div>
            </div>
            <div className="my-3 h-[1px] bg-gray-200 sm:my-4" />
            <div className="flex items-center justify-between">
              <div className="flex w-full flex-col overflow-hidden md:flex-row md:items-baseline md:gap-2">
                <span className="whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                  당월 수당:
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                  {dashboardData?.stats?.currentMonth?.commission !== undefined
                    ? formatToManUnit(dashboardData.stats.currentMonth.commission)
                    : '0원'}
                </span>
              </div>
              <div className="flex-shrink-0 rounded-full bg-purple-100 p-1 text-purple-700 sm:p-1.5">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            {dashboardData?.stats?.growth?.commission !== undefined && (
              <div
                className={`mt-1 flex items-center text-[10px] sm:text-xs ${dashboardData.stats.growth.commission >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {dashboardData.stats.growth.commission >= 0 ? (
                  <TrendingUp className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span>
                  전월 대비{' '}
                  {Math.abs(dashboardData.stats.growth.commission) >= 10000
                    ? formatToManUnit(Math.abs(dashboardData.stats.growth.commission))
                    : Math.abs(dashboardData.stats.growth.commission).toLocaleString() + '원'}{' '}
                  {dashboardData.stats.growth.commission >= 0 ? '증가' : '감소'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold sm:text-lg md:text-xl">전문점 현황:</span>
                <span className="text-sm font-bold sm:text-lg md:text-xl">
                  {dashboardData?.shops?.total || 0}곳
                </span>
              </div>
              <div className="rounded-full bg-blue-100 p-1 text-blue-700 sm:p-1.5">
                <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1 text-[10px] text-orange-500 sm:text-xs">전문점 관리 현황</div>
            <div className="my-3 h-[1px] bg-gray-200 sm:my-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold sm:text-lg md:text-xl">당월 주문 전문점:</span>
                <span className="text-sm font-bold sm:text-lg md:text-xl">
                  {dashboardData?.shops?.ordering || 0}곳
                </span>
              </div>
              <div className="rounded-full bg-green-100 p-1 text-green-700 sm:p-1.5">
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1 text-[10px] text-red-500 sm:text-xs">
              {dashboardData?.shops?.notOrdering || 0}곳이 아직 주문하지 않았습니다.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card className="flex h-full flex-col">
          <CardContent className="flex flex-1 flex-col overflow-auto p-0">
            <StoreRankingTable shops={dashboardData?.shops?.list || []} />
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
      </div>

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
    </div>
  );
}
